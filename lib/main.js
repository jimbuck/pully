var fs = require('fs');
var url = require('url');
var path = require('path');
var _ = require('underscore');
var ytdl = require('ytdl-core');
var request = require('request');
var ffmpeg = require('fluent-ffmpeg');
var sanitize = require("sanitize-filename");
require('colors');

var util = require('./utils');
var PresetManager = require('../lib/preset-manager');
var download = require('../lib/downloader');
var errorCodes = require('../data/error-codes');

var Pully = function (options, callback) {
    var me = this;

    // Ensure that each has a value...
    options.preset = options.preset || 'hd';
    options.count = options.count || 3;

    var presets = new PresetManager(options.presets);

    options.parsedUrl = url.parse(options.url, true, true);

    if(options.parsedUrl.path === '/playlist' && typeof options.parseUrl.query.list !== 'undefined') {
        downloadPlaylist.call(me, options, callback);
        return;
    }

    if(typeof options.parsedUrl.query.v !== 'undefined') {
        downloadVideo.call(me, options, callback);
        return;
    }

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

    function downloadPlaylist(options, callback) {

        console.log('Playlists are not yet supported but will be in the future!');
        return;

        request.get()

        var videoUrls = []; // TODO: Get urls from playlist id

        for(var i in videoUrls){
            var videoOptions = _.defaults({

            }, options);
        }
    }
}
module.exports = Pully;
