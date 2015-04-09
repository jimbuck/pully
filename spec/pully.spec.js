
var pully = require('../index');

describe('Pully', function(){
  
  it('should provide a function', function(){
    expect(typeof pully).toBe('function');
  });
  
  it('should require a hash of options', function(){

    function noOptions() {
      pully();
    }
    
    expect(noOptions).toThrow();
  });
  
  it('should only accept YouTube URLs');

  it('should download videos to artist/title');

  it('should allow an `audio` preset to only download audio');

  it('should default to an `hd` preset to download 1080p video');

  it('should provide a callback with filepath when download is complete');

  it('should provide a callback with filepath when error');
});