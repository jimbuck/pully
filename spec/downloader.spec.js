describe('Downloader', function(){
    
    var Downloader = require('../lib/downloader');
    var fs = require('fs');
    var oldExistsSync;
    var path = require('path');
    
    beforeEach(function(){
      oldExistsSync = fs.existsSync;
      spyOn(fs, 'existsSync').and.returnValue(true);
    });
    
    afterEach(function(){
      fs.existsSync = oldExistsSync;
    });
    
    it('should be a constructor function', function(){
      expect(typeof Downloader).toBe('function');
    });
    
    it('should reject if the preset cannot be found.', function(){
      
      function MockPresetManager(){}
           
      var mockYtdl = {
        getInfo: function(url, opts, cb){
          cb(null);
        }
      };
      
      spyOn(mockYtdl, 'getInfo');
           
      var downloader = new Downloader({}, {}, MockPresetManager);
      
      downloader.download({
        preset: 'doesNotExist'
      }, function(err) {
        expect(err).toBeDefined();
        expect(mockYtdl.getInfo.calls.count()).toEqual(0);
      });
      
    });    
    
    it('should automatically download video information', function(){
      var presetName = 'test';
      
      function MockPresetManager(){
        this[presetName] = {};
      }
      
      var mockYtdl = {
        getInfo: function(url, opts, cb){
          cb(null);
        }
      };
      
      spyOn(mockYtdl, 'getInfo');
      
      var downloader = new Downloader(mockYtdl, null, MockPresetManager);
      
      downloader.download({
        preset: presetName
      }, function(err)
      {
        expect(err).toBeFalsy();
        expect(mockYtdl.getInfo.calls.count()).toEqual(1);
      });
      
    });
    
    it('should download videos to artist/title', function () {
      var downloader = new Downloader();
      
      var mockFormat = {
        container: 'mp4'
      };
      var mockInfo = {
        author: 'Jim Test',
        title: 'Epic Youtube Video - 1/12 - "test"'
      }
      var mockOptions = {};
      
      var expectedOutputPath = 'Jim Test' + path.sep + 'Epic Youtube Video - 112 - test.mp4';
      
      var actualOutputPath = downloader.setupDownloadPath(mockFormat, mockInfo, mockOptions);
      
      expect(actualOutputPath).toEqual(expectedOutputPath);
      expect(fs.existsSync).toHaveBeenCalled();
    });
    
  });