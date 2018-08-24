import { test, TestContext } from 'ava';

import { getBestFormats } from './analyzer';
import { Presets, DefaultPresets } from './presets';

test(`Analyzer#getRequiredFormats retrieves best formats for 4K`, forBestFormats, Presets.FourK);
test(`Analyzer#getRequiredFormats retrieves best formats for 2K`, forBestFormats, Presets.TwoK);
test(`Analyzer#getRequiredFormats retrieves best formats for Max`, forBestFormats, Presets.Max);
test(`Analyzer#getRequiredFormats retrieves best formats for hfr`, forBestFormats, Presets.HFR);
test(`Analyzer#getRequiredFormats retrieves best formats for HD`, forBestFormats, Presets.HD);
test(`Analyzer#getRequiredFormats retrieves best formats for mp3`, forBestFormats, Presets.MP3);

async function forBestFormats(t: TestContext, presetName: string): Promise<void> {
    const preset = DefaultPresets.find(p => p.name === presetName);
    const format = await getBestFormats('https://www.youtube.com/watch?v=oVXg7Grp1W8', preset);

    if (preset.videoSort) {
        t.truthy(format.video);
        t.true(format.video.resolution <= preset.maxResolution);
    }

    if (preset.audioSort) {
        t.truthy(format.audio);
        t.true(format.audio.audioBitrate <= preset.maxAudioBitrate);
    }
}