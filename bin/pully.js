#!/usr/bin/env node

var _ = require('underscore');
var validator = require('validator');
require('colors');

var util = require('../lib/utils');
var pully = require('../lib/main');
var PresetManager = require('../lib/preset-manager');
var errorCodes = require('../data/error-codes');

(function () {

    // Test URL: https://www.youtube.com/watch?v=ZVOmv_vMIbA

    var options = parseArgs(process.argv);

    pully(options, function (err, info, videoPath) {

        if(err)
            console.error(err);
        else
            console.log('Download complete for "' + info.title.yellow.bold + '"! (' + videoPath.grey.bold + ')');

        console.log('');
    });

    function parseArgs(args) {
        // If no arguments, print the help message...
        if(args.length < 3) {
            printHelp();
            return;
        }

        // If too many errors, exit early...
        if(args.length > 5) {
            exit('Too many parameters, run `pully --help` for usage details.', errorCodes.TOO_MANY_ARGUMENTS);
        }

        var options = {
            url: args[2]
        };

        if(options.url === '-h' || options.url === '--help' || options.url === '/?'){
            printHelp();
            return;
        }

        if(isInvalidYoutubeUrl(options.url)) {
            exit('"' + options.url + '" is invalid, please try a different URL!', errorCodes.INVLAID_URL);
        }

        // If at least one argument is preset...
        if(args.length >= 4) {
            if(isNaN(args[3]))
                options.preset = args[3];
            else
                options.count = parseInt(args[3]);
        }

        // If a second argument is present...
        if(args.length === 5) {

            if(isNaN(args[3])) {
                if(typeof options.preset === 'undefined')
                    options.preset = args[3];
                else
                    exit('Too many presets, run `pully --help` for usage details.', errorCodes.INVALID_ARGUMENTS);
            } else {
                if(typeof options.count === 'undefined')
                    options.count = parseInt(args[3]);
                else
                    exit('Too many presets, run `pully --help` for usage details.', errorCodes.INVALID_ARGUMENTS);
            }
        }

        // Set a flag to indicate we should display progress...
        options.cli = true;

        return options;
    }

    function printHelp() {

        var presets = new PresetManager();

        console.log('');
        console.log('Downloads a specified video or playlist in the specified format.'.green.bold)
        console.log('');
        console.log('Usage:');
        console.log('');
        console.log('  pully <url> [preset] [count]'.yellow.bold);
        console.log('');
        console.log('Available Presets:');
        console.log('');
        console.log('  ' + presets.available.join(', ').cyan.bold);
        console.log('');
        process.exit(errorCodes.SUCCESS);
    }

    function isInvalidYoutubeUrl(url) {
        return !validator.isURL(url, {
            host_whitelist: ['www.youtube.com', 'youtube.com', 'youtu.be'],
            allow_underscores: true
        });
    }

    function exit(message, code) {
        console.log('');
        console.error(message.red.bold);
        console.log('');
        process.exit(code);
    }

})();
