import { test } from 'ava';

import { scrubString, scrubObject } from './scrub';

test(`scrubString removes invalid characters`, t => {
  const expectedStr = 'this.$$$-is(S)[A]{F}E';
  const actualStr = scrubString('this.$*$*$-is\\/(S)[A]{F}|E|');
  t.is(actualStr, expectedStr);
});

test(`scrubObject removes invalid characters from each property`, t => {
  interface Thingy {
    a: string,
    b: number,
    c: string
  }

  const origObject: Thingy = {
    a: '$(*@#$#@$)(*)',
    b: 2,
    c: 'lkjasfd*^%@#$(*jfsl)'
  };
  const expectedObj: Thingy = {
    a: '$(@#$#@$)()',
    b: 2,
    c: 'lkjasfd^%@#$(jfsl)'
  };

  const actualObj: Thingy = scrubObject(origObject);

  t.is(actualObj.a, expectedObj.a);
  t.is(actualObj.b, expectedObj.b);
  t.is(actualObj.c, expectedObj.c);
});