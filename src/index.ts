import { resolve as resolvePath } from 'path';

import * as debug from 'debug';
const lodashTemplate: ((format: string) => ((data: any) => string)) = require('lodash.template');

import { Preset, PullyOptions, DownloadConfig, DownloadResults, ProgressData, QueryResult, FilenameTemplate, DownloadOptions, TemplateFunction } from './lib/models';
import { Download } from './lib/download';
import { Presets, DefaultPresets } from './lib/presets';
import { query } from './lib/analyzer';

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

  private _registerPresets(presets: Array<Preset> | { [key: string]: Preset }): this {
    if (!presets) {
      return this;
    }

    if (Array.isArray(presets)) {
      log(`Registering ${presets.length} presets...`);
      presets.forEach(preset => this._presets[preset.name] = preset);
    } else {
      log(`Registering ${Object.keys(presets).length} presets...`);
      Object.assign(this._presets, presets);
    }

    return this;
  }

  private _beginDownload(config: DownloadConfig): Promise<DownloadResults> {
    if (!config.preset) {
      log(`No preset "${config.preset}"!`);
      throw new Error(`No preset "${config.preset}"!`);
    }
    
    return new Download(config).start();
  }

  private _getTemplate(localTemplate: FilenameTemplate): TemplateFunction {
    for (let template of [localTemplate, this._config.template, DEFAULT_TEMPLATE]) {
      if (!template) continue;
      if (typeof template === 'function') return template;
      return lodashTemplate(template);
    }
  }
}