'use strict';

const UNITS = ' KMGTPEZYXWVU';
const LOG_1024 = Math.log(1024);

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {Number} seconds
 * @return {String}
 */
function toHumanTime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor(seconds / 60) % 60;

  let time;
  if (h > 0) {
    time = h + ':';
    if (m < 10) {
      m = '0' + m;
    }
  } else {
    time = '';
  }

  let s = seconds % 60;
  if (s < 10) { s = '0' + s; }

  return time + m + ':' + s;
}



/**
 * Converst bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 *
 * @param {Number} bytes
 * @return {String}
 */
function toHumanSize(bytes) {
  if (bytes <= 0) {
    return '0B';
  }
  let t2 = Math.min(Math.floor(Math.log(bytes) / LOG_1024, 12));
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) + UNITS.charAt(t2).replace(' ', '') + 'B';
}


function createGuid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

module.exports = {
  toHumanTime,
  toHumanSize,
  createGuid
};