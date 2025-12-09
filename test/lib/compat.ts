// Array.prototype.find (ES2015)
export function arrayFind<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => boolean): T | undefined {
  if (typeof arr.find === 'function') {
    return arr.find(predicate);
  }
  for (var i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) return arr[i];
  }
  return undefined;
}

// Array.prototype.includes (ES2016)
export function arrayIncludes<T>(arr: T[], value: T): boolean {
  if (typeof arr.includes === 'function') {
    return arr.includes(value);
  }
  return arr.indexOf(value) !== -1;
}
