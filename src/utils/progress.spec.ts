import { test } from 'ava';
const chalk = require('chalk');
let logUpdate = require('log-update');

import { ProgressBar, ProgressBarOptions } from './progress';

test(`ProgressBar does not require parameters`, t => {
  let p: ProgressBar<void>;
  t.notThrows(() => p = new ProgressBar<void>());
  t.is(p['_progress'], 0);
  t.is(p['_width'], 40);
  t.is(p['_completeChar'], chalk.green('█'));
  t.is(p['_incompleteChar'], chalk.gray('█'));
  t.is(p['_indeterminateBar'].length, p['_width']);

  p = new ProgressBar<void>({
    complete: 'Y',
    incomplete: 'N',
    width: 12
  });

  t.is(p['_width'], 12);
  t.is(p['_completeChar'], 'Y');
  t.is(p['_incompleteChar'], 'N');
  t.is(p['_indeterminateBar'].length, p['_width']);

});

test(`ProgressBar#tick with progress updates the values`, t => {
  const progress = 0.65;
  const p = createProgressBar();
  t.is(p['_progress'], 0);
  p.tick(progress);
  t.is(p['_progress'], progress);
  p.tick(1);
  t.is(p['_progress'], 1);
});

test(`ProgressBar#tick without progress shifts the indeterminate bar`, t => {
  const progress = 0.65;
  const p = createProgressBar({
    width: 16,
    incomplete: '_',
    complete: '#'
  });
  let expectedBar = '#####___________';
  t.is(p['_indeterminateBar'].join(''), expectedBar);
  for (let i = 0; i < 45; i++) {
    p.tick();
    expectedBar = expectedBar[expectedBar.length - 1] + expectedBar.slice(0, -1);
    t.is(p['_indeterminateBar'].join(''), expectedBar);
  }
});

function createProgressBar(options?: ProgressBarOptions<void>) {
  const p = new ProgressBar(options);

  p.log = function () { };
  p.clear = function () { };
  p.done = function () { };

  return p;
}
