const ytdl = require('ytdl-core');

import { MediaFormat, Preset, MediaInfo, FormatInfo } from './models';

const VIDEO_FORMAT = 'video/mp4';
const AUDIO_FORMAT = 'audio/mp4';

export class Analyzer {

  public getRequiredFormats(url: string, preset: Preset): Promise<FormatInfo> {
    return this._getMediaInfo(url)
      .then(info => this._determineBestFormats(info, preset));
  }

  private _getMediaInfo(url: string): Promise<MediaInfo> {
    return new Promise((resolve, reject) => {
      ytdl.getInfo(url, { downloadUrl: true }, function (err: any, info: any) {
        if (err) {
          return reject(err);
        }

        return resolve(new MediaInfo(info));
      });
    });
  }

  private _determineBestFormats(info: MediaInfo, preset: Preset): FormatInfo {
    
      let audio: MediaFormat;
      let video: MediaFormat;

      if (preset.video) {
          let matchingVideoFormats = info.formats.filter(this._createVideoFilter(preset)).sort(this._createVideoCompare(preset));
          if (matchingVideoFormats.length) {
              video = matchingVideoFormats[0];

              video && (info.downloadSize += video.downloadSize || 0);
          }
      }

      let matchingAudioFormats = info.formats.filter(this._createAudioFilter(preset)).sort(this._createAudioCompare(preset));
      if (matchingAudioFormats.length) {
          audio = matchingAudioFormats[0];
          audio && (info.downloadSize += audio.downloadSize || 0);
      } 

      return { info, audio, video };
  }

  private _createVideoFilter(preset: Preset) {
    return (format: MediaFormat) => {

      if (!format.type || !format.type.includes(VIDEO_FORMAT)) {
        return false;
      }

      if (preset.videoFilters) {
          for (let i = 0; i < preset.videoFilters.length; i++) {
              let filter = preset.videoFilters[i];

              if (!filter(format, preset)) {
                  return false;
              }
          }  
      }

      return true;
    };
  }

  private _createVideoCompare(preset: Preset): (a: MediaFormat, b: MediaFormat) => number {
    return (a: MediaFormat, b: MediaFormat) => {
        if (preset.videoSort) {
            for (let i = 0; i < preset.videoSort.length; i++) {
                let result = preset.videoSort[i](a, b);

                if (result !== 0) {
                    return result;
                }
            }
        }

      return this._createAudioCompare(preset)(a, b);
    };
  }

  private _createAudioFilter(preset: Preset) {
    return (format: MediaFormat) => {

      if (!format.type || !format.type.includes(AUDIO_FORMAT)) {
        return false;
      }

      if (preset.audioFilters) {
          for (let i = 0; i < preset.audioFilters.length; i++) {
              let result = preset.audioFilters[i](format, preset);

              if (!result) {
                  return false;
              }
          }  
      }

      return true;
    };
  }

  private _createAudioCompare(preset: Preset): (a: MediaFormat, b: MediaFormat) => number {
    return (a: MediaFormat, b: MediaFormat) => {
        if (preset.audioSort) {
            for (let i = 0; i < preset.audioSort.length; i++) {
                let result = preset.audioSort[i](a, b);

                if (result !== 0) {
                    return result;
                }
            }  
      }

      return 0;
    };
  }
}