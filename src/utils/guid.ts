

export function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4(true) + '-' + s4() + '-' + s4() + s4() + s4();
}

function s4(v4: boolean = false) {
  if (v4) {
    return '4' + Math.floor((1 + Math.random()) * 0x1000).toString(16).substring(1);
  } else {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
}