import { test } from 'ava';

import { Analyzer } from './analyzer';
import { Presets, DefaultPresets } from './presets';

for (let i = 0; i < DefaultPresets.length; i++) {
    let preset = DefaultPresets[i];
    test(`Analyzer#getRequiredFormats retrieves best formats for ${preset.name}`, async (t) => {
        let a = new Analyzer();
      
        // TODO: Mock this call...
        await a.getRequiredFormats('https://www.youtube.com/watch?v=HQCZRm8QlPE', preset).then(format => {
            if (preset.videoSort) {
                t.truthy(format.video);
                t.true(format.video.resolution <= preset.maxResolution);
            }

            if (preset.audioSort) {
                t.truthy(format.audio);
                t.true(format.audio.audioBitrate <= preset.maxAudioBitrate);
            }
        });
    });
}