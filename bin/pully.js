#!/usr/bin/env node

var _ = require('underscore');
var util = require('../lib/utils');
var pully = require('../lib/main');
var errorCodes = require('../data/error-codes');

(function () {

    // Test URL: https://www.youtube.com/watch?v=ZVOmv_vMIbA
    
    var options = parseArgs(process.argv);

    pully(options, function (err, videoPath) {
        var data = err || videoPath;
        
        console.log(data);
        console.log('');
    });

    function parseArgs(args) {
        // If no arguments, print the help message...
        if(args.length < 3) {
            printHelp();
        }

        // If too many errors, exit early...
        if(args.length > 5) {
            exit('Too many parameters, run `pully --help` for usage details.', errorCodes.TOO_MANY_ARGUMENTS);
        }

        var options = {
            url: args[2]
        };

        // TODO: Validate URL format.

        // If at least one argument is preset...
        if(args.length >= 4) {
            if(isNaN(args[3]))
                options.preset = args[3];
            else
                options.count = parseInt(args[3]);
        }

        // If a second argument is present...
        if(args.length === 5) {

            if(isNaN(args[3])){
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

        // Ensure that each has a value...
        options.preset = options.preset || 'hd';
        options.count = options.count || 3;
        
        return options;
    }

    function printHelp() {
        console.log('');
        console.log('Downloads a specified video or playlist in the specified format.')
        console.log('');
        console.log('Usage: pully <url> [preset] [count]');
        console.log('');
        console.log('Options:');
        console.log('');
        console.log('-h, --help     output usage information');
        console.log('-V, --version  output the version number');
        console.log('');
        process.exit(errorCodes.SUCCESS);
    }

    function exit(message, code) {
        console.log('');
        console.error(message);
        console.log('');
        process.exit(code);
    }

})();
