import { OrbsStateInitialization, Position, Side } from "./OrbState";

export function orbStateFromString(str: string): OrbsStateInitialization {
  const lines = str.split("\n").filter((l) => l.includes("|"));
  const orbs: {
    pos: Position;
    count: number;
    side: Side;
  }[] = [];
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    const lineParts = line.split("|");
    for (let x = 0; x < lineParts.length; x++) {
      const part = lineParts[x];
      if (part === "  " || part === " " || part === "") continue;
      const side = part[0] === "▲" ? 1 : 2;
      const count = parseInt(part[1]);
      orbs.push({
        pos: { x: y, y: x },
        count,
        side,
      });
    }
  }
  return {
    orbs,
  };
}
