#include <napi.h>
#include <string>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/mman.h>

#include "great-big-file-reader.h"

using std::string;

// Target API
// System mmap calls have the following parameters...
// void *mmap(void *addr, size_t len, int prot, int flags, int fd, off_t offset);

// For the user of this library we want to be able to do three thrings:
//   1. mmap a file given a file descriptor, this should give us a handle we can use
//   2. Get a read only buffer into the file. This takes a BigInt offset and length. It 
//      should return an error if the buffer size is too large. This should map to the file
//      memory at the appropriate offset such that reads will get the file contents correctly.
//   3. unmap the file from memory

Napi::Value GetFileLength(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Check if a file descriptor was provided as an argument
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "File descriptor must be provided as an argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  // Get the file descriptor from the argument
  int fileDescriptor = info[0].As<Napi::Number>().Int32Value();

  // Get the file length using fstat
  struct stat st;
  if (fstat(fileDescriptor, &st) == -1) {
    Napi::Error::New(env, "Failed to get file length").ThrowAsJavaScriptException();
    return env.Null();
  }

  // Return the file length as a BigInt
  Napi::BigInt fileLength = Napi::BigInt::New(env, static_cast<uint64_t>(st.st_size));
  return fileLength;
}

// TODO should go in the helper classes
unsigned long nextHandle = 0;
// TODO same
struct MappedFile {
  /* const string &path; */
  uint64_t length;
  uint64_t handle;
  void *data;
};

// TODO instead of global should be a static map, with handle as key, in the class
MappedFile mf;

Napi::Value MMapFileFromFileDescriptor(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  // Check if a file descriptor was provided as an argument
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "File descriptor must be provided as an argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  // Get the file descriptor from the argument
  int fileDescriptor = info[0].As<Napi::Number>().Int32Value();

  // Get the file length using fstat
  struct stat st;
  if (fstat(fileDescriptor, &st) == -1) {
    Napi::Error::New(env, "Failed to get file length").ThrowAsJavaScriptException();
    return env.Null();
  }

  /* log->data = mmap(NULL, log->data_len, PROT_READ, MAP_SHARED, fd, 0); */
  void *data = mmap(nullptr, st.st_size, PROT_READ, MAP_SHARED, fileDescriptor, 0);
  if(data == MAP_FAILED) {
    Napi::Error::New(env, "Failed to mmap").ThrowAsJavaScriptException();
    return env.Null();
  }

  // TODO cast is not safe, need to ensure the long long fits
  mf = {static_cast<uint64_t>(st.st_size), nextHandle++, data};
  // TODO this would be stored in a global or static map of handle to structure
  // TODO include the file path 
  Napi::Object obj = Napi::Object::New(env);

  // Add properties to the object
  // TODO types are sloppy here, handle should be 32 bit -> number maybe
  // TODO length should be big int
  obj.Set("length", mf.length);
  obj.Set("handle", mf.handle);

  return obj;
}

Napi::String Method(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  auto ph = Placeholder(string("World"));
  return Napi::String::New(env, ph.get());
}

// Return a buffer for reading the file
Napi::Value MMapGetBuffer(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  // TODO other input param should be the desired size of the buffer
  // input parameter must be a valid handle
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "mmap handle must be provided as an argument").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, static_cast<uint8_t*>(mf.data) + 40960, 4096);

  return buffer;
}
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "great_big_file_reader"), Napi::Function::New(env, Method));
  exports.Set(Napi::String::New(env, "getFileLength"), Napi::Function::New(env, GetFileLength));
  exports.Set(Napi::String::New(env, "mmapFileFromFileDescriptor"), Napi::Function::New(env, MMapFileFromFileDescriptor));
  exports.Set(Napi::String::New(env, "mmapGetBuffer"), Napi::Function::New(env, MMapGetBuffer));
  return exports;
}

NODE_API_MODULE(great_big_file_reader, Init)
