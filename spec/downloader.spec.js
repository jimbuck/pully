var proxy = require('proxyquire');
var path = require('path');


var fs = {};
var ytdl = {};
var ffmpeg = {};

var Downloader = proxy('../lib/downloader', {
  'fs': fs,
  'ytdl-core': ytdl,
  'fluent-ffmpeg': ffmpeg
});

describe('Downloader', function () {
            
  beforeEach(function () {
    spyOn(fs, 'mkdirSync');
  });
            
  it('should be a constructor function', function(){
    expect(typeof Downloader).toBe('function');
  });
    
  it('should reject if the preset cannot be found.', function(){           
    var downloader = new Downloader();
      
    downloader.download({
      preset: 'doesNotExist'
    }, function(err) {
      expect(err).toBeDefined();
    });
  });    
    
  it('should automatically download video information', function(){
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
    
});