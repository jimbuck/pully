
describe('Pully', function () {

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

  describe('PresetManager', function () {

    var PresetManager = require('../lib/preset-manager');

    it('should be a constructor function', function(){
      expect(typeof(PresetManager)).toBe('function');
    });

    it('should contain a list of standard video presets', function () {
      
      var presets = new PresetManager();
      
      ['sd', 'hd', '2k', '4k', 'hfr', '24'].forEach(function(preset){
        expect(presets[preset]).toBeDefined();
        expect(presets[preset].videoIn).toBeDefined();
      });
    });

    it('should contain a list of standard audio presets', function () {
      
      var presets = new PresetManager();
      
      ['audio'].forEach(function(preset){
        expect(presets[preset]).toBeDefined();
        expect(presets[preset].audioIn).toBeDefined();
      });
    });

  });
  
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

});