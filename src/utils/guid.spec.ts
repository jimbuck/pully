import { test } from 'ava';

import { guid } from './guid';

test(`guid produces a unique string`, t => {
  let guids = new Set<string>();

  for (let i = 0; i < 10000; i++) {
    const id = guid();
    const isDup = guids.has(id);
    guids.add(id);

    t.false(isDup, 'Guid was a duplicate!');
    t.is(id[14], '4'); // UUIDv4
  }
});