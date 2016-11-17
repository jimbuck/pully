#!/usr/bin/env node

import { join } from 'path';
const program = require('commander');
const updateNotifier = require('update-notifier');

import { Pully, DownloadOptions, ProgressData } from '../';

const pkg  = require(join(__dirname, '../../package.json'));

updateNotifier({pkg}).notify();

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
}

function mergeOptions(options: any): Promise<any> {
  
  const defaultOptions = getDefaultOptions(options);
  const globalOptions = {}; // TODO: Pull from conf instead...

  return Promise.resolve(Object.assign(defaultOptions, globalOptions, options));
}

function download(options: any): Promise<void> {
  return new Pully().download(options).then((result) => {
    options.silent || console.log(`Download saved to: "${result.path}"`);
var vPos = process.argv.indexOf('-v')
if (vPos > -1) {
  process.argv[vPos] = '-V'
}    process.exit(0);
  }, err => {
    options.silent || console.error(err);
    process.exit(1);
  });
}

function getDefaultOptions(options: any) {
  return {
    progress: (data: ProgressData) => {
      if (options.silent) {
        return;
      }

      if (data.indeterminate) {
        // TODO: Show spinner...
        console.log(`[${new Date().toUTCString()}] Working...`);
      } else {
        // TODO: Show progress bar...
        console.log(`Progress: ${data.percent}%`);
      }
    }
  };
}
