'use strict';

const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const ProgressBar = require('progress');

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const utils = require('../lib/utils');
const PresetManager = require('../lib/preset-manager');

const ERROR_CODES = require('../data/error-codes');

class Downloader {
  constructor() {

  }

  download(options, callback) {
    const presets = new PresetManager(options.presets);

    let preset = presets.get(options.preset);

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
  }

  setupDownloadPath(format, info, options) {
    // Use the type (video/mp4, audio/mp3, etc) to get an extension
    if (typeof format.container === 'undefined') {
      let start = format.type.indexOf('/') + 1;
      let stop = format.type.indexOf(';');

      stop = (stop >= 0 ? stop : 0);

      format.container = format.type.substring(start, stop);
    }

    let directory = '';
    let filename = sanitize(info.title) + '.' + format.container;

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
  }

  _beginDownload(preset, info, options, callback) {
    let formats = preset.process(info.formats);

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
  }

  _downloadToStream(format, info, options) {
    let readStream = ytdl(options.url, {
      format: format
    });

    // Display progress only if called from the command line...
    if (options.cli) {
      readStream.on('info', function (streamInfo, streamFormat) {

        // Convert the string value to a true integer...
        streamFormat.size = parseInt(streamFormat.clen, 10) || 0;
        
        if (streamFormat.size > 0) {
          console.log('Downloading ' + format.type.substring(0, format.type.indexOf('/')) + '...');
          //return;
        }
        
        // Create progress bar.
        let bar = new ProgressBar('Downloading ' + format.type.substring(0, format.type.indexOf('/')) + '... :bar :percent (:etas remaining)', {
          width: 40,
          total: streamFormat.size,
          complete: '\u001b[42m \u001b[0m',
          incomplete: '\u001b[41m \u001b[0m',
          clear: true
        });

        // Keep track of progress while limiting draw calls...
        let batchTotal = 0;
        let totalRead = 0;
        const minTime = 100;

        let prevTime = Date.now();

        readStream.on('data', function (streamData) {
          totalRead += streamData.length;
          batchTotal += streamData.length;

          let isComplete = totalRead === streamFormat.size;

          let currTime = Date.now();
          let shouldUpdate = ((currTime - prevTime) > minTime);

          // Update on an interval or if complete...
          if (shouldUpdate || isComplete) {
            prevTime = currTime;

            bar && bar.tick(batchTotal);
            batchTotal = 0;
          }
        });
      });
    }

    return readStream;
  }

  _downloadToFile(format, info, options, callback) {

    let outputPath = this.setupDownloadPath(format, info, options);

    let writeStream = fs.createWriteStream(outputPath);

    writeStream.on('finish', function () {
      callback(null, info, outputPath);
    });

    let readStream = this._downloadToStream(format, info, options);

    readStream.on('error', function (err) {
      callback({
        code: ERROR_CODES.FAILED_TO_WRITE,
        message: err.message
      }, info, outputPath);
    });

    readStream.pipe(writeStream);
  }

  _downloadToTemp(format, info, options, callback) {
    let outputPath = utils.createGuid() + '.temp';

    let writeStream = fs.createWriteStream(outputPath);

    writeStream.on('finish', function () {
      callback(null, outputPath, function () {
        // Delete the temp file...
        fs.unlinkSync(outputPath);
      });
    });

    let readStream = this._downloadToStream(format, info, options);

    readStream.on('error', function (err) {
      callback({
        code: ERROR_CODES.FAILED_TO_WRITE,
        message: err.message
      }, info);
    });

    readStream.pipe(writeStream);
  }

  _downloadAndMerge(formats, info, options, callback) {
    let outputPath = this.setupDownloadPath(formats.video, info, options);

    this._downloadToTemp(formats.audio, info, options, function (err, audioPath, done) {

      if (err) {
        done();
        callback({
          code: ERROR_CODES.FAILED_TO_WRITE,
          message: err.message
        }, info, outputPath);
        return;
      }

      let videoStream = this._downloadToStream(formats.video, info, options);

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
        }).on('end', function () {
          done();
          callback(null, info, outputPath);
        })
        .save(outputPath);
    }.bind(this));
  }
}

module.exports = Downloader;