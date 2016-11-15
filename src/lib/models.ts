import { Url } from 'url';
import { Readable } from 'stream';

export interface Lookup<TValue> {
  [key: string]: TValue;
}

export interface PullyOptions {
  presets?: Array<Preset>;
  defaultPreset?: string;
}

export interface DownloadOptions {
  url: string;
  preset?: string;
  dir?: string;
  template?: string;
  verify?: (info: FormatInfo) => boolean | Promise<boolean>;
  progress?: (data: ProgressData) => void;
}

export interface DownloadResults {
  path?: string;
  //stream?: Readable;
  format: FormatInfo;
}

export class MediaInfo
{
  public id?: string;
  public title?: string;
  public author?: string;
  public description?: string;
  public keywords?: Array<string>;
  public formats?: Array<MediaFormat>;
  public downloadSize: number;
  public raw?: any;

  constructor(data: any) {
    this.raw = data;
    this.id = data.video_id;
    this.title = data.title;
    this.author = data.author;
    this.description = data.description;
    this.keywords = data.keywords || [];
    this.downloadSize = 0;
    this.formats = (data.formats || []).map((f: any) => new MediaFormat(f));
  }
}

export class MediaFormat {
  public audioBitrate?: number;
  public audioEncoding?: string;
  public bitrate?: string;
  public downloadSize?: number;
  public container?: string;
  public encoding?: string;
  public fps?: number;
  public itag?: string;
  public resolution?: number;
  public size?: string;
  public type?: string;
  public url?: string;

  public raw?: any;

  constructor(data: any) {
    this.raw = data;
    this.audioBitrate = data.audioBitrate;
    this.audioEncoding = data.audioEncoding;
    this.bitrate = data.bitrate;
    this.downloadSize = data.clen ? parseInt(data.clen, 10) : null;
    this.container = data.container;
    this.encoding = data.encoding;
    this.fps = parseInt(data.fps || '0', 10);
    this.itag = data.itag;
    this.size = data.size;
    this.resolution = parseInt(data.resolution || '0', 10) || (data.size && parseInt(data.size.split('x')[1], 10)) || 0;
    this.type = data.type;
    this.url = data.url;
  }
}

export interface Preset {
  name: string;
  outputFormat?: string;
  maxFps?: number;
  maxResolution?: number;
  maxAudioBitrate?: number;
  video?: boolean;
  videoFilters?: Array<MediaFilter>;
  videoSort?: Array<MediaSorter>;
  audioFilters?: Array<MediaFilter>;
  audioSort?: Array<MediaSorter>;
}

export interface MediaFilter {
  (format: MediaFormat, preset: Preset): boolean;
}

export interface MediaSorter {
  (a: MediaFormat, b: MediaFormat): number;
}

export interface FormatInfo {
  info?: MediaInfo;
  video?: MediaFormat;
  audio?: MediaFormat;
}

export interface ProgressData {
  downloadedBytes: number;
  totalBytes: number;
  progress: number;
  percent: number;
}