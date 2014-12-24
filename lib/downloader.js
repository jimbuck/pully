
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var sanitize = require('sanitize-filename');
var ytdl = require('ytdl-core');
var ffmpeg = require('fluent-ffmpeg');
var ProgressBar = require('progress');
require('colors');

var utils = require('../lib/utils');
var errorCodes = require('../data/error-codes');

var Downloader = function (formats, info, options, callback) {

    if(!formats || (!formats.audio && !formats.video)){
        console.error('No formats found!');
        process.exit(errorCodes.INVALID_ARGUMENTS)
    }

    if(!formats.video) {
        downloadToFile.call(this, formats.audio, info, options, callback);
    } else {
        if(!formats.audio) {
            downloadToFile.call(this, formats.video, info, options, callback);
        } else {
            downloadAndMerge.call(this, formats, info, options, callback);
        }
    }
};

function downloadToStream(format, info, options) {
    var readStream = ytdl(options.url, {
        format : format
    });

    readStream.on('error', function (err) {
        console.error(err.message.red.bold);
        process.exit(1);
    });

    // Display progress if called from the command line...
    //if(options.cli)
        readStream.on('info', function (streamInfo, streamFormat) {

            // Convert the string value to a true integer...
            streamFormat.size = parseInt(streamFormat.size);

            // Create progress bar.
            var bar = new ProgressBar('Downloading ' + format.type.substring(0, format.type.indexOf('/')) + '... :bar :percent (:etas remaining)', {
                width: 40,
                total: streamFormat.size,
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
                if(shouldUpdate || isComplete)
                {
                    prevTime = currTime;

                    bar.tick(batchTotal);
                    batchTotal = 0;
                }
            });
        });

    return readStream;
}

function downloadToFile(format, info, options, callback) {

    var outputPath = getDownloadPath(format, info, options);

    var writeStream = fs.createWriteStream(outputPath);

    writeStream.on('finish', function () {
        callback && callback.call(this, null, info, outputPath);
    });

    var readStream = downloadToStream(format, info, options);

    readStream.on('error', function (err) {
        console.error(err.message.red.bold);
        process.exit(errorCodes.FAILED_TO_WRITE);
    });

    readStream.pipe(writeStream);
}

function downloadToTemp(format, info, options, callback) {
    var outputPath = utils.createGuid() + '.temp';

    var writeStream = fs.createWriteStream(outputPath);

    writeStream.on('finish', function () {
        callback && callback.call(this, null, outputPath, function() {
            // Delete the temp file...
            fs.unlinkSync(outputPath);
        });
    });

    var readStream = downloadToStream(format, info, options);

    readStream.on('error', function (err) {
        console.error(err.message.red.bold);
        process.exit(errorCodes.FAILED_TO_WRITE);
    });

    readStream.pipe(writeStream);
}

function downloadAndMerge(formats, info, options, callback) {
    var me = this;

    var outputPath = getDownloadPath(formats.video, info, options);

    var audioStream = downloadToTemp(formats.audio, info, options, function(err, audioPath, done) {

        if(err) {
            console.log(err.message.red.bold);
            process.exit(errorCodes.FAILED_TO_WRITE);
        }

        var videoStream = downloadToStream(formats.video, info, options);

        ffmpeg(videoStream)
            .videoCodec('copy')
            .input(audioPath)
            .audioCodec('copy')
            .on('error', function (err) {
                console.error(err.message.red.bold);
                process.exit(errorCodes.FAILED_TO_MERGE);
            })
            .on('progress', function (progress) {
                //var percentage = (progress.percent / 100).toFixed(0);
                //bar.update(percentage);
            })
            .on('end', function () {
                done();
                callback && callback.call(me, null, info, outputPath);
            })
        .save(outputPath);
    });
}

function getDownloadPath(format, info, options) {
    var dir = sanitize(info.author);
    var filename = sanitize(info.title) + '.' + format.container;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    return dir + path.sep + filename;
}

function printVideoInfo(format, info, options) {
    printGeneralInfo(info, format);
    format.resolution && console.log('resolution: '.yellow.bold + format.resolution);
    format.encoding && console.log('video encoding: '.grey.bold + format.encoding);
    format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
    console.log('output: '.green.bold + file);
    console.log();
}

function printAudioInfo(format, info, options) {
    printGeneralInfo(info, format);
    format.audioEncoding && console.log('audio encoding: '.grey.bold + format.audioEncoding);
    format.audioBitrate && console.log('audio bitrate: '.grey.bold + format.audioBitrate);
    format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
    console.log('output: '.green.bold + file);
    console.log();
}

function printUnknownInfo(format, info, options) {
    printGeneralInfo(info, format);
    console.log('Format Type Unkown:'.red.bold);
    format.resolution && console.log('resolution: '.yellow.bold + format.resolution);
    format.encoding && console.log('video encoding: '.grey.bold + format.encoding);
    format.audioEncoding && console.log('audio encoding: '.grey.bold + format.audioEncoding);
    format.audioBitrate && console.log('audio bitrate: '.grey.bold + format.audioBitrate);
    format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
    console.log('output: '.green.bold + file);
    console.log();
}

function printGeneralInfo(format, info, options) {
    console.log();
    console.log('title: '.green.bold + info.title + ' by ' + info.author.grey.bold);
    console.log('average rating: ' + (typeof info.avg_rating === 'number' ? info.avg_rating.toFixed(1) : info.avg_rating));
    console.log('length: ' + util.toHumanTime(info.length_seconds));
    console.log('----');
}

module.exports = Downloader;
