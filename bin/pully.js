#!/usr/bin/env node
'use strict';

const validator = require('validator');
const chalk = require('chalk');

const pully = require('../index');
const PresetManager = require('../lib/preset-manager');
const ERROR_CODES = require('../data/error-codes');

// Test URL: https://www.youtube.com/watch?v=ZVOmv_vMIbA

// TODO: Switch to Meow...

const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
 
updateNotifier({pkg}).notify();

let options = parseArgs(process.argv);

pully(options, function (err, info, videoPath) {

  if (err) {
    console.error(chalk.red.bold(err.message));
    process.exit(err.code);
  } else {
    console.log('Download complete for "' + chalk.yellow.bold(info.title) + '"! (' + chalk.grey.bold(videoPath) + ')');
  }

  console.log('');
});

function parseArgs(args) {
  // If no arguments, print the help message...
  if (args.length < 3) {
    printHelp();
    return;
  }

  // If too many errors, exit early...
  if (args.length > 5) {
    exit('Too many parameters, run `pully --help` for usage details.', ERROR_CODES.TOO_MANY_ARGUMENTS);
  }

  let options = {
    url: args[2],
    preset: null,
    cli: true // Set a flag to indicate we should display progress...
  };

  if (options.url === '-h' || options.url === '--help' || options.url === '/?') {
    printHelp();
    return;
  }

  if (isInvalidYoutubeUrl(options.url)) {
    exit('"' + options.url + '" is invalid, please try a different URL!', ERROR_CODES.INVLAID_URL);
  }

  // If at least one argument is preset...
  if (args.length >= 4) {
    if (isNaN(args[3])) {
      options.preset = args[3];
    }
  }

  // If a second argument is present...
  if (args.length === 5) {

    if (isNaN(args[3])) {
      if (!options.preset) {
        options.preset = args[3];
      } else {
        exit('Too many presets, run `pully --help` for usage details.', ERROR_CODES.INVALID_ARGUMENTS);
      }
    }
  }

  return options;
}

function printHelp() {

  var presets = new PresetManager();

  console.log('');
  console.log(chalk.green.bold('Downloads a specified video or playlist in the specified format.'));
  console.log('');
  console.log('Usage:');
  console.log('');
  console.log(chalk.yellow.bold('  pully <url> [preset]'));
  console.log('');
  console.log('Available Presets:');
  console.log('');
  console.log(chalk.cyan.bold('  ' + presets.available.join(', ')));
  console.log('');
  process.exit(ERROR_CODES.SUCCESS);
}

function isInvalidYoutubeUrl(url) {
  return !validator.isURL(url, {
    host_whitelist: ['www.youtube.com', 'youtube.com', 'youtu.be'],
    allow_underscores: true
  });
}

function exit(message, code) {
  console.log('');
  console.error(chalk.red.bold(message));
  console.log('');
  process.exit(code);
}