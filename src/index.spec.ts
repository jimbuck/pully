import { unlinkSync as deleteFileSync } from 'fs';

import { test, ContextualTest } from 'ava';

import { Pully, Presets } from './index';
import { join } from 'path';

const tempPath = join(__dirname, '../temp');
const testVideo = process.env.PULLY_TEST_VIDEO || 'https://www.youtube.com/watch?v=oVXg7Grp1W8';

// 'https://www.youtube.com/watch?v=oVXg7Grp1W8'; // Short Video
// 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; // Long Video

const downloadedFiles = new Set<string>();

test.after(`Download Cleanup`, t => {
  downloadedFiles.forEach((filePath) => {
    try {
      deleteFileSync(filePath);
      console.log(`('${filePath}' deleted successfully.)`);
    } catch (err) {
      console.warn(err);
    }
  });
});

test(`Pully has predefined presets`, t => {
  let p = new Pully();
  let presets = Object.keys(p['_presets']);

  t.is(presets.length, 8);
  t.true(presets.indexOf('max') >= 0);
  t.true(presets.indexOf('4k') >= 0);
  t.true(presets.indexOf('2k') >= 0);
  t.true(presets.indexOf('hd') >= 0);
  t.true(presets.indexOf('sd') >= 0);
  t.true(presets.indexOf('ld') >= 0);
  t.true(presets.indexOf('hfr') >= 0);
  t.true(presets.indexOf('mp3') >= 0);
});

test(`Pully#download requires a URL`, async (t) => {
  const p = new Pully();

  t.plan(3);

  await t.throws(p.download(null));
  await t.throws(p.download(null, 'hd'));
  await t.throws(p.download({ url: null }));
});

testIf(!!testVideo, `Pully#download defaults to 'hd' preset`, async (t) => {
  const p = new Pully();

  const result = await p.download(testVideo);
  downloadedFiles.add(result.path);
  
  t.is(typeof result.path, 'string');
  t.is(result.format.video.resolution, 1080);
  t.true(result.path.endsWith('.mp4'));
});

testIf(!!testVideo, `Pully#download accepts a template string`, async (t) => {
  const p = new Pully();

  const result = await p.download({
    url: testVideo,
    dir: tempPath,
    template: '${videoId} - ${videoTitle}'
  });
  downloadedFiles.add(result.path);

  t.is(typeof result.path, 'string');
  t.true(result.path.endsWith(`${result.format.data.videoId} - ${result.format.data.videoTitle}.mp4`));
});

testIf(!!testVideo, `Pully#download accepts a template function`, async (t) => {
  const p = new Pully();

  const result = await p.download({
    url: testVideo,
    dir: tempPath,
    template: result => `${result.channelName} - ${result.videoId}`
  });
  downloadedFiles.add(result.path);

  t.is(typeof result.path, 'string');
  t.true(result.path.endsWith(`${result.format.data.channelName} - ${result.format.data.videoId}.mp4`));
});

testIf(!!testVideo, `Pully#download accepts preset strings`, async (t) => {
  const p = new Pully();

  const result = await p.download(testVideo, 'mp3');
  downloadedFiles.add(result.path);
  
  t.is(typeof result.path, 'string');
  t.falsy(result.format.video);
  t.true(result.path.endsWith('.mp3'));
});

testIf(!!testVideo, `Pully#download accepts options hash`, async (t) => {
  const p = new Pully();

  const result = await p.download({
    url: testVideo,
    preset: Presets.MP3,
  });
  downloadedFiles.add(result.path);
  
  t.is(typeof result.path, 'string');
  t.falsy(result.format.video);
  t.true(result.path.endsWith('.mp3'));
});

function testIf(condition: boolean, title: string, func: ContextualTest): void {
  if(condition){
    test(title, func);
  } else {
    test.skip(title, func);
  }
}