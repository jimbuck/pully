
const sanitize = require('sanitize-filename');

export function scrubString(text: string): string {
  return sanitize(text);
}

export function scrubObject(target: any): any {
  let result: any = {};

  Object.keys(target).forEach(key => {
    let val = target[key];
    result[key] = typeof val === 'string' ? scrubString(val) : val;
  });
  
  return result;
}