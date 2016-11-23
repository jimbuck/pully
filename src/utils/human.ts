

const UNITS = ' KMGTPEZYXWVU';
const LOG_1024 = Math.log(1024);

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {Number} seconds
 * @return {String}
 */
export function toHumanTime(seconds: number, decimals: number = 0): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || !Number.isFinite(seconds)) {
    return '';
  }

  const h = Math.floor(seconds / 3600);
  let m: string | number = Math.floor(seconds / 60) % 60;

  let time: string;
  if (h > 0) {
    time = h + ':';
    if (m < 10) {
      m = '0' + m;
    }
  } else {
    time = '';
  }

  let s: string | number = seconds % 60;
  if (s < 10) {
    s = '0' + s.toFixed(decimals);
  } else {
    s = s.toFixed(decimals);
  }

  return time + m + ':' + s;
}

/**
 * Convert bytes to human readable unit.
 *
 * @param {Number} bytes
 * @return {String}
 */
export function toHumanSize(bytes: number, places: number = 0) {
  if (!bytes || isNaN(bytes) || !Number.isFinite(bytes)) {
    return '0B';
  }

  const t2 = Math.min(Math.floor(Math.log(bytes) / LOG_1024), 12);
  return (bytes / Math.pow(1024, t2)).toFixed(places) + UNITS.charAt(t2).replace(' ', '') + 'B';
}

export function fromHumanSize(size: string): number {
  if (!size) {
    return null;
  }

  let num = parseFloat(size);
  let numLength = ('' + num).length;
  let unit = size[numLength];

  let unitIndex = UNITS.indexOf(unit);

  if (unitIndex < 0) {
    return num;
  }

  return Math.pow(1024, unitIndex) * num; 
}