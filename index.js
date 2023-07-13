const fs = require('fs').promises;

var addon = require('bindings')('great_big_file_reader');

console.log(addon.great_big_file_reader()); // 'world'

async function openFile(filePath) {
  try {
    const fileDescriptor = await fs.open(filePath, 'r');

    console.log(`fileDescriptor ${JSON.stringify(fileDescriptor)} ${typeof fileDescriptor.fd}`);

    const len = addon.getFileLength(fileDescriptor.fd);
    console.log(`file ${filePath} length is ${len}`);

    console.log(`mmapping ${filePath}`); 

    let object = addon.mmapFileFromFileDescriptor(fileDescriptor.fd);

    console.log(`object ${JSON.stringify(object)}`); 

    await fileDescriptor.close();
    console.log('File closed successfully.');
  } catch (error) {
    console.error('Error caught: ', error);
  }
}

// Example usage
const filePath = '/Users/justin.heyes-jones/projects/lantern/build/sparkey100million.spl';
openFile(filePath);
