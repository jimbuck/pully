import { createWriteStream, unlinkSync as deleteFile } from 'fs';
import { join as joinPath, dirname } from 'path';
import { Readable, Transform } from 'stream';
import { EventEmitter } from 'events';

import * as debug from 'debug';
const throttle = require('lodash.throttle');
const mkdirp = require('mkdirp-promise');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
import * as ffmpeg from 'fluent-ffmpeg';
const tempRoot = joinPath(require('temp-dir'), 'pully');

const log = debug('pully:download');

import { downloadFromInfo, MediaFormat } from 'pully-core';
import { DownloadResults, FormatInfo, ProgressData, InternalDownloadConfig, DownloadMode } from './models';
import { getBestFormats } from './analyzer';
import { Speedometer } from '../utils/speedometer';
import { toHumanTime } from '../utils/human';

const TEMP_AUDIO_EXT = 'm4a';
const TEMP_VIDEO_EXT = 'mp4';

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

  private _tempFiles: string[] = [];

  constructor(
    private _config: InternalDownloadConfig,
    private _emitter: EventEmitter
  ) {
    this._speedometer = new Speedometer();
    this._emitProgress = throttle((indeterminate?: boolean) => {

      if (indeterminate) {
        this._config.progress && this._config.progress({ indeterminate });
        return;
      }
      const elapsed = Date.now() - this._start;
      this._speedometer.record(this._downloadedBytes);
      const eta = this._speedometer.eta(this._totalBytes);

      const progress: ProgressData = {
        indeterminate: false,
        downloadedBytes: this._downloadedBytes,
        totalBytes: this._totalBytes,
        progress: this._progress,
        percent: Math.floor(this._progress * 10000) / 100,
        bytesPerSecond: this._speedometer.bytesPerSecond,
        downloadSpeed: this._speedometer.currentSpeed,
        elapsed,
        elapsedStr: toHumanTime(elapsed / 1000),
        eta,
        etaStr: toHumanTime(eta)
      };

      log(`${progress.percent}% downloaded (${progress.downloadedBytes}/${progress.totalBytes}) [${progress.elapsedStr} -> ${progress.etaStr}]...`);
      this._emitter.emit('progress', { progress, config: this._config });
      this._config.progress && this._config.progress(progress);
    }, 500, { leading: true, trailing: true });
  }

  public async start(): Promise<DownloadResults> {
    this._start = Date.now();
    let cancellationReason = await this._getFormats();

    if (cancellationReason) {
      return { path: null, format: this._format, duration: (Date.now() - this._start), cancelled: true, reason: cancellationReason };
    }

    this._totalBytes += (this._format.audio ? (this._format.audio.downloadSize || 0) : 0);
    this._totalBytes += (this._format.video ? (this._format.video.downloadSize || 0) : 0);

    this._emitProgress(); // Emit zero progress...

    const path = await this._beginDownload();

    this._cleanup();

    return { path, format: this._format, duration: (Date.now() - this._start), cancelled: false };
  }

  private async _getFormats(): Promise<string> {
    this._format = await getBestFormats(this._config.url, this._config.preset);
    this._format.path = await this._getOutputPath();
    
    let cancelledReason: string;

    await Promise.resolve(this._config.info(this._format, (msg) => cancelledReason = msg));
    
    if (cancelledReason) {
      let cancelStr = `Download Cancelled: "${cancelledReason}".`;
      log(cancelStr);
      return cancelStr;
    } else {
      return null;
    }
  }

  private async _beginDownload(): Promise<string> {
    switch (this._config.mode) {
      case DownloadMode.Merge:
        return this._downloadAudioAndMergeVideo();
      case DownloadMode.Sequential:
        return this._downloadAudioThenVideoThenMerge();
      case DownloadMode.Parallel:
        return this._downloadAudioAndVideoThenMerge();
      case DownloadMode.Parts:
        return this._downloadPartsThenMerge();
    }
  }

  private async _downloadAudioAndMergeVideo(): Promise<string> {
    let audioPath = await this._getTempPath(TEMP_AUDIO_EXT);
    audioPath = await this._downloadFile(this._format.audio, audioPath);

    let videoStream: Readable = null;
    if (this._format.video) videoStream = this._getDownloadStream(this._format.video);

    return this._processOutput(this._format.path, audioPath, videoStream);
  }

  private async _downloadAudioThenVideoThenMerge(): Promise<string> {
    let audioPath = await this._getTempPath(TEMP_AUDIO_EXT);
    await this._downloadFile(this._format.audio, audioPath);

    let videoPath: string = null;
    if (this._format.video) {
      videoPath = await this._getTempPath(TEMP_VIDEO_EXT);
      await this._downloadFile(this._format.video, videoPath);
    }

    return this._processOutput(this._format.path, audioPath, videoPath);
  }

  private async _downloadAudioAndVideoThenMerge(): Promise<string> {
    let audioPath = await this._getTempPath(TEMP_AUDIO_EXT);
    let audioPromise = this._downloadFile(this._format.audio, audioPath);

    let videoPath: string = null;
    let videoPromise: Promise<string> = Promise.resolve(null);
    if (this._format.video) {
      videoPath = await this._getTempPath(TEMP_VIDEO_EXT);
      videoPromise = this._downloadFile(this._format.video, videoPath);
    }

    await Promise.all([audioPromise, videoPromise]);

    return this._processOutput(this._format.path, audioPath, videoPath);
  }

  private async _downloadPartsThenMerge(): Promise<string> {
    throw new Error('Not yet implemented!');
  }

  private _getDownloadStream(format: MediaFormat): Readable {
    if (!this._format.data || !format) {
      throw new Error(`Missing required format!`);
    }
    return downloadFromInfo(this._format.data.raw, format.raw).pipe(this._createProgressTracker());
  }

  private _downloadFile(format: MediaFormat, path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this._getDownloadStream(format)
        .pipe(createWriteStream(path))
        .on('finish', () => resolve(path))
        .on('error', reject);
    });
  }

  private _processOutput(outputPath: string, primary: string, secondary: string): Promise<string>;
  private _processOutput(outputPath: string, primary: string, secondary: Readable): Promise<string>;
  private _processOutput(outputPath: string, primary: Readable): Promise<string>;
  private _processOutput(outputPath: string, audioSrc: string|Readable, videoSrc?: string|Readable): Promise<string> {
    let ffmpegCommand = this._createFfmpegCommand();
    
    if (this._config.preset.outputFormat) {
      ffmpegCommand = ffmpegCommand.format(this._config.preset.outputFormat);
    }

    if (audioSrc) {
      ffmpegCommand = ffmpegCommand.input(audioSrc);
      if (!this._config.preset.outputFormat) ffmpegCommand = ffmpegCommand.audioCodec('copy');
    }
    
    if (videoSrc) {
      ffmpegCommand = ffmpegCommand.input(videoSrc);
      if (!this._config.preset.outputFormat) ffmpegCommand = ffmpegCommand.videoCodec('copy')
    }

    return this._ffmpegSave(ffmpegCommand, outputPath, videoSrc && typeof videoSrc === 'string');
  }

  private async _getOutputPath(): Promise<string> {
    let ext = this._config.preset.outputFormat ? this._config.preset.outputFormat : (this._format.video || this._format.audio).container;
    let filename = this._config.template(this._format.data) + '.' + ext;
    let outDir = this._config.dir ? this._config.dir : tempRoot;
    return joinPath(outDir, filename);
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

  private async _getTempPath(suffix: string): Promise<string> {
    let tempPath = joinPath(tempRoot, `${this._format.data.videoId}_${this._config.preset.name}.${suffix}`);

    await mkdirp(tempRoot);

    this._tempFiles.push(tempPath);

    return tempPath;
  }

  private _createFfmpegCommand(): any {
    return ffmpeg()
      .setFfmpegPath(ffmpegPath)
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
          .on('error', (err: Error, stdout: string, stderr: string) => {
            console.error(JSON.stringify({ err, stdout, stderr }, null, '  '));
            reject(err.message);
          })
          .on('end', (stdout: string, stderr: string) => resolve(path))
          .save(path);
      });
    });
  }

  private _cleanup(): void {
    try {
      this._tempFiles.forEach(tempFile => {
        try {
          deleteFile(tempFile);
        } catch { }
      });
    } catch { }
  }
}