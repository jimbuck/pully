
var fs = require('fs');
var path = require('path');
//var _ = require('underscore');
var sanitize = require('sanitize-filename');
var ProgressBar = require('progress');
require('colors');

var ytdl = require('ytdl-core');
var ffmpeg = require('fluent-ffmpeg');

var utils = require('../lib/utils');
var PresetManager = require('../lib/preset-manager');

var ERROR_CODES = require('../data/error-codes');

var Downloader = function () { };

Downloader.prototype.download = function (options, callback) {

  var presets = new PresetManager(options.presets);

  var preset = presets.get(options.preset);

  if (typeof preset === 'undefined') {
    callback && callback({
      code: ERROR_CODES.INVALID_ARGUMENTS,
      message: 'Preset "' + options.preset + '" is not defined!'
    });
    return;
  }

  ytdl.getInfo(options.url, {
    downloadUrl: true
  }, function (err, info) {

    if (err) {
      callback && callback({
        code: ERROR_CODES.FAILED_TO_GET_INFO,
        message: err
      }, info);
      return;
    }

    this._beginDownload(preset, info, options, callback);
  }.bind(this));
};

Downloader.prototype.setupDownloadPath = function (format, info, options) {
  // Use the type (video/mp4, audio/mp3, etc) to get an extension
  if (typeof format.container === 'undefined') {
    var start = format.type.indexOf('/') + 1;
    var stop = format.type.indexOf(';');

    stop = (stop >= 0 ? stop : 0);

    format.container = format.type.substring(start, stop);
  }

  var directory = '';
  var filename = sanitize(info.title) + '.' + format.container;

  // Use path if specified in options
  if (options.path) {
    directory = options.path;
  } else {
    directory = sanitize(info.author);
  }

  // Create output directory if it does not exist
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  return path.join(directory, filename);
};

Downloader.prototype._beginDownload = function (preset, info, options, callback) {
  var formats = preset.process(info.formats);

  if (!formats || (!formats.audio && !formats.video)) {
    callback({
      code: ERROR_CODES.INVALID_ARGUMENTS,
      message: 'No formats found!'
    }, info, null);
    return;
  }

  if (!formats.video) {
    this._downloadToFile.call(this, formats.audio, info, options, callback);
  } else {
    if (!formats.audio) {
      this._downloadToFile.call(this, formats.video, info, options, callback);
    } else {
      this._downloadAndMerge.call(this, formats, info, options, callback);
    }
  }
};

Downloader.prototype._downloadToStream = function (format, info, options) {
  var readStream = ytdl(options.url, {
    format: format
  });

  // Display progress only if called from the command line...
  if (options.cli) {
    readStream.on('info', function (streamInfo, streamFormat) {

      // Convert the string value to a true integer...
      streamFormat.size = parseInt(streamFormat.size);

      // Create progress bar.
      var bar = new ProgressBar('Downloading ' + format.type.substring(0, format.type.indexOf('/')) + '... :bar :percent (:etas remaining)', {
        width: 40,
        total: streamFormat.size || 0,  // streamFormat.size can be undefined, which would cause a crash
        complete: '\u001b[42m \u001b[0m',
        incomplete: '\u001b[41m \u001b[0m',
        clear: true
      });

      // Keep track of progress while limiting draw calls...
      var batchTotal = 0;
      var totalRead = 0;
      var minTime = 100;

      var prevTime = +new Date();

      readStream.on('data', function (streamData) {
        totalRead += streamData.length;
        batchTotal += streamData.length;

        var isComplete = totalRead === streamFormat.size;

        var currTime = +new Date();
        var shouldUpdate = ((currTime - prevTime) > minTime);

        // Update on an interval or if complete...
        if (shouldUpdate || isComplete) {
          prevTime = currTime;

          bar.tick(batchTotal);
          batchTotal = 0;
        }
      });
    });
  }

  return readStream;
};

Downloader.prototype._downloadToFile = function (format, info, options, callback) {

  var outputPath = this.setupDownloadPath(format, info, options);

  var writeStream = fs.createWriteStream(outputPath);

  writeStream.on('finish', function () {
    callback(null, info, outputPath);
    return;
  });

  var readStream = this._downloadToStream(format, info, options);

  readStream.on('error', function (err) {
    callback({
      code: ERROR_CODES.FAILED_TO_WRITE,
      message: err.message
    }, info, outputPath);
    return;
  });

  readStream.pipe(writeStream);
};

Downloader.prototype._downloadToTemp = function (format, info, options, callback) {
  var outputPath = utils.createGuid() + '.temp';

  var writeStream = fs.createWriteStream(outputPath);

  writeStream.on('finish', function () {
    callback(null, outputPath, function () {
      // Delete the temp file...
      fs.unlinkSync(outputPath);
    });
  });

  var readStream = this._downloadToStream(format, info, options);

  readStream.on('error', function (err) {
    callback({
      code: ERROR_CODES.FAILED_TO_WRITE,
      message: err.message
    }, info);
  });

  readStream.pipe(writeStream);
};

Downloader.prototype._downloadAndMerge = function (formats, info, options, callback) {
  var outputPath = this.setupDownloadPath(formats.video, info, options);

  this._downloadToTemp(formats.audio, info, options, function (err, audioPath, done) {

    if (err) {
      done();
      callback({
        code: ERROR_CODES.FAILED_TO_WRITE,
        message: err.message
      }, info, outputPath);
      return;
    }

    var videoStream = this._downloadToStream(formats.video, info, options);

    ffmpeg(videoStream)
      .videoCodec('copy')
      .input(audioPath)
      .audioCodec('copy')
      .on('error', function (err) {
        done();
        callback({
          code: ERROR_CODES.FAILED_TO_MERGE,
          message: err.message
        }, info, outputPath);
        return;
      }).on('end', function () {
        done();
        callback(null, info, outputPath);
      })
      .save(outputPath);
  });
};

module.exports = Downloader;
