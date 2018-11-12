import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { Readable, Transform } from 'stream';

const throttle = require('lodash.throttle');
const mkdirp = require('mkdirp-promise');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
import * as ffmpeg from 'fluent-ffmpeg';
import { file as createTempDir, setGracefulCleanup } from 'tmp';
setGracefulCleanup();

import { downloadFromInfo, MediaFormat } from 'pully-core';
import { DownloadConfig, DownloadResults, FormatInfo, ProgressData } from './models';
import { getBestFormats } from './analyzer';
import { Speedometer } from '../utils/speedometer';
import { toHumanTime } from '../utils/human';

const TEMP_FILE_PREFIX = 'pully-';
const TEMP_AUDIO_EXT = '.m4a';

export class Download {
 
  private get _progress(): number {
    if (!this._totalBytes || !this._downloadedBytes) {
      return 0;
    }

    return this._downloadedBytes / this._totalBytes;
  }

  private _totalBytes: number = 0;
  private _downloadedBytes: number = 0;
  private _start: number;

  private _format: FormatInfo;

  private _emitProgress: (indeterminate?: boolean) => void;
  private _speedometer: Speedometer;

  constructor(
    private _config: DownloadConfig
  ) {
    this._speedometer = new Speedometer();
    this._emitProgress = throttle((indeterminate?: boolean) => {
      if (!this._config.progress) {
        return;
      }

      if (indeterminate) {
        this._config.progress({ indeterminate });
        return;
      }
      let elapsed = Date.now() - this._start;
      let eta = this._speedometer.eta(this._totalBytes);

      this._speedometer.record(this._downloadedBytes);
      this._config.progress({
        indeterminate: false,
        downloadedBytes: this._downloadedBytes,
        totalBytes: this._totalBytes,
        progress: this._progress,
        percent: Math.floor(this._progress * 10000) / 100,
        bytesPerSecond: this._speedometer.bytesPerSecond,
        downloadSpeed: this._speedometer.currentSpeed,
        elapsed,
        elapsedStr: toHumanTime(elapsed/1000),
        eta,
        etaStr: toHumanTime(eta)
      });
    }, 500, { leading: true, trailing: true });
  }

  public start(): Promise<DownloadResults> {
    this._start = Date.now();
    return this._getFormats()
      .then(() => {
        this._totalBytes += (this._format.audio ? (this._format.audio.downloadSize || 0) : 0);
        this._totalBytes += (this._format.video ? (this._format.video.downloadSize || 0) : 0);

        this._emitProgress(); // Emit zero progress...

        return this._downloadAudioThenStreamVideo()
      })
      .then(path => {
        return { path, format: this._format, duration: null };
      });
  }

  private async _getFormats(): Promise<void> {
    const format = await getBestFormats(this._config.url, this._config.preset);
    let cancelledReason: string;

    await Promise.resolve(this._config.info(format, (msg) => cancelledReason = msg));
    
    if (cancelledReason) {
      throw new Error(cancelledReason);
    } else {
      this._format = format;
      this._format.path = await this._getOutputPath();
    }
  }

  private _downloadAudioThenStreamVideo(): Promise<string> {
    return this._getTempPath(TEMP_AUDIO_EXT)
      .then(path => this._downloadFile(this._format.audio, path))
      .then(audioPath => {
        return Promise.all([
          this._format.video ? this._downloadStream(this._format.video) : null,
        ]).then(([videoStream]) => {
          return this._processOutput(this._format.path, audioPath, videoStream);
        });
      });
  }

  private _downloadStream(format: MediaFormat): Readable {
    if (!this._format.data || !format) {
      throw new Error(`Missing required format!`);
    }
    return downloadFromInfo(this._format.data.raw, format.raw).pipe(this._createProgressTracker());
  }

  private _downloadFile(format: MediaFormat, path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this._downloadStream(format)
        .pipe(createWriteStream(path))
        .on('finish', () => resolve(path))
        .on('error', reject);
    });
  }

  private _processOutput(outputPath: string, primary: string, secondary: string): Promise<string>;
  private _processOutput(outputPath: string, primary: string, secondary: Readable): Promise<string>;
  private _processOutput(outputPath: string, primary: Readable): Promise<string>;
  private _processOutput(outputPath: string, primary: string|Readable, secondary?: string|Readable): Promise<string> {
    let ffmpegCommand = this._createFfmpegCommand();
    
    if (primary) {
      ffmpegCommand = ffmpegCommand.input(primary);
    }
    
    if (secondary) {
      ffmpegCommand = ffmpegCommand.input(secondary);
    }

    return this._ffmpegSave(ffmpegCommand, outputPath, secondary && typeof secondary === 'string');
  }

  private async _getOutputPath(): Promise<string> {
    if (this._config.dir) {
      let filename = this._config.template(this._format.data) + '.' + this._config.preset.outputFormat;

      return join(this._config.dir, filename);
    } else {
      return await this._getTempPath('.' + this._config.preset.outputFormat);
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

  private _getTempPath(suffix: string): Promise<string> {
    return new Promise((resolve, reject) => {
      createTempDir({ prefix: TEMP_FILE_PREFIX, postfix: suffix }, (err, path) => {
        if (err) {
          return reject(err);
        }

        resolve(path);
      });
    });
  }

  private _createFfmpegCommand(): any {
    return ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .format(this._config.preset.outputFormat)
      .outputOptions('-metadata', `title=${this._format.data.videoTitle}`)
      .outputOptions('-metadata', `author=${this._format.data.channelName}`).outputOptions('-metadata', `artist=${this._format.data.channelName}`)
      .outputOptions('-metadata', `description=${this._format.data.description}`).outputOptions('-metadata', `comment=${this._format.data.description}`)
      .outputOptions('-metadata', `episode_id=${this._format.data.videoId}`)
      .outputOptions('-metadata', `network=YouTube`);
  }

  private _ffmpegSave(ffmpegCommand: any, path: string, indeterminate: boolean): Promise<string> {
    let dir = dirname(path);

    return mkdirp(dir).then(() => {
      return new Promise((resolve, reject) => {
        ffmpegCommand
          .on('progress', (data: any) => this._emitProgress(indeterminate))
          .on('error', reject)
          .on('end', () => resolve(path))
          .save(path);
      });
    });
  }
}