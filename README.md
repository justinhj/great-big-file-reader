# Great Big File Reader

The Great Big File Reader is an npm plugin that provides an efficient way to read large files in Node.js using memory mapping (mmap). This plugin allows you to mmap read-only files into buffers, making it ideal for working with extremely large files.

## Features

- Efficiently read large files using mmap.
- Read-only access to files.
- Supports handling files with sizes beyond traditional memory limitations.
- Easy integration with Node.js applications.

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

---
