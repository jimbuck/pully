import { test } from 'ava';

import { UsageTracker } from './usage-tracker';

const noop = () => { };

test(`Sends events for video downloads`, t => {
  const tracker = createTracker();
  const videoGuid = tracker.downloadStarted('hd');

  tracker.downloadCompleted(videoGuid, 100);
  tracker.downloadCancelled(videoGuid);
  tracker.downloadFailed(videoGuid, 'Video - Test Exception');
});

test(`Sends events for CLI interaction`, t => {
  const tracker = createTracker();
  
  tracker.settingChanged('test');
  tracker.settingDeleted('test');
  tracker.incorrectParameters();
  tracker.helpCommand();
  tracker.error('CLI - Test Exception');
});

test(`Silently fails`, t => {
  const tracker = new UsageTracker();

  t.notThrows(() => tracker['_sendEvent']('type', 'name', 'label', (visitor) => {
    throw new Error('This is a test exception!');
  }));  
});

function createTracker(): UsageTracker {
  let tracker = new UsageTracker();

  tracker['_sendEvent'] = function (type: string, name: string, label: string, cb?: (visitor: any) => any) {
    cb && cb({ exception: noop, timing: noop });
  };

  return tracker;
}