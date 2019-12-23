import { Pully, Presets } from '.';

const testVideo = 'https://www.youtube.com/watch?v=oVXg7Grp1W8'; // 22s with music (9MB)
//const testVideo = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; // Big Buck Bunny, 10:34 4K (? MB)
const mp3Video = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

(async function () {
  let p = new Pully();

  p.download({
    url: testVideo,
    dir: './output',
    preset: Presets.FourK,
    info: (format, cancel) => {
      console.log('Verify: ' + format.downloadSize);

      // Limit download to ~50MB...
      if (format.downloadSize > 50000000) {
        cancel();
      }
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
})();