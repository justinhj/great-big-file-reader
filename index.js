const fs = require('fs').promises;

var gbfr = require('bindings')('great-big-file-reader');

BigInt.prototype.toJSON = function() { return this.toString() }

async function openFile(filePath) {
  try {
    const fileHandle = await fs.open(filePath, 'r');

    // const len = gbfr.getFileLength(fileHandle.fd);
    // console.log(`file ${filePath} length is ${len}`);

    console.log(`mmapping ${filePath}`); 
    let mapping = gbfr.mmapFileFromFileDescriptor(filePath, fileHandle.fd);

    console.log(JSON.stringify(mapping));

    let buffer = gbfr.mmapGetBuffer(mapping.handle, 14359000000n, 84);
   
    console.log(`buffer ${buffer}\nlen ${buffer.length}`);

    gbfr.unmapFile(mapping.handle);

    await fileHandle.close();
    console.log('File closed successfully.');
  } catch (error) {
    console.error('Error caught: ', error);
  }
}

// Example usage
const filePath = '/Users/justin.heyes-jones/projects/lantern/build/sparkey100million.spl';
openFile(filePath);

let temp = 2;

module.exports = temp;
