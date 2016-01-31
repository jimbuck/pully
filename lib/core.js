'use strict';

const url = require('url');

const Downloader = require('../lib/downloader');
const ERROR_CODES = require('../data/error-codes');

const pully = function (options, callback) {
  
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

    let downloader = new Downloader();

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
