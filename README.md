pully
=====

A simple CLI for downloading high quality YouTube videos!

This tool allows the downloading of YouTube videos of `1080p` and higher qualities. The video and audio is separate, so this combines them after downloading both.

Further documentation for this tool will be added later, but expect a basic search functionality as well as batch download (playlists, `n` most recent, segmented videos, etc).

# CLI

## Installation

```bash
npm install -g pully
```

## Usage

```bash
pully <url> <preset>
```

Downloads a specified video in the specified format. The file is named after the title and placed in a folder named after the publisher.

# Presets

Presets are used in the CLI version to simplify getting the video you want. The actual preset data can be found in `./data/presets.json`, but plans to make them more customizable will be coming soon. Presets are available in the module usage as well!

- `hd` This will only download videos up to `1080p`. (**default**)
- `2k` This will only download videos between `1080p` and `1440p`.
- `4k` This will only download videos between `1080p` and `2160p`.
- `hfr` This will only download videos with a minimum of `48fps`.
- `24` This will only download videos with a framerate of `24fps`.
- `audio` This will only download the audio.

# Node Module

## Installation

```bash
npm install pully

```

## Usage

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

# License

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
