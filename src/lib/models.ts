import { Url } from 'url';

export interface Lookup<TValue> {
  [key: string]: TValue;
}

export interface Options {
  presets?: Array<Preset>;
}

export interface Configuration extends Options {
  url: string;
  preset?: string;
  path?: string;
  parsedUrl?: Url;
}

export class MediaInfo
{
  public id?: string;
  public title?: string;
  public author?: string;
  public description?: string;
  public keywords?: Array<string>;
  public formats?: Array<MediaFormat>;

  constructor(data: any) {
    this.id = data.video_id;
    this.title = data.title;
    this.author = data.author;
    this.description = data.description;
    this.keywords = data.keywords || [];
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

  constructor(data: any) {
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
  }
}

export interface Preset {
  name: string;
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

export interface RequiredFormats {
  info?: MediaInfo;
  video?: MediaFormat;
  audio?: MediaFormat;
}