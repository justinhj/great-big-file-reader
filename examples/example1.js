import { promises as fs } from 'fs';

import * as gbfr from './lib/index.js'; 

BigInt.prototype.toJSON = function() { return this.toString() }

const filePath = '/Users/justin.heyes-jones/projects/lantern/build/sparkey100million.spl';

const fh = await fs.open(filePath, 'r');

let mmapping = new gbfr.MMapping(filePath, fh.fd);

console.log(mmapping);

let buffer = mmapping.getBuffer(14359000000n, 84);
console.log(`buffer ${buffer}\nlen ${buffer.length}`);

buffer = mmapping.getBuffer(0n, 128n);
console.log(`buffer ${buffer}\nlen ${buffer.length}`);

mmapping.unmap();

console.log(mmapping);

// async function openFile(filePath) {
//   try {
//     const fileHandle = await fs.open(filePath, 'r');

//     // const len = gbfr.getFileLength(fileHandle.fd);
//     // console.log(`file ${filePath} length is ${len}`);

//     console.log(`mmapping ${filePath}`); 
//     let mapping = gbfr.mapFile(filePath, fileHandle.fd);

//     console.log(JSON.stringify(mapping));

//     let buffer = gbfr.getBuffer(mapping.handle, 14359000000n, 84);
//     console.log(`buffer ${buffer}\nlen ${buffer.length}`);

//     buffer = gbfr.getBuffer(mapping.handle, 0n, 128n);
//     console.log(`buffer ${buffer}\nlen ${buffer.length}`);

//     gbfr.unmapFile(mapping.handle);

//     await fileHandle.close();
//     console.log('File closed successfully.');
//   } catch (error) {
//     console.error('Error caught: ', error);
//   }
// }

// // Example usage
// const filePath = '/Users/justin.heyes-jones/projects/lantern/build/sparkey100million.spl';
// openFile(filePath);

// export function hello() {
//   console.log('hello from module!');
// }

// export var temp = 2;

