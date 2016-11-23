#!/bin/bash

# Stop on error, print each line before running
set -ex

# Install dependencies

wget http://johnvansickle.com/ffmpeg/builds/ffmpeg-git-64bit-static.tar.xz
tar xf ffmpeg-git-64bit-static.tar.xz

mkdir -p $HOME/bin
cp ffmpeg-git-*-static/{ffmpeg,ffprobe,ffserver} $HOME/bin
cp ffmpeg-git-*-static/{ffmpeg,ffprobe} $(pwd)

export PATH=$(pwd)/bin:$PATH
export ALT_FFMPEG_PATH=$(pwd)/ffmpeg
export ALT_FFPROBE_PATH=$(pwd)/ffprobe

if [ -z "$(which flvtool2)" ]; then
	export FLVTOOL2_PRESENT=no
else
	export FLVTOOL2_PRESENT=yes
fi