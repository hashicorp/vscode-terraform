import { readFile } from 'fs';

export function read(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString('utf8'));
      }
    });
  });
}

export function readBuffer(path: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

type MatcherFunction = (character: string) => boolean;

export function backwardsSearch(haystack: string, matcher: MatcherFunction): number {
  if (haystack.length === 0)
    return -1;

  for (let i = haystack.length - 1; i >= 0; i--) {
    if (matcher(haystack[i])) {
      return i;
    }
  }

  return -1;
}

export function count(haystack: string, character: string): number {
  let result = 0;
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === character)
      result++;
  }
  return result;
}