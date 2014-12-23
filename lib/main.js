var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ytdl = require('ytdl-core');
var sanitize = require("sanitize-filename");
var ffmpeg = require('fluent-ffmpeg');
require('colors');

var util = require('./utils');
var presets = require('../data/presets');
var download = require('../lib/downloader');
var errorCodes = require('../data/error-codes');

var Pully = function (options, callback) {
	var me = this;

	// Ensure that each has a value...
	options.preset = options.preset || 'hd';
	options.count = options.count || 3;

	ytdl.getInfo(options.url, {
		downloadUrl : true
	}, function (err, info) {

		if (err) {
			callback && callback.call(me, err, info, null);
			process.exit(errorCodes.FAILED_TO_GET_INFO);
		}

        var presetFunc = presets[options.preset];

        if(!presetFunc)
        {
            console.error('Preset "'+options.preset+'" is not defined!');
            process.exit(errorCodes.INVALID_ARGUMENTS);
        }

		var bestFormats = presetFunc(info.formats);

        download.call(me, bestFormats, info, options, callback);
	});
}
module.exports = Pully;
