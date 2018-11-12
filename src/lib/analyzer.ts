const ytdl = require('ytdl-core');

import { MediaFormat, Preset, FormatInfo, QueryResult } from './models';
import { createThumbnails } from 'pully-core';
import { prepPreset } from './presets';

const VIDEO_FORMAT = 'video/mp4';
const AUDIO_FORMAT = 'audio/mp4';

export function query(url: string): Promise<QueryResult> {
  return new Promise((resolve, reject) => {
    let now = new Date();
    ytdl.getInfo(url, { downloadUrl: true }, function (err: any, raw: any) {
      if (err) {
        return reject(err);
      }

      const data: QueryResult = {
        raw,
        videoId: raw.video_id,
        videoTitle: raw.title,
        videoUrl: raw.video_url,
        channelId: raw.author.id,
        channelName: raw.author.name,
        channelUrl: raw.author.channel_url,
        thumbnails: createThumbnails(raw.video_id),
        description: raw.description,
        published: new Date(raw.published),
        views: parseInt(raw.view_count, 10),
        lastScanned: now,
        formats: (raw.formats as Array<any>).map<MediaFormat>(rawFormat => {

          return {
            raw: rawFormat,
            audioBitrate: rawFormat.audioBitrate,
            audioEncoding: rawFormat.audioEncoding,
            bitrate: rawFormat.bitrate,
            downloadSize: rawFormat.clen ? parseInt(rawFormat.clen, 10) : null,
            container: rawFormat.container,
            encoding: rawFormat.encoding,
            fps: parseInt(rawFormat.fps || '0', 10),
            itag: rawFormat.itag,
            size: rawFormat.size,
            resolution: parseInt(rawFormat.resolution || '0', 10) || (rawFormat.size && parseInt(rawFormat.size.split('x')[1], 10)) || 0,
            type: rawFormat.type,
            url: rawFormat.url
          };
        })
      };

      return resolve(data);
    });
  });
}

export async function getBestFormats(url: string, preset: Preset): Promise<FormatInfo> {
  let downloadSize = 0;
  let audio: MediaFormat;
  let video: MediaFormat;
  preset = prepPreset(preset);

  const data = await query(url);

  if (preset.videoSort) {
    let matchingVideoFormats = data.formats.filter(_createVideoFilter(preset)).sort(_createVideoCompare(preset));
    if (matchingVideoFormats.length) {
      video = matchingVideoFormats[0];

      video && (downloadSize += video.downloadSize || 0);
    } else {
      return Promise.reject(new Error(`No matching video stream!`));
    }
  }

  if (preset.audioSort) {
    let matchingAudioFormats = data.formats.filter(_createAudioFilter(preset)).sort(_createAudioCompare(preset));
    if (matchingAudioFormats.length) {
      audio = matchingAudioFormats[0];
      audio && (downloadSize += audio.downloadSize || 0);
    } else {
      return Promise.reject(new Error(`No matching audio stream!`));
    }
  }

  return Promise.resolve({ data, audio, video, downloadSize });
}

function _createVideoFilter(preset: Preset) {
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

function _createVideoCompare(preset: Preset): (a: MediaFormat, b: MediaFormat) => number {
  return (a: MediaFormat, b: MediaFormat) => {
    if (preset.videoSort) {
      for (let i = 0; i < preset.videoSort.length; i++) {
        let result = preset.videoSort[i](a, b);

        if (result !== 0) {
          return result;
        }
      }
    }

    return _createAudioCompare(preset)(a, b);
  };
}

function _createAudioFilter(preset: Preset) {
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

function _createAudioCompare(preset: Preset): (a: MediaFormat, b: MediaFormat) => number {
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