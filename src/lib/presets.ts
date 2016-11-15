import { Url } from 'url';
import { EventEmitter } from 'events';
import { Stream, Readable } from 'stream';

import { Preset, MediaFormat, MediaFilter, MediaSorter } from './models';

const MediaFilters = {
  fpsFilter: function (format: MediaFormat, options: Preset): boolean {
    return !options.maxFps || format.fps <= options.maxFps;
  } as MediaFilter,
  resolutionFilter: function (format: MediaFormat, options: Preset): boolean {
    return !options.maxResolution || format.resolution <= options.maxResolution;
  } as MediaFilter,
  audioBitrateFilter: function (format: MediaFormat, options: Preset) {
    return !options.maxAudioBitrate || format.audioBitrate <= options.maxAudioBitrate;
  } as MediaFilter
};

const MediaSorters = {
  fpsSort: function (a: MediaFormat, b: MediaFormat): number {
    return (b.fps || 0) - (a.fps || 0);
  } as MediaSorter,
  resolutionSort: function (a: MediaFormat, b: MediaFormat): number {
    return (b.resolution || 0) - (a.resolution || 0);
  } as MediaSorter,
  audioBitrateSort: function (a: MediaFormat, b: MediaFormat): number {
    return (a.audioBitrate || 0) - (b.audioBitrate || 0);
  } as MediaSorter
};

function override(base: Preset, overrides: Preset): Preset {
  return Object.assign({}, base, overrides);
}

const baseVideoPreset: Preset = {
  name: null,
  outputFormat: 'mp4',
  video: true,
  videoFilters: [MediaFilters.resolutionFilter, MediaFilters.fpsFilter],
  videoSort: [MediaSorters.resolutionSort, MediaSorters.fpsSort]
};

const maxPreset: Preset = override(baseVideoPreset, {
  name: 'max'
});

const fourKPreset = override(maxPreset, {
  name: '4k',
  maxResolution: 2160,
  maxFps: 60
});

const twoKPreset = override(fourKPreset, {
  name: '2k',
  maxResolution: 1440
});

const hdPreset: Preset = override(twoKPreset, {
  name: 'hd',
  maxResolution: 1080
});

const hfrPreset = override(hdPreset, {
  name: 'hfr',
  maxFps: null,
  videoSort: [MediaSorters.fpsSort, MediaSorters.resolutionSort]
});

const audioPreset: Preset = {
  name: 'audio',
  outputFormat: 'mp3',
  video: false,
  audioSort: [MediaSorters.audioBitrateSort]
};

export const DefaultPresets = [maxPreset, fourKPreset, twoKPreset, hdPreset, hfrPreset, audioPreset];

export const Presets = {
  Max: maxPreset.name,
  FourK: fourKPreset.name,
  TwoK: twoKPreset.name,
  HD: hdPreset.name,
  HFR: hfrPreset.name,
  Audio: audioPreset.name
};