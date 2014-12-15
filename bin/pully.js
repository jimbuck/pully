#!/usr/bin/env node

var fs = require('fs');
var _ = require('underscore');

var ytdl = require('ytdl-core');
var sanitize = require("sanitize-filename");
require('colors');

var util = require('../lib/utils.js');
var Downloader = require('../lib/downloader.js');

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

    var downloader = new Downloader(type, type);

    downloader.download(url, function(videoPath){
        console.log();
        console.log(videoPath);
    })

})();
