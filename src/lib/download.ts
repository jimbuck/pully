import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { Readable, Transform, PassThrough } from 'stream';

const template = require('lodash.template');
const mkdirp = require('mkdirp-promise');
import { file, setGracefulCleanup } from 'tmp';
setGracefulCleanup();

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

import { DownloadOptions, MediaFormat, DownloadResults, Preset, MediaInfo, FormatInfo, ProgressData } from './models';
import { Analyzer } from './analyzer';
import { scrubObject } from '../utils/scrub';


const TEMP_FILE_PREFIX = 'pully-';
const TEMP_AUDIO_EXT = '.m4a';
const TEMP_VIDEO_EXT = '.mp4';
const DEFAULT_FILENAME_TEMPLATE = '${author}/${title}';

function getTempPath(suffix: string): Promise<string> {
  return new Promise((resolve, reject) => {
    file({ prefix: TEMP_FILE_PREFIX, postfix: suffix }, (err, path) => {
      if (err) {
        return reject(err);
      }

      resolve(path);
    });
  });
}

function ffmpegSave(ffmpegCommand: any, path: string): Promise<string> {
  let dir = dirname(path);

  return mkdirp(dir).then(() => {
    return new Promise((resolve, reject) => {
      ffmpegCommand
        .on('error', reject)
        .on('progress', (data: any) => {
          console.log('ffmpeg progress: ' + data.percent);
        })
        .on('end', () => resolve(path))
        .save(path);
    });
  });
} 

export class Download extends EventEmitter {
  
  public get url(): string {
    return this._options.url;
  }
 
  public get preset(): Preset {
    return Object.assign({}, this._preset);
  }

  public get progress(): number {
    if (!this._totalBytes || !this._downloadedBytes) {
      return 0;
    }

    return this._downloadedBytes / this._totalBytes;
  }

  private _totalBytes: number = 0;
  private _downloadedBytes: number = 0;

  private _analyzer: Analyzer = new Analyzer();

  constructor(private _options: DownloadOptions, private _preset: Preset) {
    super();

    this._options.verify = this._options.verify || (() => true);
  }

  public download(): Promise<DownloadResults> {
    return this._analyzer
      .getRequiredFormats(this.url, this._preset)
      .then((format) => {
        return Promise.resolve(this._options.verify(format))
          .then(verified => {
            if (!verified) {
              throw new Error(`Download cancelled!`);
            }

            return format;
          });
      })
      .then((format) => {
        this._totalBytes += (format.audio ? (format.audio.downloadSize || 0) : 0);
        this._totalBytes += (format.video ? (format.video.downloadSize || 0) : 0);

        this._emitProgress(); // Emit zero progress...

        return Promise.all([
          this._downloadTempFile(format.info, format.video, TEMP_VIDEO_EXT),
          this._downloadTempFile(format.info, format.audio, TEMP_AUDIO_EXT),
          this._getOutputPath(format.info)
        ])
          .then(([videoPath, audioPath, outputPath]) => {
            return this._mergeStreams(videoPath, audioPath, outputPath)
              .then(path => {
                return { path, format };
              });
          });
      });
  }

  private _downloadTempFile(info: MediaInfo, format: MediaFormat, ext: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!format) {
        return resolve(null);
      }

      getTempPath(ext).then(path => {
        ytdl.downloadFromInfo(info.raw, { format: format.raw })
          .pipe(this._createProgressTracker())
          .pipe(createWriteStream(path))
          .on('finish', () => resolve(path))
          .on('error', (err: any) => reject(err));
      });
    });
  }

  private _mergeStreams(videoPath: string, audioPath: string, outputPath: string): Promise<string> {
    let ffmpegCommand = ffmpeg().format(this._preset.outputFormat);
    
    if (videoPath) {
      ffmpegCommand = ffmpegCommand.input(videoPath);//.videoCodec('copy');
    }
    
    if (audioPath) {
      ffmpegCommand = ffmpegCommand.input(audioPath);//.audioCodec('copy');
    }

    return ffmpegSave(ffmpegCommand, outputPath);
  }

  private _getOutputPath(info: MediaInfo): Promise<string> {
    
    if (this._options.dir) {
      let safeInfo = scrubObject(info);

      let filename = template(this._options.template || DEFAULT_FILENAME_TEMPLATE)(safeInfo) + '.' + this._preset.outputFormat;

      return Promise.resolve(join(this._options.dir, filename));
    } else {
      return getTempPath('.' + this._preset.outputFormat);
    }
  }

  private _createProgressTracker(): Transform {
    return new Transform({
      transform: (chunk, encoding, cb) => {
        this._downloadedBytes += chunk.length;
        this._emitProgress();
        cb(null, chunk);
      }
    });
  }

  // TODO: Debounce this event?  
  private _emitProgress(): void {
    if (!this._options.progress) {
      return;
    }

    this._options.progress({
      downloadedBytes: this._downloadedBytes,
      totalBytes: this._totalBytes,
      progress: this.progress,
      percent: Math.floor(this.progress * 10000)/100
    } as ProgressData);
  }
}