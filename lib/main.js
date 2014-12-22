var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ytdl = require('ytdl-core');
var sanitize = require("sanitize-filename");
var ffmpeg = require('fluent-ffmpeg');
var ProgressBar = require('progress-bar');
require('colors');

var util = require('./utils');
var presets = require('../data/presets');
var errorCodes = require('../data/error-codes');

var Pully = function (options, callback) {
	var me = this;

	ytdl.getInfo(options.url, {
		downloadUrl : true
	}, function (err, info) {

		if (err) {
			callback && callback.call(me, err, null);
			process.exit(errorCodes.FAILED_TO_GET_INFO);
		}
        var presetFunc = presets[options.preset];
        
        if(!presetFunc)
        {
            console.error('Preset "'+options.preset+'" is not defined!');
            process.exit(errorCodes.INVALID_ARGUMENTS);
        }
        
		var bestFormats = presetFunc(info.formats);

        console.warn('Pully is currently undergoing major changes. Please roll back one git commit for a working build.');
        process.exit(0);
        
		downloadRawVideo.call(me, url, info, '.video.' + me.videoEncoding, function (videoPath, videoFormat) {

			if (!videoFormat.audioEncoding) {

				var audioFormat = ytHelper.getBestAudio(info.formats, me.audioEncoding);

				downloadRawAudio.call(me, url, info, '.audio.' + audioFormat.container, function (audioPath, audioFormat) {

					var outputPath = videoPath.replace('.video.', '.');

					combineAudioVideo.call(me, videoPath, audioPath, outputPath, function (finalPath) {

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
}

function downloadRawVideo(url, info, extension, callback) {

	var videoFormat = ytHelper.getBestVideo(info.formats, this.videoEncoding);

	if (!videoFormat) {
		console.error("No videos found with " + this.videoEncoding + " video encoding!");
		process.exit(1);
	}

	downloadToFile.call(this, url, videoFormat, extension, info, callback);
}

function downloadRawAudio(url, info, extension, callback) {

	var audioFormat = ytHelper.getBestAudio(info.formats, this.audioEncoding);

	if (!audioFormat) {
		throw new Error("No videos found with " + this.audioEncoding + " audio encoding!");
		process.exit(1);
	}

	downloadToFile.call(this, url, audioFormat, extension, info, callback);
}

function downloadToFile(url, format, extension, info, callback) {
	var type = format.container;
	var dir = sanitize(info.author);
	var file = sanitize(info.title) + extension;
	var fullPath = dir + path.sep + file;

	console.log('Downloading "' + fullPath + '"...');

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	var writeStream = fs.createWriteStream(fullPath);
	writeStream.on('finish', function () {
		console.log('\n');
		callback && callback.call(this, fullPath, format);
		return;
	});

	var readStream = ytdl(url, {
			quality : format
		});

	readStream.pipe(writeStream);

	readStream.on('error', function (err) {
		console.error(err.message.red.bold);
		process.exit(1);
	});

	readStream.on('info', function (info, format) {

		if (format.isVideo)
			printVideoInfo(info, format);
		else if (format.isAudio)
			printAudioInfo(info, format);
		else
			printUnknownInfo(info, format);

		// Create progress bar.
		var bar = ProgressBar.create(process.stdout, 50);
		bar.format = '$bar; $percentage;%'.yellow.bold;

		var prevPercent = -1;

		// Keep track of progress.
		var dataRead = 0;
		readStream.on('data', function (data) {
			dataRead += data.length;
			var percent = (dataRead / format.size).toFixed(2);
			if (prevPercent != percent) {
				prevPercent = percent;
				bar.update(percent);
			}
		});
	});

	function printVideoInfo(info, format) {
		printGeneralInfo(info, format);
		format.resolution && console.log('resolution: '.yellow.bold + format.resolution);
		format.encoding && console.log('video encoding: '.grey.bold + format.encoding);
		format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
		console.log('output: '.green.bold + file);
		console.log();
	}

	function printAudioInfo(info, format) {
		printGeneralInfo(info, format);
		format.audioEncoding && console.log('audio encoding: '.grey.bold + format.audioEncoding);
		format.audioBitrate && console.log('audio bitrate: '.grey.bold + format.audioBitrate);
		format.size && console.log('size: '.cyan.bold + util.toHumanSize(format.size) + ' (' + format.size + ' bytes)');
		console.log('output: '.green.bold + file);
		console.log();
	}

	function printUnknownInfo(info, format) {
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

	function printGeneralInfo(info, format) {
		console.log();
		console.log('title: '.green.bold + info.title + ' by ' + info.author.grey.bold);
		console.log('average rating: ' + (typeof info.avg_rating === 'number' ? info.avg_rating.toFixed(1) : info.avg_rating));
		console.log('length: ' + util.toHumanTime(info.length_seconds));
		console.log('----');
	}
}

function combineAudioVideo(videoPath, audioPath, outputPath, callback) {
	var me = this;
	console.log('Combining files into ' + outputPath + '...\n');

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
		var percentage = (progress.percent / 100).toFixed(0);
		bar.update(percentage);
	})
	.on('end', function () {
		console.log('Video download complete!\n'.green.bold);
		callback && callback.call(me, outputPath);
	})
	.save(outputPath);
}

module.exports = Pully;
