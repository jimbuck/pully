import { MediaFormat } from 'pully-core';
import { Preset } from './models';

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

function extendPreset(base: Preset, overrides: Preset): Preset {
  return Object.assign({}, base, overrides);
}

const baseVideoPreset: Preset = {
  name: null,
  maxResolution: Number.MAX_SAFE_INTEGER,
  maxFps: 60,
  videoFilters: [resolutionFilter, fpsFilter],
  videoSort: [resolutionSort, fpsSort],
  audioSort: [audioBitrateSort],
  maxAudioBitrate: 128
};

export const baseAudioPreset: Preset = {
  name: null,
  audioFilters: [audioBitrateFilter],
  audioSort: [audioBitrateSort],
  maxAudioBitrate: 128
};

export const maxPreset: Preset = {
  name: 'max',
  maxFps: Number.MAX_SAFE_INTEGER,
  maxResolution: Number.MAX_SAFE_INTEGER,
  maxAudioBitrate: Number.MAX_SAFE_INTEGER
};

const fourKPreset: Preset = {
  name: '4k',
  maxResolution: 2160
};

const twoKPreset: Preset = {
  name: '2k',
  maxResolution: 1440
};

const hdPreset: Preset = {
  name: 'hd',
  maxResolution: 1080
};

const sdPreset: Preset = {
  name: 'sd',
  maxResolution: 720
};

const ldPreset: Preset = {
  name: 'ld',
  maxResolution: 480
};

const hfrPreset: Preset = {
  name: 'hfr',
  maxFps: Number.MAX_SAFE_INTEGER,
  maxResolution: Number.MAX_SAFE_INTEGER,
  videoSort: [fpsSort, resolutionSort]
};

const mp3Preset: Preset = {
  name: 'mp3',
  outputFormat: 'mp3',
  maxAudioBitrate: Number.MAX_SAFE_INTEGER
};

export function prepPreset(preset: Preset): Preset {
  if (!preset.maxResolution && !preset.maxAudioBitrate) {
    throw new Error(`Custom presets must have at least a maxAudioBitrate or maxResolution`);
  }

  if (!preset.maxResolution) {
    preset = extendPreset(baseAudioPreset, preset);
  } else {
    preset = extendPreset(baseVideoPreset, preset);
  }

  return preset;
}

export const DefaultPresets = [maxPreset, fourKPreset, twoKPreset, hdPreset, sdPreset, ldPreset, hfrPreset, mp3Preset];

export const Presets = {
  Max: maxPreset.name,
  FourK: fourKPreset.name,
  TwoK: twoKPreset.name,
  HD: hdPreset.name,
  SD: sdPreset.name,
  LD: ldPreset.name,
  HFR: hfrPreset.name,
  MP3: mp3Preset.name
};