import { unlinkSync } from 'fs';

import { test, ContextualTest } from 'ava';

import { Pully, Presets, DownloadOptions, DownloadResults } from './index';


const testVideo = process.env.PULLY_TEST_VIDEO;

//const shortVideo = 'https://www.youtube.com/watch?v=HQCZRm8QlPE';
//const longVideo = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

const downloadedFiles = new Set<string>();

test.after(`Download Cleanup`, t => {
  downloadedFiles.forEach((value) => {
    try {
      unlinkSync(value);
      //console.log(`("${value} deleted successfully.)"`)
    } catch (err) {
      console.warn(err);
    }
  });
});

test(`Pully has predefined presets`, t => {
  let p = new Pully();
  let presets = Object.keys(p['_presets']);

  t.is(presets.length, 6);
  t.true(presets.indexOf('max') >= 0);
  t.true(presets.indexOf('4k') >= 0);
  t.true(presets.indexOf('2k') >= 0);
  t.true(presets.indexOf('hd') >= 0);
  t.true(presets.indexOf('hfr') >= 0);
  t.true(presets.indexOf('mp3') >= 0);
});

test(`Pully#download requires a URL`, async (t) => {
  const p = new Pully();

  t.throws(p.download(null));
  t.throws(p.download(null, 'hd'));
  t.throws(p.download({ url: null }));
});

testIf(testVideo, `Pully#download defaults to 'hd' preset`, async (t) => {
  const p = new Pully();

  const result = await p.download(testVideo);
  downloadedFiles.add(result.path);
  
  t.is(typeof result.path, 'string');
  t.is(result.format.video.resolution, 1080);
  t.true(result.path.endsWith('.mp4'));
});

testIf(testVideo, `Pully#download accepts preset strings`, async (t) => {
  const p = new Pully();

  const result = await p.download(testVideo, 'mp3');
  downloadedFiles.add(result.path);
  
  t.is(typeof result.path, 'string');
  t.falsy(result.format.video);
  t.true(result.path.endsWith('.mp3'));
});

testIf(testVideo, `Pully#download accepts options hash`, async (t) => {
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