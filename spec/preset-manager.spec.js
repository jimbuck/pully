describe('PresetManager', function () {

	var PresetManager = require('../lib/preset-manager');

	it('should be a constructor function', function () {
		expect(typeof (PresetManager)).toBe('function');
	});

	it('should contain a list of standard video presets', function () {

		var presets = new PresetManager();

		['sd', 'hd', '2k', '4k', 'hfr', '24'].forEach(function (preset) {
			expect(presets[preset]).toBeDefined();
			expect(presets[preset].videoIn).toBeDefined();
		});
	});

	it('should contain a list of standard audio presets', function () {

		var presets = new PresetManager();

		['audio'].forEach(function (preset) {
			expect(presets[preset]).toBeDefined();
			expect(presets[preset].audioIn).toBeDefined();
		});
	});

});