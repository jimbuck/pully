import { test } from 'ava';

import {Pully, DownloadOptions, DownloadResults } from './index';

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