#include <napi.h>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <cstdint>

using std::string;
using std::unordered_map;

// TODO rename this file, it doesn't need to be called bindings

// Data
// Monotonically increasing handle for the call to use to identify a particular file mapping
uint64_t nextHandle = 0;
struct MappedFile {
  string path;
  uint64_t length;
  void *data;
};

unordered_map<uint64_t, MappedFile> mfs;

// Target API
// System mmap calls have the following parameters...
// void *mmap(void *addr, size_t len, int prot, int flags, int fd, off_t offset);

// For the user of this library we want to be able to do three thrings:
//   1. mmap a file given a file descriptor, this should give us a handle we can use
//   2. Get a read only buffer into the file. This takes a BigInt offset and length. It 
//      should return an error if the buffer size is too large. This should map to the file
//      memory at the appropriate offset such that reads will get the file contents correctly.
//   3. unmap the file from memory


bool fitsInUint64(long long value) {
  return value >= 0 && value <= std::numeric_limits<uint64_t>::max();
}

Napi::Value MMapFileFromFileDescriptor(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected file path").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected file descriptor").ThrowAsJavaScriptException();
    return env.Null();
  }

  int fileDescriptor = info[1].As<Napi::Number>().Int32Value();

  // Get the file length using fstat
  struct stat st;
  if (fstat(fileDescriptor, &st) == -1) {
    Napi::Error::New(env, "Failed to get file length").ThrowAsJavaScriptException();
    return env.Null();
  }

  if(!fitsInUint64(st.st_size)) {
    Napi::Error::New(env, "File length cannot fit uint64").ThrowAsJavaScriptException();
    return env.Null();
  }

  /* log->data = mmap(NULL, log->data_len, PROT_READ, MAP_SHARED, fd, 0); */
  void *data = mmap(nullptr, st.st_size, PROT_READ, MAP_SHARED, fileDescriptor, 0);
  if(data == MAP_FAILED) {
    Napi::Error::New(env, "Failed to mmap").ThrowAsJavaScriptException();
    return env.Null();
  }

  MappedFile mf {info[0].As<Napi::String>(), static_cast<uint64_t>(st.st_size), data};

  uint64_t handle = nextHandle++;
  mfs[handle] = mf;

  Napi::Object obj = Napi::Object::New(env);

  obj.Set("path", mf.path);
  obj.Set("length", Napi::BigInt::New(env, mf.length));
  obj.Set("handle", Napi::BigInt::New(env, handle));

  return obj;
}

// Return a buffer for reading the file
// Arguments:
//   handle, bigint, used to lookup which mmap file this is, the module tracks them in a map
//   offset, bigint, starting position of buffer in the file
//   length, number or bigint, length of the buffer (note that buffer.constants.MAX_LENGTH is a safe integer so number is sufficient)
Napi::Value GetBuffer(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if(info.Length() < 3) {
    Napi::TypeError::New(env, "3 arguments expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  if(!info[0].IsBigInt()) {
    Napi::TypeError::New(env, "mmap handle must be provided as a bigint argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  bool lossless;
  int handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
  if(mfs.count(handle) == 0) {
    Napi::TypeError::New(env, "Handle not found").ThrowAsJavaScriptException();
    return env.Null();
  }
  const MappedFile &mf = mfs.at(handle);

  if(!info[1].IsBigInt()) {
    Napi::TypeError::New(env, "offset should be a bigint").ThrowAsJavaScriptException();
    return env.Null();
  }

  // First convert the offset to a signed 64 bit so we can check it is not negative
  int64_t signed_offset = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  if(signed_offset < 0) {
    Napi::RangeError::New(env, "offset should not be negative").ThrowAsJavaScriptException();
    return env.Null();
  }

  uint64_t offset = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

  uint64_t length;

  if(info[2].IsBigInt()) {
    int64_t signed_length = info[2].As<Napi::BigInt>().Int64Value(&lossless);
    if(signed_length > 0) {
      Napi::RangeError::New(env, "length should be greater than zero").ThrowAsJavaScriptException();
      return env.Null();
    }
    length = info[2].As<Napi::BigInt>().Uint64Value(&lossless);
  } else if(info[2].IsNumber()) {
    int64_t signed_length = info[2].As<Napi::Number>().Int64Value();
    if(signed_length < 0) {
      Napi::RangeError::New(env, "length should be greater than zero").ThrowAsJavaScriptException();
      return env.Null();
    }
    length = info[2].As<Napi::Number>().Uint32Value();
  } else {
    Napi::TypeError::New(env, "length should be a bigint or number").ThrowAsJavaScriptException();
    return env.Null();
  }

  // validate offset is less than file length
  // validate that offset + length is less than file length
  if(offset >= mf.length) {
    Napi::RangeError::New(env, "offset must be within the file").ThrowAsJavaScriptException();
    return env.Null();
  }

  if(offset + length > mf.length) {
    Napi::RangeError::New(env, "offset plus length must be within the file").ThrowAsJavaScriptException();
    return env.Null();
  }

  // TODO better error handling than none
  return Napi::Buffer<uint8_t>::New(env, static_cast<uint8_t*>(mf.data) + offset, length);
}

Napi::Value UnmapFileFromHandle(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if(info.Length() != 1) {
    Napi::TypeError::New(env, "1 argument expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  if(!info[0].IsBigInt()) {
    Napi::TypeError::New(env, "mmap handle must be provided as a bigint argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  bool lossless;
  int handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
  if(mfs.count(handle) == 0) {
    Napi::TypeError::New(env, "Handle not found").ThrowAsJavaScriptException();
    return env.Null();
  }
  const MappedFile &mf = mfs.at(handle);

  int result = munmap(mf.data, mf.length);
  if(result != 0) {
    Napi::Error::New(env, "umnmap failed").ThrowAsJavaScriptException();
    return env.Null();
  }
 
  return Napi::Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "mapFile"), Napi::Function::New(env, MMapFileFromFileDescriptor));
  exports.Set(Napi::String::New(env, "getBuffer"), Napi::Function::New(env, GetBuffer));
  exports.Set(Napi::String::New(env, "unmapFile"), Napi::Function::New(env, UnmapFileFromHandle));
  return exports;
}

NODE_API_MODULE(great_big_file_reader, Init)
