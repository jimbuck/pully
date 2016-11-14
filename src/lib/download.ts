import { Url } from 'url';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import { Readable, Transform } from 'stream';

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

import { MediaFormat, Preset, MediaInfo, RequiredFormats } from './models';
import { Analyzer } from './analyzer';

export class Download extends EventEmitter {
  
  public get url(): Url {
    return Object.assign({}, this._url);
  }

  public get preset(): Url {
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

  constructor(private _url: Url, private _preset: Preset) {
    super();

    try {
      this._download().catch(this._emitError.bind(this));
    } catch (err) {
      this._emitError(err);
    }
  }

  private _download(): Promise<Readable> {
    return this._analyzer.getRequiredFormats(this._url, this._preset)
      .then((results) => {
        this._emitInfo(results.info);

        this._totalBytes += (results.audio ? (results.audio.downloadSize || 0) : 0);
        this._totalBytes += (results.video ? (results.video.downloadSize || 0) : 0);

        this._emitProgress(); // Emit zero progress...

        return Promise.all([
          this._downloadTempFile(results.video),
          this._downloadTempFile(results.audio)
        ]);
      })
      .then(([videoPath, audioPath]) => {
        return this._mergeStreams(videoPath, audioPath);
      });
  }

  private _downloadTempFile(format: MediaFormat): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!format) {
        return resolve(null);
      }

      let path = Math.random() + '.mp4'; // TODO: Get temp path...

      ytdl(this._url.href, { format })
        .pipe(this._createProgressTracker())
        .pipe(createWriteStream(path))
        .on('finish', () => {
          resolve(path);
        })
        .on('error', (err: any) => {
          reject(err);
        });
    });
  }

  private _mergeStreams(videoPath: string, audioPath: string): Promise<Readable> {
    let ffmpegCommand = ffmpeg();
    
    if (videoPath) {
      ffmpegCommand = ffmpegCommand.input(videoPath).videoCodec('copy');
    } else {
      ffmpegCommand = ffmpegCommand.noVideo();
    }

    if (audioPath) {
      ffmpegCommand = ffmpegCommand.input(audioPath).audioCodec('copy');
    } else {
      ffmpegCommand = ffmpegCommand.noAudio();
    }

    // Get the stream...    
    let outputStream = ffmpegCommand.pipe();

    this._emitComplete(outputStream);
    return Promise.resolve(outputStream);
  }

  private _createProgressTracker(): Transform {
    let $this = this;

    return new Transform({
      transform: function (chunk: Buffer) {
        $this._downloadedBytes += chunk.length;
        $this._emitProgress();
        this.push(chunk);
      }
    });
  }

  private _emitInfo(formats: RequiredFormats): void {
    this.emit('info', formats);
  }

  // TODO: Debounce this event?  
  private _emitProgress(): void {
    this.emit('progress', {
      downloadedBytes: this._downloadedBytes,
      totalBytes: this._totalBytes,
      progress: this.progress
    });
  }

  private _emitComplete(stream: Readable): void {
    this.emit('complete', stream);
  }

  private _emitError(err: any): void {
    this.emit('err', err);
  }
}