import { resolve as resolvePath } from 'path';
import { EventEmitter } from 'events';

import * as debug from 'debug';
import { template, query, scrubObject, VideoResult, QueryResult } from 'pully-core';

import { Preset, PullyOptions, DownloadConfig, DownloadResults, ProgressData, InternalDownloadConfig, DownloadMode } from './lib/models';
import { Download } from './lib/download';
import { Presets, DefaultPresets, prepPreset } from './lib/presets';

const DEFAULT_TEMPLATE = '${videoTitle}__${channelName}';

const log = debug('pully:index');

export { PullyOptions, DownloadConfig, Presets, ProgressData, DownloadResults, DownloadMode };

export declare interface Pully {
  on(event: 'query', listener: (args: QueryResult) => void): this;
  on(event: 'downloadstarted', listener: (args: DownloadConfig) => void): this;
  on(event: 'downloadcomplete', listener: (args: DownloadResults) => void): this;
  on(event: 'downloadcancelled', listener: (args: DownloadResults) => void): this;
  on(event: 'downloadfailed', listener: (args: { err: any, options: DownloadConfig }) => void): this;
  on(event: 'progress', listener: (args: { progress: ProgressData, options: DownloadConfig }) => void): this;
}

export class Pully extends EventEmitter {

  private _presets: {[key: string]: Preset} = {};

  constructor(private _config?: PullyOptions) {
    super();
    this._config = this._config || {};
    this._registerPresets(DefaultPresets)._registerPresets(this._config.additionalPresets);
  }
  
  public async query(url: string): Promise<QueryResult> {
    let results = await query(url);
    this.emit('query', results);
    return results;
  }
  
  public async download(url: string): Promise<DownloadResults>;
  public async download(url: string, preset: string): Promise<DownloadResults>;
  public async download(options: DownloadConfig): Promise<DownloadResults>;
  public async download(input: string | DownloadConfig, preset?: string): Promise<DownloadResults> {
    const globalStart = Date.now();
    if (typeof input === 'string') {
      input = {
        url: input,
        preset
      };
    }

    let options = await this._formatConfig(input);

    log(`Download started (strategy: ${options.mode})...`);
    this.emit('downloadstarted', options);

    let dlPromise = new Download(options, this).start();

    dlPromise.then(
      results => {
        results.duration = Date.now() - globalStart;
        if (results.cancelled) {
          log(`Download cancelled... %o`, results);
          this.emit('downloadcancelled', results);
        } else {
          log(`Download complete... %o`, results);
          this.emit('downloadcomplete', results);
        }
      }, err => this.emit('downloadfailed', { options, err }));
    
    return dlPromise;
  }

  private _formatConfig(input: DownloadConfig): Promise<InternalDownloadConfig> {
    if (!input) {
      log(`No options detected!`);
      return Promise.reject(new Error(`No options detected!`));
    }
    
    if (!input.url) {
      log(`URL failed validation. No URL specified.`);
      return Promise.reject(new Error(`"${input.url}" is not a valid URL!`));
    }

    let output: InternalDownloadConfig = {
      url: input.url,
      dir: null,
      preset: null,
      info: input.info || this._config.info || (() => { }),
      template: this._getTemplate(input.template),
      progress: input.progress,
      mode: input.mode || this._config.mode || DownloadMode.Parallel
    };

    // Resolve the directory...
    let specifiedDir = input.dir || this._config.dir;
    output.dir = specifiedDir ? resolvePath(specifiedDir) : null;

    // Resolve the preset...
    let specifiedPresetName = input.preset || this._config.preset || Presets.HD;
    if(typeof specifiedPresetName !== 'string') {
      output.preset = specifiedPresetName;
    } else {
      let specifiedPreset = this._presets[specifiedPresetName];
      if (!specifiedPreset) {
        log(`No preset "${specifiedPresetName}"!`);
        let err = new Error(`No preset "${specifiedPresetName}"!`);
        this.emit('downloadfailed', { options: input, err });
        throw err;
      }
      output.preset = specifiedPreset;
    }

    return Promise.resolve(output);
  }

  private _registerPresets(presets: Array<Preset>): this {
    if (!presets) return this;

    log(`Registering ${presets.length} presets...`);
    presets.forEach(preset => this._presets[preset.name] = prepPreset(preset));
    
    return this;
  }

  private _getTemplate(localTemplate: string | ((result: any) => string)): (result: VideoResult) => string {
    for (let format of [localTemplate, this._config.template, DEFAULT_TEMPLATE]) {
      if (!format) continue;
      if (typeof format === 'string') {
        return template(format);
      } else {
        let formatFn = format;
        return (data: VideoResult) => formatFn(scrubObject(data));
      }
    }
  }
}