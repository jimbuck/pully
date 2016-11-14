import { EventEmitter } from 'events';
import { Url } from 'url';

import { Lookup, Preset, MediaFormat } from './models';
import { DefaultPresets } from './presets';
import { Download } from './download';

export class Context {
  
  private _presets: Lookup<Preset> = {};

  constructor(presets: Array<Preset>|Lookup<Preset>) {
    this.register(DefaultPresets).register(presets);
  }

  public register(presets: Array<Preset> | Lookup<Preset>): this {
    if (!presets) {
      return this;
    }

    if(Array.isArray(presets)){
      presets.forEach(preset => this._presets[preset.name] = preset);
    } else {
      Object.assign(this._presets, presets);
    }
    
    return this;
  }

  public fetch(url: Url, presetName: string): EventEmitter {
    let preset = this._presets[presetName];

    if (!presetName) {
      throw new Error(`No preset matches "${presetName}"!`);
    }

    return new Download(url, preset);
  }
}