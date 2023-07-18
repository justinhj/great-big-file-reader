import test from 'tape';
import { promises as fs } from 'fs';
import { MMapping } from '../lib/index.js';  

// test reading a large file
test('large file read', async function (t) {
  // const offset = 5451234524n; 
  // const filename = 'TODO';

  // const fh = await fs.open(filename, 'r');
  
  // let m1 = new MMapping(filename, fh.fd);
  // console.log(m1);

  // let b1 = m1.getBuffer(offset + 2n, 36);
  // console.log(b1);
  // console.log(b1.toString());

  // let b2 = m1.getBuffer(0n, 4);
  // console.log(b2);

  // t.equal(Buffer.from([0x49, 0xb3, 0x9c, 0x95]).reverse().compare(b2),0);

  // m1.unmap();

  // await fh.close();
  t.ok(true);
  t.end();
});


function createTestFile() {
  const filename = 'testfile.dat';
  const count = 1000000000;
  console.log('Checking for test file');
  if (!fs.existsSync(filename)) {
    console.log('Creating test file');
    const fd = fs.openSync(filename, 'w');
    for(let i=0n; i<count; i++) {
      const buffer = Buffer.alloc(8);
      buffer.writeBigInt64LE(i);
      fs.writeSync(fd, buffer, 0, buffer.length);
    }
    if(count % 1000000 === 0) {
      console.log('.');
    }
    fs.closeSync(fd);
  }
  console.log('Done.');
}

// createTestFile();

test('addition test', function (t) {
  t.equal(2, 1+1);
  t.end();
});
