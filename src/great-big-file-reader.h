#ifndef GREAT_BIG_FILE_READER_H
#define GREAT_BIG_FILE_READER_H

#include <string>
using std::string;

class Placeholder {
  public:
    Placeholder(const string &in) {
      str_ = in + in;
    }
  const string &get();
  private:
    string str_;
};

#endif
