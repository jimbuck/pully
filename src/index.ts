import { parse, Url } from 'url';
import { Readable } from 'stream';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';

import { PullyOptions, DownloadOptions, DownloadResults, MediaInfo, FormatInfo, ProgressData } from './lib/models';
import { Context } from './lib/context';
import { Presets } from './lib/presets';

export class Pully {

  private _ctx: Context;

  constructor(private _options?: PullyOptions) {
    this._options = this._options || {};
    this._ctx = new Context(this._options.presets);
  }
  
  public download(url: string, preset?: string): Promise<DownloadResults>;
  public download(options: DownloadOptions): Promise<DownloadResults>;
  public download(options: string|DownloadOptions, preset?: string): Promise<DownloadResults> {
    if (typeof options === 'string') {
      options = {
        url: options,
        preset
      } as DownloadOptions;
    }

    this._validateUrl(options.url);

    options.preset = options.preset || this._options.defaultPreset || Presets.HD;

    return this._ctx.fetch(options);
  }

  private _validateUrl(url: string): void {
    // TODO: Check to make sure it is a valid URL...
  }
}

export { PullyOptions, Presets, ProgressData };