const Conf = require('conf');
const ua = require('universal-analytics');

import { guid } from './guid';

const METRICS_DISABLED_KEY = 'config.analytics';
const METRICS_USER_KEY = 'metrics.user';
const config = new Conf();

export class UsageTracker {

  private _visitor: any; 
  
  private _disabled: boolean;

  constructor() {
    this._disabled = config.get(METRICS_DISABLED_KEY);
    let userId = config.get(METRICS_USER_KEY);

    if (!userId) {
      userId = guid();
      config.set(METRICS_USER_KEY, userId);
    }

    if (this._disabled) return;

    // TODO: Grab or create guid to keep track of the same users.
    this._visitor = ua('UA-43395939-3', userId);//.debug();
  }

  public settingChanged(settingName: string): void {
    this._sendEvent('Command', 'settingChanged', settingName);
  }

  public settingDeleted(settingName: string): void {
    this._sendEvent('Command', 'settingDeleted', settingName);
  }

  public downloadStarted(preset: string): string {
    let videoGuid = guid();
    this._sendEvent('Video', 'downloadStarted', videoGuid);
    
    return videoGuid;    
  }

  public downloadCompleted(videoGuid: string, time: number): void {
    this._sendEvent('Video', 'downloadCompleted', videoGuid, visitor => visitor.timing('Video', 'download', time));
  }

  public downloadCancelled(videoGuid: string): void {
    this._sendEvent('Video', 'downloadCancelled', videoGuid);
  }

  public downloadFailed(videoGuid: string, err: any): void {
    this._sendEvent('Video', 'downloadFailed', videoGuid, (visitor) => visitor.exception(err.toString()));
  }

  public helpCommand(): void {
    this._sendEvent('Command', 'showHelp', null);
  }

  public incorrectParameters(): void {
    this._sendEvent('Command', 'incorrectParameters', null);
  }

  public error(err: any): void {
    try {
      if (this._disabled) return;

      this._visitor.exception(err.toString()).send();
    } catch (ex) {
      // Do nothing...
    }
  }

  private _sendEvent(type: string, name: string, label: string, cb?: (visitor: any)=> any): void {
    try {
      if (this._disabled) return;
      
      cb = cb || ((x) => x);

      cb(this._visitor.event(type, name, label)).send();
    } catch (err) {
      // Do nothing...
    }
  }
}