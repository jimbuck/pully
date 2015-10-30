var proxy = require('proxyquire').noCallThru();

function Downloader() { }
Downloader['@noCallThru'] = true;

var pully = proxy('../lib/core', {
  '../lib/downloader': Downloader
});
var ERROR_CODES = require('../data/error-codes');

describe('Core', function () {

  beforeEach(function () {
    Downloader.prototype.download = function (options, callback) {
      callback(null, options, 'temp/test.test');
    };
  });

  it('should provide a function', function () {
    expect(typeof pully).toBe('function');
  });


  it('should require a hash of options', function (done) {

    pully(null, function (err) {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should require a url', function (done) {
    pully({
      preset: 'hd'
    }, function (err) {
      expect(err).toBeDefined();
      done();
    });
  });
  
  it('should have a default callback that throws on err', function () {
    var errorMessage = 'Some Known Error';

    Downloader.prototype.download = function (options, callback) {
      callback(new Error(errorMessage), options);
    };
    
    var options = {
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ'
    };
    
    expect(function () {
      pully(options);
    }).toThrow(errorMessage);
  });

  it('should only accept YouTube URLs', function (done) {
    pully({
      url: 'http://www.jimmyboh.com',
      preset: 'hd'
    }, function (err) {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should default to `hd` as the preset', function (done) {

    var options = {
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ'
    };

    pully(options, function (err, opts) {
      expect(err).toBeFalsy();
      expect(opts.preset).toBe('hd');
      done();
    });
  });

  it('should execute a callback with filepath when download is complete', function (done) {

    pully({
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ',
      preset: 'hd'
    }, function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });
  
  it('should catch any unexpected errors', function () {
    var errorMessage = 'Some Unexpected Error';

    Downloader.prototype.download = function () {
      throw new Error(errorMessage);
    };
    
    var options = {
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ'
    };
    
    pully(options, function (err) {
      expect(err).toBeDefined();
      expect(err.code).toBe(ERROR_CODES.UNKNOWN);
      expect(err.message).toBe(errorMessage);
    });
  });

});