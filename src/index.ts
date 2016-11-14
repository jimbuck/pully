import { parse, Url } from 'url';
import { Readable } from 'stream';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';

import { Options, Configuration } from './lib/models';
import { Context } from './lib/context';
import { Presets } from './lib/presets';

export class Pully {

  private _ctx: Context;

  constructor(options?: Options) {
    this._ctx = new Context((options || {}).presets);
  }
  
  public download(url: string, preset: string = Presets.HD): EventEmitter {
    const parsedUrl = this._parseUrl(url);

    return this._ctx.fetch(parsedUrl, preset);
  }

  private _parseUrl(url: string): Url {
    // TODO: Check if it is a YT URL.
    if (!url) {
      throw new Error(`A url must be specified!`);
    }

    return parse(url, true, true);
  }
}

export { Options, Presets };