#!/usr/bin/env node

import { join } from 'path';
const program = require('commander');
const updateNotifier = require('update-notifier');
const chalk = require('chalk');
const logUpdate = require('log-update');
const Conf = require('conf');

import { Pully, DownloadOptions, ProgressData, DownloadResults } from '../';
import { toHumanTime, toHumanSize, fromHumanSize } from '../utils/human';
import { ProgressBar } from '../utils/progress'; 

const pkg = require(join(__dirname, '../../package.json'));
updateNotifier({ pkg }).notify();

const config = new Conf();
let progressBar: ProgressBar;

// Convert -v to -V so version works correctly...
swapArgs('-v', '-V');
swapArgs('/?', '-h');

program
  .command('download <url>').alias('dl')
  .description('Downloads a video from the YouTube link.')
  .option('-p, --preset <preset>', 'The preset format to download.')
  .option('-d, --dir <dir>', 'The location to save the download.')
  .option('-t, --template <template>', 'The format of the the filename, recursively creating missing subfolders.')
  .option('-l, --limit <size>', 'The maximum filesize to download.')
  .option('-s, --silent', 'Hides all output.')
  .action(function (url: string, options: any) {
    options.url = url;
    
    return mergeOptions(options)
      .then((options => {
        return new Pully().download(options);
      }))
      .then((result) => {
        options.silent || logUpdate(`${chalk.magenta(result.format.info.title)} saved as
  ${chalk.green(result.path)}`);
        process.exit(0);
      }, err => {
        if (!options.silent) {
          try {
            logUpdate(chalk.red(err.toString()));
          } catch (ex) {
            logUpdate.clear();
            console.error(err);
          }
        }

        process.exit(1);
      });
  });

program
  .command('get [key]')
  .description('Gets the global config values or the config value if the key is specified.')
  .action((key: string) => {
    console.log(configStore(key));
    return process.exit(0);
  });

program
  .command('set <key> <value>')
  .description('Sets a value in the global config. The values will be used when downloading.')
  .action((key: string, value: any) => {
    configStore(key, value);
    return process.exit(0);
  });

program
  .version(pkg.version)  
  .parse(process.argv);


// Show help if no arguments were specified...
if (!program.args.length) {
  program.help();
  process.exit(0);
}

function configStore(key?: string, value?: any): any {
  if (!key) {
    return config.get('config');
  } else {
    if (typeof value === 'undefined') {
      return config.get(`config.${key}`);
    } else {
      return config.set(`config.${key}`, value);
    }
  }
}

function mergeOptions(options: any): Promise<any> {
  
  const defaultOptions = getDefaultOptions(options);
  const globalOptions = configStore();

  return Promise.resolve(Object.assign(defaultOptions, globalOptions, options));
}


function getDefaultOptions(options: any): DownloadOptions {
  return {
    preset: 'hd',
    dir: '.',
    template: '${author}/${title}',
    info: (format, cancel) => {
      let sizeLimit = fromHumanSize(options.limit);
      let approxSize = fromHumanSize(toHumanSize(format.info.downloadSize));
      if (options.limit && approxSize > sizeLimit) {
        return cancel(`Download cancelled: size of ${toHumanSize(format.info.downloadSize)} is greater than ${options.limit} limit!`);
      }

      progressBar = new ProgressBar({
        template: (bar, eta) => {
          return `Downloading ${chalk.magenta(format.info.title)} by ${chalk.magenta(format.info.author)} (${chalk.cyan(toHumanSize(format.info.downloadSize))})
  ${bar} ${chalk.yellow(eta)}`;
         }
       });
    },
    progress: (data: ProgressData) => {
      if (options.silent) {
        return;
      }

      if (data.indeterminate) {
        progressBar.tick();
      } else {
        progressBar.tick(data.progress);
      }
    }
  } as DownloadOptions;
}

function swapArgs(origArg: string, newArg: string): void {
  var index = process.argv.indexOf(origArg)
  if (index > -1) {
    process.argv[index] = newArg;
  }
}

// Mock Pully:
// class Pully {
//   public download(options: DownloadOptions): Promise<DownloadResults> {
//     const maxDelay = 500;

//     const totalBytes = 190000 + (Math.floor(Math.random() * 20000));
//     const downloadRate = Math.floor(totalBytes / 31);
//     let downloadedBytes = 0;

//     const format = {
//       info: {
//         title: 'Some Fake Video',
//         author: 'Really Cool Person',
//         downloadSize: totalBytes
//       }
//     };
    
//     return new Promise((resolve, reject) => {
//       let cancelled = false;
//       options.info(format, () => cancelled = true);

//       if (cancelled) {
//         return reject(new Error('CANCELLED'));
//       }

//       downloadTick();

//       function downloadTick() {
//         let remainingBytes = totalBytes - downloadedBytes;
//         downloadedBytes += Math.min(downloadRate, remainingBytes);

//         let progress = downloadedBytes / totalBytes;

//         options.progress({
//           downloadedBytes,
//           totalBytes,
//           progress,
//           percent: Math.floor((progress * 10000)) / 100
//         });

//         if (progress >= 1) {
//           setTimeout(mergeTick, Math.floor(Math.random() * maxDelay));
//         } else {
//           setTimeout(downloadTick, Math.floor(Math.random() * maxDelay))
//         }
//       }

//       let mergeCount = 100 + Math.floor(Math.random() * 50);

//       function mergeTick() {
//         if (mergeCount-- <= 0) {
//           return resolve({
//             path: '/not/a/real/download.mp4',
//             format
//           } as DownloadResults);
//         }

//         options.progress({ indeterminate: true });

//         setTimeout(mergeTick, Math.floor(Math.random() * maxDelay/5));
//       }
//     });
//   }
// }