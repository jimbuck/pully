import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { Readable, Transform, PassThrough } from 'stream';

const ytdl = require('ytdl-core');
const mkdirp = require('mkdirp-promise');
const ffmpeg = require('fluent-ffmpeg');
import { file, setGracefulCleanup } from 'tmp';
setGracefulCleanup();

import { DownloadConfig, MediaFormat, DownloadResults, Preset, MediaInfo, FormatInfo, ProgressData } from './models';
import { Analyzer } from './analyzer';
import { scrubObject } from '../utils/scrub';

const CANCELLED_MESSAGE = 'CANCELLED';
const TEMP_FILE_PREFIX = 'pully-';
const TEMP_AUDIO_EXT = '.m4a';
const TEMP_VIDEO_EXT = '.mp4';
const DEFAULT_FILENAME_TEMPLATE = '${author}/${title}';

export class Download {
 
  private get _progress(): number {
    if (!this._totalBytes || !this._downloadedBytes) {
      return 0;
    }

    return this._downloadedBytes / this._totalBytes;
  }

  private _totalBytes: number = 0;
  private _downloadedBytes: number = 0;

  private _format: FormatInfo;

  constructor(
    private _config: DownloadConfig,
    private _analyzer: Analyzer = new Analyzer()
  ) { }

  public start(): Promise<DownloadResults> {
    return this._getFormats()
      .then(() => {
        this._totalBytes += (this._format.audio ? (this._format.audio.downloadSize || 0) : 0);
        this._totalBytes += (this._format.video ? (this._format.video.downloadSize || 0) : 0);

        this._emitProgress(); // Emit zero progress...

        return Promise.all([
          this._downloadTempFile(this._format.video, TEMP_VIDEO_EXT),
          this._downloadTempFile(this._format.audio, TEMP_AUDIO_EXT),
          this._getOutputPath()
        ])
      })
      .then(([videoPath, audioPath, outputPath]) => {
        return this._mergeStreams(videoPath, audioPath, outputPath)
      })
      .then(path => {
        return { path, format: this._format };
      });
  }

  private _getFormats(): Promise<void> {
    return this._analyzer.getRequiredFormats(this._config.url, this._config.preset)
      .then(format => {
        let cancelled = false;
        return Promise.resolve(this._config.info(format, () => cancelled = true)).then(() => {
          if (cancelled) {
            throw new Error(CANCELLED_MESSAGE);
          } else {
            this._format = format;
          }
        });
      });
  }

  private _downloadTempFile(format: MediaFormat, ext: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!format) {
        return resolve(null);
      }

      this._getTempPath(ext).then(path => {
        ytdl.downloadFromInfo(this._format.info.raw, { format: format.raw })
          .pipe(this._createProgressTracker())
          .pipe(createWriteStream(path))
          .on('finish', () => resolve(path))
          .on('error', (err: any) => reject(err));
      });
    });
  }

  private _mergeStreams(videoPath: string, audioPath: string, outputPath: string): Promise<string> {
    let ffmpegCommand = ffmpeg()
      .format(this._config.preset.outputFormat)
      .outputOptions('-metadata', `title=${this._format.info.title}`)
      .outputOptions('-metadata', `author=${this._format.info.author}`).outputOptions('-metadata', `artist=${this._format.info.author}`)
      .outputOptions('-metadata', `description=${this._format.info.description}`).outputOptions('-metadata', `comment=${this._format.info.description}`)
      .outputOptions('-metadata', `episode_id=${this._format.info.id}`)
      .outputOptions('-metadata', `network=YouTube`);
    
    if (videoPath) {
      ffmpegCommand = ffmpegCommand.input(videoPath);
    }
    
    if (audioPath) {
      ffmpegCommand = ffmpegCommand.input(audioPath);
    }

    return this._ffmpegSave(ffmpegCommand, outputPath);
  }

  private _getOutputPath(): Promise<string> {
    if (this._config.dir) {
      let safeInfo = scrubObject(this._format.info);

      let filename = this._config.template(safeInfo) + '.' + this._config.preset.outputFormat;

      return Promise.resolve(join(this._config.dir, filename));
    } else {
      return this._getTempPath('.' + this._config.preset.outputFormat);
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

  // TODO: Throttle this event to avoid performance drops?
  private _emitProgress(indeterminate?: boolean): void {
    if (!this._config.progress) {
      return;
    }

    let data: ProgressData = indeterminate ? { indeterminate } : {
      downloadedBytes: this._downloadedBytes,
      totalBytes: this._totalBytes,
      progress: this._progress,
      percent: Math.floor(this._progress * 10000) / 100
    };

    this._config.progress(data);
  }

  private _getTempPath(suffix: string): Promise<string> {
    return new Promise((resolve, reject) => {
      file({ prefix: TEMP_FILE_PREFIX, postfix: suffix }, (err, path) => {
        if (err) {
          return reject(err);
        }

        resolve(path);
      });
    });
  }

  private _ffmpegSave(ffmpegCommand: any, path: string): Promise<string> {
    let dir = dirname(path);

    return mkdirp(dir).then(() => {
      return new Promise((resolve, reject) => {
        ffmpegCommand
          .on('error', reject)
          .on('progress', (data: any) => {
            this._emitProgress(true);
          })
          .on('end', () => resolve(path))
          .save(path);
      });
    });
  }
}