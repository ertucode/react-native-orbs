import { areWeTestingWithJest } from "./jestHelper";

const activeKeys: string[] | undefined = [
  "INTERACTION",
  "ORBS",
  "APPLY",
  "REACTIONS",
];

function overlaps(a: string[], b: string[]) {
  for (const aItem of a) {
    if (b.includes(aItem)) return true;
  }
  return false;
}

export const logger = {
  log(key: Uppercase<string>, ...params: any[]) {
    if (areWeTestingWithJest()) return;
    if (activeKeys !== undefined && !overlaps(key.split(":"), activeKeys))
      return;
    return console.log(`[${key}]: `, ...params);
  },
};
