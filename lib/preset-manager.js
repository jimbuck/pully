'use strict';

const _ = require('underscore');

const ERROR_CODES = require('../data/error-codes');

class PresetManager {
  constructor(presets) {
    this.presets = {};
    this.load(presets);
  }

  get(key) {
    return this[key];
  }

  load(presets) {

    presets = presets || {};

    const defaultPresets = require('../data/presets');

    _.defaults(presets, defaultPresets);

    this.available = this.available || [];

    _.each(presets, function (preset, key) {

      this.available.push(key);

      this[key] = preset;

      // Convert each preset object to a function that returns
      //   the best audio and/or video formats.
      this[key].process = function (formats) {

        let bests = {};

        if (preset.audioIn) {
          // Filter audio first since we will almost always use that...
          let audioFormats = _.filter(formats, this._createAudioFilter(preset));

          // Return null if there are none...
          if (audioFormats.length === 0) {
            throw new Error(ERROR_CODES.INVALID_AUDIO_FORMAT + ': No valid audio formats found!');
          }

          // Sort the results from best to worst...
          audioFormats.sort(this._audioCompare);

          bests.audio = audioFormats[0];
        }

        // If all we need is audio, then move on...
        if (!preset.videoIn) {
          return bests;
        }

        // Filter videos to find all that meet specification...
        let videoFormats = _.filter(formats, this._createVideoFilter(preset));

        // Return null if there are none...
        if (videoFormats.length === 0) {
          throw new Error(ERROR_CODES.INVALID_VIDEO_FORMAT + ': No valid video formats found!');
        }

        videoFormats.sort(this._videoCompare);

        bests.video = videoFormats[0];

        return bests;
      }.bind(this);
    }.bind(this));

    this.available = _.uniq(this.available);
  }

  _createVideoFilter(options) {
    return (format) => {

      if (!~(format.type || '').indexOf('video/' + options.videoIn)) {
        return false;
      }

      format.fps = parseInt(format.fps, 10) || 0;
      if (format.fps && (format.fps < options.minFps || format.fps > options.maxFps)) {
        return false;
      }

      let resolution = (format.resolution && parseInt(format.resolution, 10)) ||
        (format.size && parseInt(format.size.split('x')[1], 10)) || 0;

      if (resolution > options.maxResolution || resolution > options.maxResolution) {
        return false;
      }

      return true;
    };
  }

  _createAudioFilter(options) {
    return (format) => !!~(format.type || '').indexOf('audio/' + options.audioIn);
  }

  _videoCompare(a, b) {
    let ares = a.resolution ? parseInt(a.resolution, 10) : a.size ? parseInt(a.size.split('x')[1], 10) : 0;
    let bres = b.resolution ? parseInt(b.resolution, 10) : b.size ? parseInt(b.size.split('x')[1], 10) : 0;

    let afps = a.fps || 0;
    let bfps = b.fps || 0;

    let afeats = (~~!!ares * 2) + (~~!!afps);
    let bfeats = (~~!!bres * 2) + (~~!!bfps);

    if (afeats === bfeats) {
      if (ares === bres) {
        let abitrate, bbitrate, s;
        if (a.bitrate) {
          s = a.bitrate.split('-');
          abitrate = parseFloat(s[s.length - 1], 10);
        } else {
          abitrate = 0;
        }
        if (b.bitrate) {
          s = b.bitrate.split('-');
          bbitrate = parseFloat(s[s.length - 1], 10);
        } else {
          bbitrate = 0;
        }
        if (abitrate === bbitrate) {
          return this._audioCompare(a, b);
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

  _audioCompare(a, b) {
    let aabitrate = a.audioBitrate || 0;
    let babitrate = b.audioBitrate || 0;

    return aabitrate - babitrate;
  }
}

module.exports = PresetManager;