#include <napi.h>
#include <string>
#include "great-big-file-reader.h"

using std::string;

Napi::String Method(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  auto ph = Placeholder(string("World"));

  return Napi::String::New(env, ph.get());
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "great_big_file_reader"),
              Napi::Function::New(env, Method));
  return exports;
}

NODE_API_MODULE(great_big_file_reader, Init)
