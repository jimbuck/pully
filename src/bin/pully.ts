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
let progressBar: ProgressBar<ProgressData>;

swapArgs('-v', '-V'); // Convert -v to -V so version works correctly...
swapArgs('/?', '-h'); // Convert /? to also show help info...

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
      .then((result: DownloadResults) => {
        options.silent || logUpdate(`${chalk.magenta(result.format.info.title)} saved as
  ${chalk.green(result.path)} [${toHumanTime(result.duration / 1000)}]`);
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
    console.log(configStore());
    return process.exit(0);
  });

program
  .command('delete <key>').alias(['del'])
  .description('Deletes a value in the global config.')
  .action((key: string) => {
    configStoreDelete(key);
    console.log(configStore());
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

function configStoreDelete(key: string): void {
  config.delete(`config.${key}`);
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
        return cancel(`Download cancelled: ${toHumanSize(format.info.downloadSize)} download exceeds the ${options.limit} limit!`);
      }

      progressBar = new ProgressBar<ProgressData>({
        width: 60,
        template: (el) => {
          const title = chalk.magenta(format.info.title);
          const author = chalk.magenta(format.info.author);
          const downloadSize = chalk.cyan(toHumanSize(format.info.downloadSize));
          const elapsed = chalk.yellow(el.elapsed);
          const percent = el.data.percent ? chalk.green((el.data.percent || 100).toFixed(1) + '%') : '';
          const eta = el.eta ? chalk.yellow(el.eta) : '';
          const speed = el.speed ? ('(' + chalk.cyan(toHumanSize(el.speed * el.data.downloadedBytes) + '/s') + ')') : '';

          return `Downloading ${title} by ${author} (${downloadSize})
  ${elapsed} ${percent} ${el.bar} ${eta} ${speed}`;
         }
       });
    },
    progress: (data: ProgressData) => {
      if (options.silent) {
        return;
      }

      if (data.indeterminate) {
        progressBar.tick(null, data);
      } else {
        progressBar.tick(data.progress, data);
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