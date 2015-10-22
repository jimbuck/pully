
var url = require('url');

require('colors');

var Downloader;
var ERROR_CODES = require('../data/error-codes');

var pully = function (options, callback, dnldr) {
  
  Downloader = dnldr || require('../lib/downloader');
  
  callback = (callback || function (err) {
    if (err) {
      throw err;
    }
  }).bind(this);

  try {
       
    if(!options || typeof options == 'function'){
      callback({
        code: ERROR_CODES.INVALID_ARGUMENTS,
        message: 'Options must be specified!'
      });
      return;
    }

    if(!options.url){
      callback({
        code: ERROR_CODES.INVLAID_URL,
        message: 'A url must be specified!'
      });
      return;
    }
    
    // Ensure that each has a value...
    options.preset = options.preset || 'hd';
    options.parsedUrl = url.parse(options.url, true, true);

    var downloader = new Downloader();

    downloader.download(options, callback);
  } catch (e) {
    callback({
      code: ERROR_CODES.UNKNOWN,
      message: e.message
    });
    return;
  }
};

module.exports = pully;
