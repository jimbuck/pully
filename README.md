# pully

[![Travis-CI](https://img.shields.io/travis/JimmyBoh/pully.svg?style=flat-square)](https://travis-ci.org/JimmyBoh/pully)
[![Code Climate](https://img.shields.io/codeclimate/github/JimmyBoh/pully.svg?style=flat-square)](https://codeclimate.com/github/JimmyBoh/pully)
[![Code Coverage](https://img.shields.io/codeclimate/coverage/github/JimmyBoh/pully.svg?style=flat-square)](https://codeclimate.com/github/JimmyBoh/pully/coverage)
[![Dependency Status](https://img.shields.io/david/jimmyboh/pully.svg?style=flat-square)](https://david-dm.org/jimmyboh/pully)
[![npm version](https://img.shields.io/npm/v/pully.svg?style=flat-square)](https://www.npmjs.com/package/pully)

A simple CLI for downloading high quality Youtube videos!

This tool allows the downloading of Youtube videos of `1080p` and higher qualities. The video and audio is separate, so this combines them after downloading both.

Further documentation for this tool will be added later, but expect a basic search functionality as well as batch download (playlists, `n` most recent, segmented videos, etc).

### BEFORE USING:

While this tool makes it easy to download content from Youtube, I do not endorse the theft of content created by hardworking citizens of the Internet. If you use Youtube as a primary source of entertainment, then **please remember to _turn off ad-block_, _buy their merchandise_, or _donate_ to the content creators you love to watch.** And if you can't do that then simply like, comment, and subscribe to help them get more people enjoying their content.

## CLI

### Installation

```bash
npm install -g pully
```

### Usage

```bash
pully <url> <preset>
```

Downloads a specified video in the specified format. The file is named after the title and placed in a folder named after the publisher.

## Presets

Presets are used in the CLI version to simplify getting the video you want. The actual preset data can be found in `./data/presets.json`, but plans to make them more customizable will be coming soon. Presets are available in the module usage as well!

- `hd` This will only download videos up to `1080p`. (**default**)
- `2k` This will only download videos between `1080p` and `1440p`.
- `4k` This will only download videos between `1080p` and `2160p`.
- `hfr` This will only download videos with a minimum of `48fps`.
- `24` This will only download videos with a framerate of `24fps`.
- `audio` This will only download the audio.

## Node Module

### Installation

```bash
npm install pully
```

### Usage

```js
var pully = require('pully')

var options = {
  url: '<some-really-high-def-video-url>',
  preset: '4k'
};

pully(options, function(err, info, filePath){
  console.log("Downloaded to " + filePath);
});
```

## Donating

Help fund this project by donating, or just buy me a beer!

[![Support via Gratipay](https://cdn.rawgit.com/gratipay/gratipay-badge/2.3.0/dist/gratipay.svg)](https://gratipay.com/JimmyBoh/)


## License

The MIT License (MIT)

Copyright (c) 2014-2015 Jim Buck

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
