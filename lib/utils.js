var _ = require('underscore');

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {Number} seconds
 * @return {String}
 */
exports.toHumanTime = function(seconds) {
  var h = Math.floor(seconds / 3600);
  var m = Math.floor(seconds / 60) % 60;

  var time;
  if (h > 0) {
    time = h + ':';
    if (m < 10) { m = '0' + m; }
  } else {
    time = '';
  }

  var s = seconds % 60;
  if (s < 10) { s = '0' + s; }

  return time + m + ':' + s;
};


/**
 * Converst bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 *
 * @param {Number} bytes
 * @return {String}
 */
var units = ' KMGTPEZYXWVU';
exports.toHumanSize = function(bytes) {
  if (bytes <= 0) { return 0; }
  var t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) +
          units.charAt(t2).replace(' ', '') + 'B';
};


exports.getBestVideo = function(formats, container) {

    var videoFormats = _.filter(formats, function(format){

        return (!!~(format.type || '').indexOf('video/'+container));
    });

    if(videoFormats.length === 0)
        return null;

    videoFormats.sort(videoCompare);

    videoFormats[0].isVideo = true;

    return videoFormats[0];
}

exports.getBestAudio = function(formats, encoding) {
    var audioFormats = _.filter(formats, function(format){
        return (!!~(format.type || '').indexOf('audio/'+encoding));
    });

    if(audioFormats.length === 0)
        return null;

    audioFormats.sort(audioCompare);

    audioFormats[0].isAudio = true;

    return audioFormats[0];
}

function videoCompare(a, b) {
    var ares = a.resolution ? parseInt(a.resolution.slice(0, -1), 10)
             : a.size ? parseInt(a.size.slice(a.size.indexOf('x')+1))
             : 0;

    var bres = b.resolution ? parseInt(b.resolution.slice(0, -1), 10)
             : b.size ? parseInt(b.size.slice(b.size.indexOf('x')+1))
             : 0;

    var afps = a.fps || 0;
    var bfps = b.fps || 0;

    var afeats = (~~!!ares * 2) + (~~!!afps);
    var bfeats = (~~!!bres * 2) + (~~!!bfps);

    if(afeats === bfeats) {
        if(ares === bres) {
            var abitrate, bbitrate, s;
            if(a.bitrate) {
                s = a.bitrate.split('-');
                abitrate = parseFloat(s[s.length - 1], 10);
            } else {
                abitrate = 0;
            }
            if(b.bitrate) {
                s = b.bitrate.split('-');
                bbitrate = parseFloat(s[s.length - 1], 10);
            } else {
                bbitrate = 0;
            }
            if(abitrate === bbitrate) {
                return 0;
            } else {
                return bbitrate - abitrate;
            }
        } else {
            return bres - ares;
        }
    } else {
        return bfeats - afeats;
    }
}

function audioCompare(a, b) {
    var aabitrate = a.audioBitrate || 0;
    var babitrate = b.audioBitrate || 0;

    return aabitrate - babitrate;
}

function formatCompare(a, b) {
    var ares = a.resolution ? parseInt(a.resolution.slice(0, -1), 10) : 0;
    var bres = b.resolution ? parseInt(b.resolution.slice(0, -1), 10) : 0;
    var aabitrate = a.audioBitrate || 0;
    var babitrate = b.audioBitrate || 0;

    var afeats = ~~!!ares * 2 + ~~!!aabitrate;
    var bfeats = ~~!!bres * 2 + ~~!!babitrate;

    if(afeats === bfeats) {
        if(ares === bres) {
            var abitrate, bbitrate, s;
            if(a.bitrate) {
                s = a.bitrate.split('-');
                abitrate = parseFloat(s[s.length - 1], 10);
            } else {
                abitrate = 0;
            }
            if(b.bitrate) {
                s = b.bitrate.split('-');
                bbitrate = parseFloat(s[s.length - 1], 10);
            } else {
                bbitrate = 0;
            }
            if(abitrate === bbitrate) {
                return babitrate - aabitrate;
            } else {
                return bbitrate - abitrate;
            }
        } else {
            return bres - ares;
        }
    } else {
        return bfeats - afeats;
    }
}
