import bindings  from 'bindings';
const gbfr = bindings('great-big-file-reader');

/**
 * @class MMapping
 * @classdesc Represents a memory-mapped file.
 */
export class MMapping {
  handle;
  length;
  path;
  isMapped = false;

  /**
   * Creates an instance of MMapping.
   * @param {string} path - The path of the file to map.
   * @param {number} fd - The file descriptor of the file to map.
   */
  constructor(path, fd) {
    this.path = path;
    // TODO error handling
    let mapping = gbfr.mapFile(path, fd);
    this.isMapped = true;
    this.handle = mapping.handle;
    this.length = mapping.length;
  }

  /**
   * Gets a buffer from the mapped file.
   * @param {number|bigint} offset - The offset in bytes from the start of the mapped region.
   * @param {number} length - The length in bytes of the buffer to get.
   * @returns {Buffer} The buffer from the mapped file.
   * @throws {Error} If the file is not currently mapped.
   */
  getBuffer(offset, length) {
    if(this.isMapped) {
      return gbfr.getBuffer(this.handle, offset, length);
    } else {
      throw new Error('File is not currently mapped');
    }
  } 

  /**
   * Unmaps the file by calling munmap.
   */
  unmap() {
    if(this.isMapped) {
      gbfr.unmapFile(this.handle);
      this.isMapped = false;
    }
  }
}
