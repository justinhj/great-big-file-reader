# Great Big File Reader

The Great Big File Reader is an npm plugin that provides an efficient way to read large files in Node.js using memory mapping (mmap). This plugin allows you to mmap read-only files into buffers, making it ideal for working with extremely large files. Since node.js has a limit on the size of its Buffer objects of about 1Gb (32-bit architectures) and 4Gb (64-bit architectures) it is not possible to simply return a Buffer that lets you read the whole memory mapped file, if it exceeds those sizes.

With Great Big File Reader you can acquire as many Buffers as you want, each with an individual offset into the file and length (where length is limited to the Buffer size limits mentioned above).

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

```javascript
const { readFile } = require('great-big-file-reader');

const filePath = '/path/to/large/file.txt';

// Read the entire file into a buffer
const buffer = readFile(filePath);
console.log(buffer.toString());

// Read a specific portion of the file into a buffer
const startOffset = 1024;
const length = 4096;
const partialBuffer = readFile(filePath, startOffset, length);
console.log(partialBuffer.toString());
```

## Contributing

Contributions are welcome! If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

## Copyright

Copyright 2023 Justin Heyes-Jones. All Rights Reserved.

---
