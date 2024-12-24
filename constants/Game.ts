const initialOrbs = {
  heavy: `
▲3|▲3|▲3|▲3|▲3
▲3|▲3|▲3|▲3|▲3
▲3|▲3|▲3|▼3|▲3
▼3|▼3|▼3|▼3|▼3
▼3|▼3|▼3|▼3|
`,
  thing: `
▲3|  |  |  |  
  |  |  |▲3|  
  |  |  |▼3|  
  |  |  |  |  
  |  |▼3|  |
`,
};
export const Game = {
  board: {
    gap: 10,
    cellSize: 40,
    padding: 6,
    borderRadius: 10,
  },
  orb: {
    size: 30,
    protonRatio: 5,
    ballGap: 3,
  },
  animation: {
    proton: 300,
    orb: 600,
  },
  initialOrbs: initialOrbs.heavy,
} as const;
