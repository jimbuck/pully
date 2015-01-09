var _ = require('underscore');

var errorCodes = require('../data/error-codes');

var defaults = {
    minResolution: 1,
    maxResolution: 9007199254740992,
    minFps: 1,
    maxFps: 9007199254740992,
    videoEncoding: null,
    audioEncoding: null
}

function PresetManager(presets) {

    this.load(presets);
}

PresetManager.prototype.load = function(presets) {
    var me = this;

    presets = presets || {};

    var defaultPresets = require('../data/presets');

    _.defaults(presets, defaultPresets);

    me.available = me.available || [];

    _.each(presets, function (preset, key) {

        me.available.push(key);

        // Convert each preset object to a function that returns
        //   the best audio and/or video formats.
        me[key] = function (formats) {

            // Filter audio first since we will almost always use that...
            var audioFormats = _.filter(formats, createAudioFilter(preset));

            // Return null if there are none...
            if(audioFormats.length === 0) {
                console.error('No valid audio formats found!');
                process.exit(errorCodes.INVALID_AUDIO_FORMAT);
            }

            // Sort the results from best to worst...
            audioFormats.sort(audioCompare);

            var bests = {
                audio: audioFormats[0]
            };

            // If all we need is audio, then move on...
            if(!preset.videoEncoding)
                return bests;

                // Filter videos to find all that meet specification...
                var videoFormats = _.filter(formats, createVideoFilter(preset));

                // Return null if there are none...
                if(videoFormats.length === 0) {
                    console.error('No valid video formats found!');
                    process.exit(errorCodes.INVALID_VIDEO_FORMAT);
                }

                videoFormats.sort(videoCompare);

                bests.video = videoFormats[0];

                return bests;
            };
        });

        me.available = _.uniq(me.available);
}

module.exports = PresetManager;

function createVideoFilter(options) {
    return function (format) {
        if(!~(format.type || '').indexOf('video/' + options.videoEncoding))
            return false;

        format.fps = parseInt(format.fps || 0);
        if(format.fps && (format.fps < options.minFps || format.fps > options.maxFps))
            return false;

        var resolution = (format.resolution && parseInt(format.resolution)) ||
            (format.size && parseInt(format.size.split('x')[1])) || 0;

        if(resolution > options.maxResolution || resolution > options.maxResolution)
            return false;

        return true;
    };
}

function createAudioFilter(options) {

    return function (format) {
        return !!~(format.type || '').indexOf('audio/' + options.audioEncoding);
    };
}

function videoCompare(a, b) {
    var ares = a.resolution ? parseInt(a.resolution) : a.size ? parseInt(a.size.split('x')[1]) : 0;
    var bres = b.resolution ? parseInt(b.resolution) : b.size ? parseInt(b.size.split('x')[1]) : 0;

    var afps = a.fps || 0;
    var bfps = b.fps || 0;

    var afeats = (~~!!ares * 2) + (~~!!afps);
    var bfeats = (~~!!bres * 2) + (~~!!bfps);

    if(afeats === bfeats) {
        if(ares === bres) {
            var abitrate, bbitrate, s;
            if(a.bitrate) {
                s = a.bitrate.split('-');
                abitrate = parseFloat(s[s.length - 1], 10);
            } else {
                abitrate = 0;
            }
            if(b.bitrate) {
                s = b.bitrate.split('-');
                bbitrate = parseFloat(s[s.length - 1], 10);
            } else {
                bbitrate = 0;
            }
            if(abitrate === bbitrate) {
                return audioCompare(a, b);
            } else {
                return bbitrate - abitrate;
            }
        } else {
            return bres - ares;
        }
    } else {
        return bfeats - afeats;
    }
}

function audioCompare(a, b) {
    var aabitrate = a.audioBitrate || 0;
    var babitrate = b.audioBitrate || 0;

    return aabitrate - babitrate;
}
