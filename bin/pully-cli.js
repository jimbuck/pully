#!/usr/bin/env node

var commander = require('commander');

var util = require('../lib/utils.js');
var Pully = require('../lib/pully.js');

(function () {

    if(process.argv.length < 3) {
        console.error("Usage: `pully <url>`");
        process.exit(1);
    }

    var url = process.argv[2];
    var type = (process.argv.length > 2 ? process.argv[3] : undefined) || 'mp4';

    if(typeof url == 'undefined') {
        console.error("Please specify a valid video url.");
        process.exit(1);
    }

    if(url.slice(0, 4) !== 'http') {
        url = 'https://www.youtube.com/watch?v=' + url;
    }

    var pully = new Pully(type, type);

    // Test URL: https://www.youtube.com/watch?v=ZVOmv_vMIbA

    pully.download(url, function(videoPath){
        console.log(videoPath);
        console.log();
    })

})();
