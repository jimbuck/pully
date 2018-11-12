import { test, TestContext } from 'ava';

import { getBestFormats } from './analyzer';
import { Presets, DefaultPresets, prepPreset } from './presets';

test(`Analyzer#getRequiredFormats retrieves best formats for 4K`, forBestFormats, Presets.FourK);
test(`Analyzer#getRequiredFormats retrieves best formats for 2K`, forBestFormats, Presets.TwoK);
test(`Analyzer#getRequiredFormats retrieves best formats for Max`, forBestFormats, Presets.Max);
test(`Analyzer#getRequiredFormats retrieves best formats for hfr`, forBestFormats, Presets.HFR);
test(`Analyzer#getRequiredFormats retrieves best formats for HD`, forBestFormats, Presets.HD);
test(`Analyzer#getRequiredFormats retrieves best formats for SD`, forBestFormats, Presets.SD);
test(`Analyzer#getRequiredFormats retrieves best formats for LD`, forBestFormats, Presets.LD);
test(`Analyzer#getRequiredFormats retrieves best formats for mp3`, forBestFormats, Presets.MP3);

async function forBestFormats(t: TestContext, presetName: string): Promise<void> {
    let preset = prepPreset(DefaultPresets.find(p => p.name === presetName));
    const format = await getBestFormats('https://www.youtube.com/watch?v=oVXg7Grp1W8', preset);

    let skipVideo = false;
    let skipAudio = false;
    if (preset.videoSort) {
        t.truthy(format.video);
        t.true(format.video.resolution <= preset.maxResolution);
    } else {
        skipVideo = true;
    }

    if (preset.audioSort) {
        t.truthy(format.audio);
        t.true(format.audio.audioBitrate <= preset.maxAudioBitrate);
    } else {
        skipAudio = true;
    }

    if (skipAudio && skipVideo) t.fail();
}