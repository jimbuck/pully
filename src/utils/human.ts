

const UNITS = ' KMGTPEZYXWVU';
const LOG_1024 = Math.log(1024);

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {Number} seconds
 * @return {String}
 */
export function toHumanTime(seconds: number) {
  let hourStr: string;
  let minStr: string;
  let secStr: string;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;

  if (h > 0) {
    hourStr = h + ':';
    minStr = (m < 10 ? '0' : '') + m;
  } else {
    hourStr = '';
    if (m > 0) {
      minStr = (m < 10 ? '0' : '') + m + ':';
    } else {
      minStr = '';
    }
  }

  secStr = (s < 10 ? '0' : '') + s;

  return hourStr + minStr + secStr;
}

/**
 * Convert bytes to human readable unit.
 *
 * @param {Number} bytes
 * @return {String}
 */
export function toHumanSize(bytes: number) {
  if (bytes <= 0) {
    return '0B';
  }
  let t2 = Math.min(Math.floor(Math.log(bytes) / LOG_1024), 12);
  return (Math.round(bytes * 100 / Math.pow(1024, t2)) / 100) + UNITS.charAt(t2).replace(' ', '') + 'B';
}