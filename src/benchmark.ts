import { unlinkSync as deleteFile } from 'fs';

import { Suite, Options as BenchmarkOptions, formatNumber } from 'benchmark';
import { Pully, Presets, DownloadMode } from '.';

const extraSmallVideo = 'https://www.youtube.com/watch?v=oVXg7Grp1W8'; // 22s with music (9MB)
const mediumVideo = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; // Big Buck Bunny, 10:34 4K (? MB)

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
  .run({ async: false });

function downloadModeBenchmarkFor(mode: DownloadMode): BenchmarkOptions {
  let pully: Pully;
  let downloadPath: string;
  return {
    name: mode,
    defer: true,
    setup: () => {
      pully = new Pully({
        dir: './temp',
        preset: Presets.HD,
        mode
      });
    },
    fn: async function (p: BenchResolver) {
      
      const result = await pully.download(extraSmallVideo);
      downloadPath = result.path;
      downloadSize = result.format.downloadSize;

      p.resolve();
    },
    teardown: () => {
      deleteFile(downloadPath);
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