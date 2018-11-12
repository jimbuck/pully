import { resolve as resolvePath } from 'path';

import * as debug from 'debug';
import { template, query, scrubObject, VideoResult, QueryResult } from 'pully-core';

import { Preset, PullyOptions, DownloadConfig, DownloadResults, ProgressData, DownloadOptions } from './lib/models';
import { Download } from './lib/download';
import { Presets, DefaultPresets, prepPreset } from './lib/presets';

const DEFAULT_TEMPLATE = '${videoTitle}__${channelName}';

const log = debug('pully:index');

export { PullyOptions, DownloadOptions, Presets, ProgressData, DownloadResults };

export class Pully {

  private _presets: {[key: string]: Preset} = {};

  constructor(private _config?: PullyOptions) {
    this._config = this._config || {};
    this._registerPresets(DefaultPresets)._registerPresets(this._config.additionalPresets);
  }
  
  public async query(url: string): Promise<QueryResult> {
    return await query(url);
  }
  
  public async download(url: string, preset?: string): Promise<DownloadResults>;
  public async download(options: DownloadOptions): Promise<DownloadResults>;
  public async download(input: string | DownloadOptions, preset?: string): Promise<DownloadResults> {
    let start = Date.now();
    if (typeof input === 'string') {
      input = {
        url: input,
        preset
      };
    }

    log(`Download initated...`);

    input = await this._validateOptions(input);

    let specifiedDir = input.dir || this._config.dir;

    const options: DownloadConfig = {
      url: input.url,
      preset: this._presets[input.preset || this._config.preset || Presets.HD],
      dir: specifiedDir ? resolvePath(specifiedDir) : null,
      template: this._getTemplate(input.template),
      info: input.info || this._config.verify || (() => { }),
      progress: input.progress
    };

    const results = await this._beginDownload(options);

    results.duration = (Date.now() - start);

    log(`Download complete... %o`, results);
    return results;
  }

  private _validateOptions(input: DownloadOptions): Promise<DownloadOptions> {
    if (!input) {
      log(`No options detected!`);
      return Promise.reject(new Error(`No options detected!`));
    }
    
    if (!input.url) {
      log(`URL failed validation. No URL specified.`);
      return Promise.reject(new Error(`"${input.url}" is not a valid URL!`));
    }

    return Promise.resolve(input);
  }

  private _registerPresets(presets: Array<Preset>): this {
    if (!presets) return this;

    log(`Registering ${presets.length} presets...`);
    presets.forEach(preset => this._presets[preset.name] = prepPreset(preset));
    
    return this;
  }

  private _beginDownload(config: DownloadConfig): Promise<DownloadResults> {
    if (!config.preset) {
      log(`No preset "${config.preset}"!`);
      throw new Error(`No preset "${config.preset}"!`);
    }
    
    return new Download(config).start();
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