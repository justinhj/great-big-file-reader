import test from 'tape';
import tapSpec from 'tap-spec';

import { promises } from 'fs';
import * as fs from 'fs';
import * as buffer from 'node:buffer';
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

test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

test('mapping the whole file', async function(t) {
  const fh = await promises.open(testFilePath, 'r');
  // mmap the file
  let mmapping = new MMapping(testFilePath, fh.fd);

  let buffer = mmapping.getBuffer(0n, 4096);
  t.equal(buffer.length, 4096);

  mmapping.unmap();
  t.end();
});

BigInt.prototype.toJSON = function() { return this.toString() }
test('mapping with two buffers happy path', async function(t) {
  const fh = await promises.open(testFilePath, 'r');
  // mmap the file
  console.log('mmap');
  let mmapping = new MMapping(testFilePath, fh.fd);

  // open a buffer at the first 1kb
  console.log(`getbuffer 1 ${JSON.stringify(mmapping)}`);
  try {
    let buffer = mmapping.getBuffer(0n, 1024);
    let first = buffer.readBigUInt64LE(0);
    t.equal(first, 0n);
    let last = buffer.readBigUint64LE(1024 - 8);
    t.equal(last, 127n);
  } catch(e) {
    console.log(e.message);
  }

  // open a second buffer in the last 1kb of the file
  {
    console.log('getbuffer 2');
    let buffer2 = mmapping.getBuffer(3072n, 1024);
    let first = buffer2.readBigUInt64LE(0);
    t.equal(first, 384n);
    let last = buffer2.readBigUint64LE(1024 - 8);
    t.equal(last, 511n);
  }
  mmapping.unmap();
  t.end();
});

test('unhappy paths', async function(t) {
  const fh = await promises.open(testFilePath, 'r');
  // mmap the file
  let mmapping = new MMapping(testFilePath, fh.fd);

  t.plan(6);

  t.throws(function () {
    mmapping.getBuffer(-1n, 1024);
  }, /offset should not be negative/);

  t.throws(function () {
    mmapping.getBuffer(0n, -1024);
  }, /length should be greater than zero/);

  t.throws(function () {
    mmapping.getBuffer(4096n, 1024);
  }, /offset must be within the file/);

  t.throws(function () {
    mmapping.getBuffer(3072n, 2024);
  }, /offset plus length must be within the file/);

  t.throws(function () {
    mmapping.getBuffer(3072n, BigInt(buffer.constants.MAX_LENGTH) + 1n);
  }, /length 4294967297 exceeds the buffer\.constants\.MAX_LENGTH \(4294967296\)/);

  t.throws(function () {
    mmapping.getBuffer(0n, buffer.constants.MAX_LENGTH + 1);
  }, /length 4294967297 exceeds the buffer\.constants\.MAX_LENGTH \(4294967296\)/);

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
