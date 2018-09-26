import { VideoResult } from 'pully-core';

export type TemplateFunction = ((result: VideoResult) => string);
export type FilenameTemplate = string | TemplateFunction;

export interface PullyOptions {
  preset?: string;
  template?: FilenameTemplate;
  dir?: string;
  verify?: (info: FormatInfo) => boolean | Promise<boolean>;
  additionalPresets?: Array<Preset>;
}

export interface DownloadOptions {
  url?: string;
  preset?: string;
  dir?: string;
  template?: FilenameTemplate;
  info?: (info: FormatInfo, cancel: (msg?: string) => void) => void;
  progress?: (data: ProgressData) => void;
}

export interface DownloadConfig {
  url: string;
  preset?: Preset;
  dir?: string;
  template?: TemplateFunction;
  info?: (info: FormatInfo, cancel: (msg: string) => void) => void;
  progress?: (data: ProgressData) => void;
}

export interface DownloadResults {
  path?: string;
  format: FormatInfo;
  duration: number;
}

export interface QueryResult extends VideoResult {
  formats: Array<MediaFormat>;
  raw: any;
}

export interface MediaFormat {
  audioBitrate: number;
  audioEncoding: string;
  bitrate: string;
  downloadSize: number;
  container: string;
  encoding: string;
  fps: number;
  itag: string;
  resolution: number;
  size: string;
  type: string;
  url: string;

  raw: any;
}

export interface Preset {
  name: string;
  outputFormat?: string;
  maxFps?: number;
  maxResolution?: number;
  maxAudioBitrate?: number;
  videoFilters?: Array<(format: MediaFormat, preset: Preset) => boolean>;
  videoSort?: Array<(a: MediaFormat, b: MediaFormat) => number>;
  audioFilters?: Array<(format: MediaFormat, preset: Preset) => boolean>;
  audioSort?: Array<(a: MediaFormat, b: MediaFormat) => number>;
}

export interface FormatInfo {
  data: QueryResult;
  video?: MediaFormat;
  audio: MediaFormat;
  downloadSize: number;
}

export interface ProgressData {
  downloadedBytes?: number;
  totalBytes?: number;
  progress?: number;
  percent?: number;
  indeterminate?: boolean;
}