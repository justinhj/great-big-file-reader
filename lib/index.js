import bindings  from 'bindings';
const gbfr = bindings('great-big-file-reader');

export class MMapping {
  handle;
  length;
  path;
  isMapped = false;

  constructor(path, fd) {
    this.path = path;
    // TODO error handling
    let mapping = gbfr.mapFile(path, fd);
    this.isMapped = true;
    this.handle = mapping.handle;
    this.length = mapping.length;
  }

  getBuffer(offset, length) {
    if(this.isMapped) {
      return gbfr.getBuffer(this.handle, offset, length);
    } else {
      throw new Error('File is not currently mapped');
    }
  } 

  unmap() {
    if(this.isMapped) {
      gbfr.unmapFile(this.handle);
      this.isMapped = false;
    }
  }
}
