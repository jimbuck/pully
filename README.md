# pully

[![Travis-CI](https://img.shields.io/travis/JimmyBoh/pully/master.svg?style=flat-square)](https://travis-ci.org/JimmyBoh/pully)
[![Dependency Status](https://img.shields.io/david/jimmyboh/pully.svg?style=flat-square)](https://david-dm.org/jimmyboh/pully)
[![npm version](https://img.shields.io/npm/v/pully.svg?style=flat-square)](https://www.npmjs.com/package/pully)

A simple CLI for downloading high quality Youtube videos!

This tool allows the downloading of Youtube videos of `1080p` and higher qualities. The video and audio is separate, so this combines them after downloading both.

### ATTENTION:

While this tool makes it easy to download content from Youtube, I do not endorse the theft of content created by hardworking citizens of the Internet. If you use Youtube as a primary source of entertainment, then **please remember to _turn off ad-block_, _buy their merchandise_, or _donate_ to the content creators you love to watch.** And if you can't do that then simply like, comment, and subscribe to help them get more people enjoying their content.

## CLI

### Installation

```bash
npm install -g pully
```

Note that pully requires `ffmpeg` to be installed. [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg) has great instructions on how to set this up.

### Usage

```bash
pully download <url> [-p <preset>="hd"] [-d <outputDir>="."] [-t <filenameTemplate>="${author}/${title}"] [--silent]

pully set dir "~/Jim/videos/YouTube"

pully get dir # Prints ~/Jim/videos/YouTube

pully dl <url> # Downloads specified video to ~/Jim/videos/YouTube/<author>/<title>.mp4
```

Downloads a specified video based on a preset, defaulting to HD (see below). By default the file is named after the title and placed in a folder named after the author.

## Presets

Presets are used in the CLI version to simplify getting the video you want. Presets are available in the module, and can be overridden/extended!

- `hd` This will download the best video up to `1080p60`. (**default**)
- `2k` This will download the best video up to `1440p60`.
- `4k` This will download the best video up to `2160p60`.
- `max` This will download the best video, no limits on resolution or framerate.
- `hfr` This will download the video with the highest framerate.
- `mp3` This will only download the audio only, and convert it to `mp3`.

## Node Module

### Installation

```bash
npm i --save pully
```

### Usage

```ts
import { Pully, Presets } from 'pully';

const pully = new Pully();

const options = {
  url: '<some-really-high-def-video-url>',
  preset: Presets.FourK,
  progress: (data) => console.log(data.percent + '%') // Progress reporter callback...
};

pully.download(options).then((
  path => console.log('Downloaded to ' + path), // Path to the downloaded file
  err => console.error(err) // Error info
);
```
 
## Contribute
 
 0. Fork it
 1. `npm i`
 2. `gulp watch`
 3. Make changes and **write tests**.
 4. Send pull request! :sunglasses:
 
## License:
 
MIT