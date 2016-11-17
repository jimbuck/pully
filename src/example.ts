import { Pully, Presets } from './index';

//const testVideo = 'https://www.youtube.com/watch?v=HQCZRm8QlPE'; // 22s with music (9MB)
const testVideo = 'https://www.youtube.com/watch?v=2PuFyjAs7JA';   // 11s with silence (2.5MB)

let p = new Pully();

p.download({
  url: testVideo,
  dir: './output',
  template: '${author} -__- ${title}',
  preset: Presets.HD,
  verify: (format) => {
    console.log('Verify: ' + format.info.downloadSize);

    // Limit download to ~3MB...    
    return format.info.downloadSize < 3000000;
  },
  progress: (data) => {
    if (data.indeterminate) {
      console.log(`[${new Date().toUTCString()}] Working...`);
    } else {
      console.log(`Progress: ${data.percent}%`);
    }
  }
}).then((results) => {
  console.log(`Download Complete: "${results.path}"`);
  process.exit(0);
}, err => {
  console.error('Uh oh!', err);
  process.exit(1);
});