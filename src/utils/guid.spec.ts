import { test } from 'ava';

import { guid } from './guid';

test(`guid produces a unique string`, t => {
  let guids = new Set<string>();

  for (let i = 0; i < 10000; i++) {
    t.false(guids.has(guid()));
  }
});