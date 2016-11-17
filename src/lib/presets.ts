import { Preset, MediaFormat } from './models';

function fpsFilter (format: MediaFormat, options: Preset): boolean {
  return !options.maxFps || format.fps <= options.maxFps;
}
function resolutionFilter (format: MediaFormat, options: Preset): boolean {
  return !options.maxResolution || format.resolution <= options.maxResolution;
}
function audioBitrateFilter (format: MediaFormat, options: Preset) {
  return !options.maxAudioBitrate || format.audioBitrate <= options.maxAudioBitrate;
}

function fpsSort(a: MediaFormat, b: MediaFormat): number {
  return (b.fps || 0) - (a.fps || 0);
}
function resolutionSort(a: MediaFormat, b: MediaFormat): number {
  return (b.resolution || 0) - (a.resolution || 0);
}
function audioBitrateSort(a: MediaFormat, b: MediaFormat): number {
  return (a.audioBitrate || 0) - (b.audioBitrate || 0);
}

function override(base: Preset, overrides: Preset): Preset {
  return Object.assign({}, base, overrides);
}

const baseVideoPreset: Preset = {
  name: null,
  outputFormat: 'mp4',
  video: true,
  videoFilters: [resolutionFilter, fpsFilter],
  videoSort: [resolutionSort, fpsSort]
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
  videoSort: [fpsSort, resolutionSort]
});

const audioPreset: Preset = {
  name: 'audio',
  outputFormat: 'mp3',
  video: false,
  audioSort: [audioBitrateSort]
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