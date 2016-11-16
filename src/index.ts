import { parse, Url } from 'url';
import { Readable } from 'stream';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const template = require('lodash.template');

import { Lookup, Preset, PullyConfiguration, DownloadOptions, DownloadResults, MediaInfo, FormatInfo, ProgressData } from './lib/models';
import { Download } from './lib/download';
import { Presets, DefaultPresets } from './lib/presets';

const DEFAULT_TEMPLATE = '${author}/${title}';

export class Pully {

  private _presets: Lookup<Preset> = {};

  constructor(private _config?: PullyConfiguration) {
    this._config = this._config || {};
    this._registerPresets(DefaultPresets)._registerPresets(this._config.additionalPresets);
  }
  
  public download(url: string, preset?: string): Promise<DownloadResults>;
  public download(options: { url?: string, preset?: string, dir?: string, template?: string, verify?: (info: FormatInfo) => boolean | Promise<boolean>, progress?: (data: ProgressData) => void }): Promise<DownloadResults>;
  public download(input: any, preset?: string): Promise<DownloadResults> {
    if (typeof input === 'string') {
      input = {
        url: input,
        preset
      };
    }

    this._validateUrl(input.url);

    let specifiedDir = input.dir || this._config.dir;

    const options: DownloadOptions = {
      url: input.url,
      preset: input.preset || this._config.preset || Presets.HD,
      dir: specifiedDir ? resolve(specifiedDir) : null,
      template: template(input.template || DEFAULT_TEMPLATE),
      verify: input.verify || this._config.verify || (() => true),
      progress: input.progress
    };

    return this._beginDownload(options);
  }

  private _validateUrl(url: string): void {
    // TODO: Check to make sure it is a valid URL...
  }

  private _registerPresets(presets: Array<Preset> | Lookup<Preset>): this {
    if (!presets) {
      return this;
    }

    if (Array.isArray(presets)) {
      presets.forEach(preset => this._presets[preset.name] = preset);
    } else {
      Object.assign(this._presets, presets);
    }

    return this;
  }

  private _beginDownload(options: DownloadOptions): Promise<DownloadResults> {
    let preset = this._presets[options.preset];

    if (!preset) {
      throw new Error(`NO PRESET "${options.preset}"!`);
    }

    return Download.initiate(options, preset);
  }
}

export { PullyConfiguration, Presets, ProgressData };