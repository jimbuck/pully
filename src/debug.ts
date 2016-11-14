import { createWriteStream, unlinkSync } from 'fs';
import { Readable } from 'stream';

import { Pully, Presets } from './index';

const filename = './test.mp4';
const testVideo = 'https://www.youtube.com/watch?v=2PuFyjAs7JA';

let p = new Pully();

try {
  unlinkSync(filename);
} catch (err) {
  // Do nothing...
}

p.download(testVideo)
  .on('info', (info: any) => {
    console.log('Info!');
    console.log(Object.assign({}, info, { formats: [] }));
  })
  .on('progress', (progress: number) => {
    console.log('Progress! ' + Math.floor(progress * 10000) / 100);
  })
  .on('complete', (stream: Readable) => {
    console.log('Ready!');
    stream
      .pipe(createWriteStream(filename))
      .on('finish', () => {
        console.log('Done!');
      });
  })
  .on('error', (err: any) => {
    console.error(err);
  });