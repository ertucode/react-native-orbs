const activeKeys: string[] | undefined = ["MERGE", "ORBS"];

function overlaps(a: string[], b: string[]) {
  for (const aItem of a) {
    if (b.includes(aItem)) return true;
  }
  return false;
}

export const logger = {
  log(key: Uppercase<string>, ...params: any[]) {
    if (activeKeys !== undefined && !overlaps(key.split(":"), activeKeys))
      return;
    return console.log(`[${key}]: `, ...params);
  },
};
