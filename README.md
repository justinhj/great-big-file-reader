# Great Big File Reader

The Great Big File Reader is an npm plugin that provides an efficient way to read large files in Node.js using memory mapping (mmap). This plugin allows you to mmap read-only files into buffers, making it ideal for working with extremely large files. Since node.js has a limit on the size of its Buffer objects of about 1Gb (32-bit architectures) and 4Gb (64-bit architectures) it is not possible to simply return a Buffer that lets you read the whole memory mapped file, if it exceeds those sizes.

With Great Big File Reader you can acquire as many Buffers as you want, each with an individual offset into the file and length (where length is limited to the Buffer size limits mentioned above).

## Technical notes

node.js does not expose the memory map (mmap) operating system commands and leaves it to third party libraries like this one. Once a file is memory mapped, accessing it will cause blocking IO and/or page faults whenever the OS feels it needs to do so.

The code is written in C++ and uses the [https://github.com/nodejs/node-addon-api](node-addon-api) which is a C++ friendly wrapper around the stable C interface of the Node-API. This provides a nice compromise between performance and language facility.

## Features

- Efficient read-only access to large files using mmap.
- Not limited by node's `buffer.constants.MAX_LENGTH`
- Easy integration with Node.js applications.

## Compatibility

Since this uses the linux, bsd mmap feature, it does not currently work on the Windows operating system.

## Installation

Install the Great Big File Reader plugin using npm:

```shell
npm install great-big-file-reader
```

## Usage

Here's an example demonstrating how to use the Great Big File Reader in your Node.js application:

Note there are some interface improvements needed before this usable as a package.

```javascript
const { readFile } = require('great-big-file-reader');

async function openFile(filePath) {
  try {
    const fileHandle = await fs.open(filePath, 'r');

    // const len = gbfr.getFileLength(fileHandle.fd);
    // console.log(`file ${filePath} length is ${len}`);

    console.log(`mmapping ${filePath}`); 
    let mapping = gbfr.mapFile(filePath, fileHandle.fd);

    console.log(JSON.stringify(mapping));

    let buffer = gbfr.getBuffer(mapping.handle, 14359000000n, 84);
    console.log(`buffer ${buffer}\nlen ${buffer.length}`);

    buffer = gbfr.getBuffer(mapping.handle, 0n, 128n);
    console.log(`buffer ${buffer}\nlen ${buffer.length}`);

    gbfr.unmapFile(mapping.handle);

    await fileHandle.close();
    console.log('File closed successfully.');
  } catch (error) {
    console.error('Error caught: ', error);
  }
}
```

## Contributing

Contributions are welcome! If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

## Copyright

Copyright 2023 Justin Heyes-Jones. All Rights Reserved.

---
