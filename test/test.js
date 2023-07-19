import test from 'tape';
import { promises } from 'fs';
import * as fs from 'fs';
import { MMapping } from '../lib/index.js';  

const testFilePath = './testfile.dat';

async function writeUInt64File(filePath) {
  let numbersToWrite = 512;
  const buffer = Buffer.allocUnsafe(numbersToWrite * 8); // 8 bytes per 64-bit unsigned integer

  try {
    for (let i=0; i < numbersToWrite; i++) {
      buffer.writeBigUInt64LE(BigInt(i), i * 8);
    }
    await promises.writeFile(filePath, buffer);

    console.log(`Created test file ${filePath}`);
  } catch (err) {
    console.error('Error writing the file:', err);
  }
}

await writeUInt64File(testFilePath);

test('mapping with two buffers happy path', async function(t) {
  const fh = await promises.open(testFilePath, 'r');
  // mmap the file
  let mmapping = new MMapping(testFilePath, fh.fd);

  // open a buffer at the first 1kb
  let buffer = mmapping.getBuffer(0n, 1024);
  let first = buffer.readBigUInt64LE(0);
  t.equal(first, 0n);
  let last = buffer.readBigUint64LE(1024 - 8);
  t.equal(last, 127n);

  // open a second buffer in the last 1kb of the file
  let buffer2 = mmapping.getBuffer(3072n, 1024);
  first = buffer2.readBigUInt64LE(0);
  t.equal(first, 384n);
  last = buffer2.readBigUint64LE(1024 - 8);
  t.equal(last, 511n);

  mmapping.unmap();
  t.end();
});

test.onFinish(() => {
  // Removing test file
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log('Test file deleted successfully.');
  } else {
    console.log('Test file does not exist.');
  }
});
