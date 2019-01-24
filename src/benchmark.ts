import { resolve as resolvePath } from 'path';
import { unlinkSync as deleteFile, createWriteStream } from 'fs';

import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'fluent-ffmpeg';
const deleteDir: ((path: string) => void) = require('rimraf').sync;

import { Suite, Options as BenchmarkOptions, formatNumber } from 'benchmark';
import { Pully, Presets, DownloadMode } from '.';

const extraSmallVideo = 'https://www.youtube.com/watch?v=oVXg7Grp1W8'; // 22s with music (9MB)
const smallVideo = 'https://www.youtube.com/watch?v=LXb3EKWsInQ'; // Costa Rica 4K, 5:14 (169MB)
const longVideo = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; // Big Buck Bunny, 10:34 4K (281 MB)

const videoToDownload = smallVideo;

type BenchResolver = { resolve(): void };
let downloadSize = 0;

const modeSuite = new Suite('Download Mode');

modeSuite.on('cycle', function (event: Event) {
  let bm = event.target as any;
  let opsPerMin = formatOpsSpeed(bm);
  let downloadSpeed = formatDownloadSpeed(bm);
  let size = bm.stats.sample.length;

  console.log(`${bm.name}: [${downloadSpeed}] ${opsPerMin} \xb1${bm.stats.rme.toFixed(2)}% (${size} run${size == 1 ? '' : 's'} sampled)`);
});

modeSuite
  .add(downloadModeBenchmarkFor(DownloadMode.Merge))
  .add(downloadModeBenchmarkFor(DownloadMode.Sequential))
  .add(downloadModeBenchmarkFor(DownloadMode.Parallel))
  .add(ytldCorBenchmark())
  .run({ async: false });

function downloadModeBenchmarkFor(mode: DownloadMode): BenchmarkOptions {
  let pully: Pully;
  let i = 0;
  let downloadPath: string;

  deleteDir(resolvePath(__dirname, `../temp/${mode}/*`));

  return {
    name: mode,
    defer: true,
    setup: () => {
      pully = new Pully({
        dir: `./temp/${mode}`,
        preset: Presets.HD,
        template: `output_${i++}`,
        mode
      });
    },
    fn: async function (p: BenchResolver) {
      const result = await pully.download(videoToDownload);
      downloadPath = result.path;
      downloadSize = result.format.downloadSize;

      p.resolve();
    },
    teardown: () => {
      //deleteFile(downloadPath);
    }
  }
}

function ytldCorBenchmark() {
  const audioOutput = resolvePath(__dirname, '../temp/ytdl-core/sound.mp4');
  let i = 0;

  deleteDir(resolvePath(__dirname, `../temp/ytdl-core/*`));

  return {
    name: 'ytdl-core',
    defer: true,
    setup: () => {
      
    },
    fn: async function (p: BenchResolver) {
      const mainOutput = resolvePath(__dirname, `../temp/ytdl-core/output_${i++}.mp4`);

      ytdl(videoToDownload, { filter: format => format.itag === '140' })
        // Write audio to file since ffmpeg supports only one input stream.
        .pipe(createWriteStream(audioOutput))
        .on('finish', () => {
          ffmpeg()
            .input(ytdl(videoToDownload, { filter: format => format.itag === '299' }))
            .videoCodec('copy')
            .input(audioOutput)
            .audioCodec('copy')
            .save(mainOutput)
            .on('error', console.error)
            // .on('progress', progress => {
            //   process.stdout.write(progress.timemark);
            // })
            .on('end', () => {
              deleteFile(audioOutput);
              p.resolve();
            });
        });
    },
    teardown: () => {
      //deleteFile(mainOutput);
    }
  }
}

function formatDownloadSpeed(bm: any) {
  let bytesPerSecond = downloadSize / bm.stats.mean;
  let humanReadableSpeed = humanByteSize(bytesPerSecond);
  
  return `${humanReadableSpeed}/sec`;
}

function formatOpsSpeed(bm: any) {
  let speed = bm.hz;
  let unit = 'sec';

  if (speed < 1) {
    speed *= 60;
    unit = 'min';
  }

  if (speed < 1) {
    speed *= 60;
    unit = 'hour';
  }

  return `${formatNumber((speed).toFixed(2) as any)} ops/${unit}`;
}

function humanByteSize(bytes: number) {
  const threshold = 1024;
  if (Math.abs(bytes) < threshold) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  do {
    bytes /= threshold;
    ++u;
  } while (Math.abs(bytes) >= threshold && u < units.length - 1);
  return `${bytes.toFixed(1)} ${units[u]}`;
}