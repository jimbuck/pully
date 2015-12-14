var proxy = require('proxyquire');
var path = require('path');

var fs = {};
var ytdl = {};
var ffmpeg = {};

function PresetManager() { }

var Downloader = proxy('../lib/downloader', {
  'fs': fs,
  'ytdl-core': ytdl,
  'fluent-ffmpeg': ffmpeg,
  '../lib/preset-manager': PresetManager
});

var ERROR_CODES = require('../data/error-codes');

var noOp = function () { };

describe('Downloader', function () {

  beforeEach(function () {
    spyOn(fs, 'mkdirSync');

    PresetManager.prototype.get = function () { return {}; };
  });

  it('should be a constructor function', function () {
    expect(typeof Downloader).toBe('function');
  });

  it('should reject if the preset cannot be found.', function () {
    PresetManager.prototype.get = function () { return; };

    var downloader = new Downloader();

    downloader.download({
      preset: 'doesNotExist'
    }, function (err) {
      expect(err).toBeDefined();
    });
  });

  it('should automatically download video information', function () {
    var presetName = 'hd';
    var expectedUrl = 'https://www.youtube.com/watch?v=1F5Ad0dhScQ';

    var downloader = new Downloader();

    ytdl.getInfo = function (url) {
      expectCallback(null, url);
    };

    spyOn(ytdl, 'getInfo').andCallThrough();

    downloader.download({
      url: expectedUrl,
      preset: presetName
    }, expectCallback);

    function expectCallback(err, actualUrl) {
      expect(err).toBeFalsy();
      expect(ytdl.getInfo.calls.length).toBe(1);
      expect(actualUrl).toEqual(expectedUrl);
    }
  });

  it('should handle failed calls with an error callback', function () {
    var presetName = 'hd';
    var expectedUrl = 'https://www.youtube.com/watch?v=1F5Ad0dhScQ';
    var expectedError = 'This is some download info error.';

    var downloader = new Downloader();

    ytdl.getInfo = function (url, options, callback) {
      callback(expectedError);
    };

    downloader.download({
      url: expectedUrl,
      preset: presetName
    }, function (err) {
      expect(err).toBeDefined();
      expect(err.message).toBe(expectedError);
      expect(err.code).toBe(ERROR_CODES.FAILED_TO_GET_INFO);
    });
  });

  it('should download after successfully getting video info', function () {
    var presetName = 'hd';
    var expectedUrl = 'https://www.youtube.com/watch?v=1F5Ad0dhScQ';
    var expectedinfo = {};

    var downloader = new Downloader();

    ytdl.getInfo = function (url, options, callback) {
      callback(null, expectedinfo);
    };

    spyOn(downloader, '_beginDownload');

    downloader.download({
      url: expectedUrl,
      preset: presetName
    }, noOp);

    expect(downloader._beginDownload).toHaveBeenCalled();
  });

  it('should download videos to artist/title', function () {
    spyOn(fs, 'existsSync').andCallFake(function () {
      return false;
    });

    var downloader = new Downloader();

    var mockFormat = {
      container: 'mp4'
    };
    var mockInfo = {
      author: 'Jim Test',
      title: 'Epic Youtube Video - 1/12 - "test"'
    };

    var mockOptions = {};

    var expectedOutputPath = 'Jim Test' + path.sep + 'Epic Youtube Video - 112 - test.mp4';

    var actualOutputPath = downloader.setupDownloadPath(mockFormat, mockInfo, mockOptions);

    expect(actualOutputPath).toEqual(expectedOutputPath);
    expect(fs.existsSync.calls.length).toBe(1);
    expect(fs.mkdirSync.calls.length).toBe(1);
  });

  it('should download videos to specified directory', function () {
    spyOn(fs, 'existsSync').andCallFake(function () {
      return false;
    });

    var downloader = new Downloader();

    var mockFormat = {
      container: 'mp4'
    };
    var mockInfo = {
      author: 'Mario Test',
      title: 'Some Video Title'
    };

    var mockOptions = {
      path: __dirname
    };

    var expectedOutputPath = path.join(__dirname, 'Some Video Title.mp4');

    var actualOutputPath = downloader.setupDownloadPath(mockFormat, mockInfo, mockOptions);

    expect(actualOutputPath).toEqual(expectedOutputPath);
    expect(fs.existsSync.calls.length).toBe(1);
    expect(fs.mkdirSync.calls.length).toBe(1);
  });
});
