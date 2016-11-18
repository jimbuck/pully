#!/usr/bin/env node

import { join } from 'path';
const program = require('commander');
const updateNotifier = require('update-notifier');
const chalk = require('chalk');
const logUpdate = require('log-update');

import { DownloadOptions, ProgressData, DownloadResults } from '../';
import { toHumanSize, toHumanTime } from '../utils/human';
import { ProgressBar } from '../utils/progress'; 

const pkg = require(join(__dirname, '../../package.json'));
updateNotifier({ pkg }).notify();

const progressBar: ProgressBar = new ProgressBar();

// Convert -v to -V so version works correctly...
var vPos = process.argv.indexOf('-v')
if (vPos > -1) {
  process.argv[vPos] = '-V'
}

program
  .version(pkg.version)
  .arguments('<url>')
  .description('Downloads a video from the YouTube link.')
  .option('-p, --preset <preset>', 'The preset format to download.', 'hd')
  .option('-d, --dir <dir>', 'The location to save the download.', './')
  .option('-t, --template <template>', 'The format of the the filename, recursively creating missing subfolders.', '${author}/${title}')
  .option('-s, --silent', 'Which setup mode to use')
  .action(function (url: string, options: any) {
    options.url = url;
    
    mergeOptions(options).then(download);
  })
  .parse(process.argv);


// Show help if no other commands match...
if (!program.args.length) {
  program.help();
  process.exit(0);
}



function mergeOptions(options: any): Promise<any> {
  
  const defaultOptions = getDefaultOptions(options);
  const globalOptions = {}; // TODO: Pull from conf instead...

  return Promise.resolve(Object.assign(defaultOptions, globalOptions, options));
}

function download(options: any): Promise<void> {
  return new Pully().download(options).then((result) => {
    progressBar.clear();
    options.silent || console.log(`Download saved to: "${chalk.green(result.path)}"`);
var vPos = process.argv.indexOf('-v')
if (vPos > -1) {
  process.argv[vPos] = '-V'
}    process.exit(0);
  }, err => {
    options.silent || console.error(err);
    process.exit(1);
  });
}

function getDefaultOptions(options: any): DownloadOptions {
  return {
    info: (format, cancel) => {
      console.log(`Downloading "${chalk.cyan(format.info.title)}" by ${chalk.cyan(format.info.author)} (${chalk.blue(toHumanSize(format.info.downloadSize))})...`);
    },
    progress: (data: ProgressData) => {
      if (options.silent) {
        return;
      }

      if (data.indeterminate) {
        // TODO: Show spinner...
        progressBar.tick();
      } else {
        // TODO: Show progress bar...
        progressBar.tick(data.progress);
      }
    }
  } as DownloadOptions;
}

// Mock Pully:
class Pully {
  public download(options: DownloadOptions): Promise<DownloadResults> {
    const maxDelay = 500;

    const totalBytes = 190000 + (Math.floor(Math.random() * 20000));
    const downloadRate = Math.floor(totalBytes / 31);
    let downloadedBytes = 0;
    
    return new Promise((resolve, reject) => {
      let cancelled = false;
      options.info({
        info: {
          title: 'Some Fake Video',
          author: 'Really Cool Person',
          downloadSize: totalBytes
        }
      }, () => cancelled = true);

      if (cancelled) {
        return reject(new Error('CANCELLED'));
      }

      downloadTick();

      function downloadTick() {
        let remainingBytes = totalBytes - downloadedBytes;
        downloadedBytes += Math.min(downloadRate, remainingBytes);

        let progress = downloadedBytes / totalBytes;

        options.progress({
          downloadedBytes,
          totalBytes,
          progress,
          percent: Math.floor((progress * 10000)) / 100
        });

        if (progress >= 1) {
          setTimeout(mergeTick, Math.floor(Math.random() * maxDelay));
        } else {
          setTimeout(downloadTick, Math.floor(Math.random() * maxDelay))
        }
      }

      let mergeCount = 60 + Math.floor(Math.random() * 10);

      function mergeTick() {
        if (mergeCount-- <= 0) {
          return resolve({
            path: '/not/a/real/download.mp4',
            format: null
          } as DownloadResults);
        }

        options.progress({
          indeterminate: true
        });

        setTimeout(mergeTick, Math.floor(Math.random() * maxDelay * 0.1));
      }
    });
  }
}
