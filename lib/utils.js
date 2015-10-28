//var _ = require('underscore');


var utils = {};

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {Number} seconds
 * @return {String}
 */
utils.toHumanTime = function (seconds) {
  var h = Math.floor(seconds / 3600);
  var m = Math.floor(seconds / 60) % 60;

  var time;
  if (h > 0) {
    time = h + ':';
    if (m < 10) {
      m = '0' + m;
    }
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

utils.toHumanSize = function (bytes) {
  if (bytes <= 0) { return '0'; }
  var t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) +
    units.charAt(t2).replace(' ', '') + 'B';
};


utils.createGuid = function () {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

module.exports = utils;