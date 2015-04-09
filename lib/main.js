
var url = require('url');
var ytdl = require('ytdl-core');

require('colors');

var PresetManager = require('../lib/preset-manager');
var download = require('../lib/downloader');
var errorCodes = require('../data/error-codes');

var Pully = function (options, callback) {
    var me = this;

    // Ensure that each has a value...
    options.preset = options.preset || 'hd';

    var presets = new PresetManager(options.presets);

    options.parsedUrl = url.parse(options.url, true, true);

    downloadVideo.call(me, options, callback);

    function downloadVideo(options, callback) {
        var me = this;

        ytdl.getInfo(options.url, {
            downloadUrl: true
        }, function (err, info) {

            if(err) {
                callback && callback.call(me, err, info, null);
                process.exit(errorCodes.FAILED_TO_GET_INFO);
            }

            var presetFunc = presets[options.preset];

            if(typeof presetFunc === 'undefined') {
                console.error('Preset "' + options.preset + '" is not defined!');
                process.exit(errorCodes.INVALID_ARGUMENTS);
            }

            var bestFormats = presetFunc(info.formats);

            download.call(me, bestFormats, info, options, callback);
        });
    }
};

module.exports = Pully;
