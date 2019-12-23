import test from 'ava';

import { toHumanSize, fromHumanSize, toHumanTime } from './human';

test(`toHumanSize converts bytes to strings`, t => {
  [
    { num: 0, size: '0B' },
    { num: 1, size: '1B' },
    { num: 10, size: '10B' },
    { num: 5000, size: '5KB' },
    { num: 61000, size: '60KB' },
    { num: 64000000, size: '61MB' },
    { num: 360000000, size: '343MB' },
    { num: 1800000000, size: '2GB' },
  ].forEach(({num, size}) => {
    t.is(toHumanSize(num), size);
  });
});

test(`fromHumanSize converts strings to bytes`, t => {
  [
    { size: null, num: null },
    { size: '', num: null },
    { size: '0B', num: 0 },
    { size: '1B', num: 1 },
    { size: '10B', num: 10 },
    { size: '5KB', num: 5120 },
    { size: '60KB', num: 61440 },
    { size: '61MB', num: 63963136 },
    { size: '343MB', num: 359661568 },
    { size: '2GB', num: 2147483648 },
  ].forEach(({size, num}) => {
    t.is(fromHumanSize(size), num);
  });
});

test(`toHumanTime converts seconds to strings`, t => {
  [
    { num: Number.NaN, size: '' },
    { num: null, size: '' },
    { num: 0, size: '0:00' },
    { num: 1, size: '0:01' },
    { num: 10, size: '0:10' },
    { num: 60, size: '1:00' },
    { num: 121, size: '2:01' },
    { num: 3600, size: '1:00:00' },
    { num: 3601, size: '1:00:01' },
    { num: 3662, size: '1:01:02' },
  ].forEach(({num, size}) => {
    t.is(toHumanTime(num), size);
  });
});