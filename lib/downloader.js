var fs = require('fs');
var _ = require('underscore');
var util = require('../lib/utils.js');
var ytdl = require('ytdl-core');
var sanitize = require("sanitize-filename");
var ffmpeg = require('fluent-ffmpeg');
var ProgressBar = require('progress-bar');

require('colors');

var Downloader = function (videoType, audioType) {
    this.videoEncoding = videoType || 'mp4';
    this.audioEncoding = audioType || 'mp4';
}

Downloader.prototype.download = function (url, callback) {
    (function (me) {

        console.log(url);

        ytdl.getInfo(url, {
            downloadUrl: true
        }, function (err, info) {


            if(err) {
                console.error(err);
                process.exit(1);
            }

            downloadRawVideo.call(me, url, info, '.video.' + me.videoEncoding, function (videoPath, videoFormat) {

                if(!videoFormat.audioEncoding) {

                    var audioFormat = util.getBestAudio(info.formats, me.audioEncoding);

                    downloadRawAudio.call(me, url, info, '.audio.' + audioFormat.container, function (audioPath, audioFormat) {

                        var outputPath = videoPath.replace('.video.', '.');

                        combineAudioVideo.call(me, videoPath, audioPath, outputPath, function(finalPath){

                            // Delete the old files...
                            fs.unlinkSync(videoPath);
                            fs.unlinkSync(audioPath);

                            callback && callback.call(me, finalPath);
                        });

                    });
                } else {
                    fs.renameSync(videoPath, videoPath.replace('.video.', '.'));
                }
            });
        });
    })(this);
}

Downloader.prototype.downloadVideo = function (url, callback) {
    var me = this;
    ytdl.getInfo(url, {
        downloadUrl: true
    }, function (err, info) {

        if(err) {
            console.error(err);
            process.exit(1);
        }

        downloadRawVideo.call(me, url, info, '.' + me.videoEncoding, function (videoPath, videoFormat) {

            callback && callback.call(me, videoPath, videoFormat);
        });
    });
}


Downloader.prototype.downloadAudio = function (url, callback) {
    var me = this;

    ytdl.getInfo(url, {
        downloadUrl: true
    }, function (err, info) {

        if(err) {
            console.error(err);
            process.exit(1);
        }

        downloadRawAudio.call(me, url, info, '.' + info.container, function (audioPath, audioFormat) {

            callback && callback.call(me, audioPath, audioFormat);
        });
    });
}

function downloadRawVideo(url, info, extension, callback) {

    var videoFormat = util.getBestVideo(info.formats, this.videoEncoding);
    //console.log(videoFormat);

    if(!videoFormat) {
        console.error("No videos found with " + this.videoEncoding + " video encoding!");
        process.exit(1);
    }

    downloadRunner.call(this, url, videoFormat, extension, info, callback);
}

function downloadRawAudio(url, info, extension, callback) {

    var audioFormat = util.getBestAudio(info.formats, this.audioEncoding);
    //console.log(audioFormat);

    if(!audioFormat) {
        console.log(info.formats);

        throw new Error("No videos found with " + this.audioEncoding + " audio encoding!");
        process.exit(1);
    }

    downloadRunner.call(this, url, audioFormat, extension, info, callback);
}

function downloadRunner(url, format, extension, info, callback) {
    var type = format.container;
    var dir = sanitize(info.author);
    var file = sanitize(info.title) + extension;
    var fullPath = dir + '/' + file;

    console.log('\nNow downloading "' + fullPath + '"...');

    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    var writeStream = fs.createWriteStream(fullPath);
    writeStream.on('finish', function () {
        callback && callback.call(this, fullPath, format);
        return;
    });

    var readStream = ytdl(url, {
        quality: format
    });

    readStream.pipe(writeStream);

    readStream.on('error', function (err) {
        console.error(err.message.red.bold);
        process.exit(1);
    });

    readStream.on('info', function (info, format) {
        printVideoInfo(info, format);

        // Create progress bar.
        var bar = ProgressBar.create(process.stdout, 50);
        bar.format = '$bar; $percentage;%'.yellow.bold;

        // Keep track of progress.
        var dataRead = 0;
        readStream.on('data', function (data) {
            dataRead += data.length;
            var percent = dataRead / format.size;
            bar.update(percent);
        });
    });

    function printVideoInfo(info, format) {
        console.log();
        console.log('title: '.green.bold + info.title);
        console.log('author: '.cyan.bold + info.author);
        console.log('average rating: ' + (typeof info.avg_rating === 'number' ? info.avg_rating.toFixed(1) : info.avg_rating));
        console.log('length: ' + util.toHumanTime(info.length_seconds));
        console.log('----');
        format.resolution && console.log('resolution: '.yellow.bold + format.resolution);
        format.encoding && console.log('encoding: '.grey.bold + format.encoding);
        format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
        console.log('output: '.green.bold + file);
        console.log();
    }
}

function combineAudioVideo(videoPath, audioPath, outputPath, callback){
    var me = this;
    console.log('\n\nCombining files into ' + outputPath + '...\n');

    // Create progress bar.
    var bar = ProgressBar.create(process.stdout, 50);
    bar.format = '$bar; $percentage;% '.yellow.bold;

    ffmpeg(videoPath)
        .videoCodec('copy')
        .input(audioPath)
        .audioCodec('copy')
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            process.exit(1);
        })
        .on('progress', function (progress) {
            var percentage = (progress.percent/100).toFixed(0);
            bar.update(percentage);
        })
        .on('end', function () {
            console.log('Video download complete!\n'.green.bold);
            callback && callback.call(me, videoPath);
        })
        .save(outputPath);
}

module.exports = Downloader;
