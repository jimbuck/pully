import { createWriteStream, unlinkSync } from 'fs';
import { Readable } from 'stream';

import { Pully, Presets, ProgressData } from './index';

const filename = './test.mp4';
const testVideo = 'https://www.youtube.com/watch?v=HQCZRm8QlPE'; // 22s with Audio (9MB)
//const testVideo = 'https://www.youtube.com/watch?v=2PuFyjAs7JA';   // 11s no audio (2.5MB)

let p = new Pully();

try {
  unlinkSync(filename);
} catch (err) {
  // Do nothing...
}

p.download({
  url: testVideo,
  dir: './videos',
  template: '{{author}}/NEW--{{title}}',
  preset: Presets.HD,
  // verify: (format) => {
  //   console.log('Verify: ' + format.info.downloadSize);

  //   return format.info.downloadSize < 200000;
  // },
  progress: (data) => console.log(`Progress: ${data.percent}%`)
}).then((results) => {
  console.log(`Complete! ${results.path}`);
  process.exit(0);
});

function pipeToWriteStream(reader: Readable, path: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      reader
      .pipe(createWriteStream(path))
      .on('error', reject)
      .on('finish', resolve);
    } catch (err) {
      reject(err);
    }
  });
}