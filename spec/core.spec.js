describe('Core', function () {

  var pully = require('../index');
  var Downloader;

  beforeEach(function () {

    Downloader = function () { };

    Downloader.prototype.filePath = 'temp/test.test';

    Downloader.prototype.getDownloadPath = function (format, info, options) {
      return Downloader.prototype.filePath;
    };

    Downloader.prototype.download = function (options, callback) {
      callback(null, options, Downloader.prototype.filePath);
    };
  });

  it('should provide a function', function () {
    expect(typeof pully).toBe('function');
  });

  it('should require a hash of options', function (done) {

    pully(null, function (err) {
      expect(err).toBeDefined();
      done();
    }, Downloader);
  });

  it('should require a url', function (done) {
    pully({
      preset: 'hd'
    }, function (err) {
      expect(err).toBeDefined();
      done();
    }, Downloader);
  });

  it('should only accept YouTube URLs', function (done) {
    pully({
      url: 'http://www.jimmyboh.com',
      preset: 'hd'
    }, function (err, info, path) {
      expect(err).toBeDefined();
      done();
    }, Downloader);
  });

  it('should default to `hd` as the preset', function (done) {

    var options = {
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ'
    };

    Downloader.prototype.download = function (options, callback) {
      expect(options.preset).toBe('hd');
      done();
    }

    pully(options, function (err, info, path) { }, Downloader);
  });

  it('should execute a callback with filepath when download is complete', function (done) {

    pully({
      url: 'https://www.youtube.com/watch?v=1F5Ad0dhScQ',
      preset: 'hd'
    }, function (err, info, path) {
      expect(err).toBeFalsy();
      done();
    }, Downloader);
  });

});