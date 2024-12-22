import { ExtractWithoutType } from "./typeUtils";

export type Position = {
  x: number;
  y: number;
};

export type Side = 1 | 2;
export type Orb = {
  id: number;
  pos: Position;
  count: number;
  side: Side;
  protons: Proton[];
  movementId?: number;
};

export type Proton = {
  id: number;
  pos: Position;
};

export type OrbsStateInitialization = {
  orbs: {
    pos: Position;
    count: number;
    side: Side;
  }[];
};

class IdGenerator {
  private static id = 0;
  static newId() {
    return this.id++;
  }
}

export class OrbsState {
  private orbs: Orb[] = [];
  constructor(private boardSize: number) {}

  initialize(init: OrbsStateInitialization): OrbReaction[] {
    return init.orbs.map((o) => this.createOrb(o)).flat();
  }

  runCommand(command: OrbCommand): OrbReaction[] {
    switch (command.type) {
      case "create":
        return this.createOrb(command);
      case "increment":
        return this.incrementOrb(command);
      default:
        throw new Error(`Invalid command: ${command}`);
    }
  }

  private createOrb(
    command: ExtractWithoutType<OrbCommand, "create">,
  ): OrbReaction[] {
    const positions = ProtonHelper.positions(command.count);
    const newOrb: Orb = {
      id: IdGenerator.newId(),
      pos: command.pos,
      side: command.side,
      count: command.count,
      protons: positions.map((pos) => {
        return {
          id: IdGenerator.newId(),
          pos,
        };
      }),
    };
    this.orbs.push(newOrb);
    return [
      {
        type: "sequence",
        reactions: [
          {
            type: "create",
            orb: newOrb,
          },
          {
            type: "parallel",
            reactions: newOrb.protons.map((proton) => {
              const react: OrbReaction = {
                type: "createProton",
                orbId: newOrb.id,
                protonId: proton.id,
                pos: ProtonHelper.center,
              };
              return react;
            }),
          },
          {
            type: "parallel",
            reactions: newOrb.protons.map((proton) => {
              const react: OrbReaction = {
                type: "moveProton",
                orbId: newOrb.id,
                protonId: proton.id,
                pos: proton.pos,
              };
              return react;
            }),
          },
        ],
      },
    ];
  }

  /*
   * Empty space is clicked
   * Craete Orb
   *
   * An Orb is clicked
   * If orb count is < 4
   *  increment
   * else
   *  delete current orb
   *  [split into neighboring cells]
   *  after every split ends
   *  while true
   *  check if game is finished
   *  check if there are any merge locations
   *    if yes
   *      get total count, with max of 4
   *      if < 4
   *        pick one of incoming orbs and increment its count (this could be multiple increments -- )
   *      if === 4
   *        delete all orbs and [split into neighboring cells]
   *
   * */
  private incrementOrb(
    command: Extract<OrbCommand, { type: "increment" }>,
  ): OrbReaction[] {
    const orb = this.orbs.find((orb) => orb.id === command.id);
    if (!orb) {
      throw new Error(`Orb not found: ${command.id}`);
    }

    if (orb.count < 4) return this.simpleIncrementOrb(command);

    const reactions: OrbReaction[] = [];
    reactions.push(...this.deleteOrb(orb.id));
    reactions.push(...this.splitFromPos(orb.pos, orb.side));

    while (true) {
      if (this.isGameFinished()) {
        reactions.push({ type: "finishGame" });
        break;
      }

      const mergeReactions = this.checkMerges();
      if (mergeReactions.length === 0) break;

      reactions.push({
        type: "parallel",
        reactions: mergeReactions,
      });
    }

    return reactions;
  }

  private isGameFinished(): boolean {
    return new Set(this.orbs.map((orb) => orb.side)).size === 1;
  }

  private simpleIncrementOrb(
    command: Extract<OrbCommand, { type: "increment" }>,
  ): OrbReaction[] {
    const positions = ProtonHelper.positions(command.to);
    const orb = this.orbs.find((orb) => orb.id === command.id);

    if (!orb) {
      throw new Error(`Orb not found: ${command.id}`);
    }

    return [
      {
        type: "parallel",
        reactions: positions.map((pos, idx) => {
          const react: OrbReaction = {
            type: "moveProton",
            orbId: orb.id,
            protonId: orb.protons[idx].id,
            pos,
          };
          return react;
        }),
      },
    ];
  }

  private deleteOrb(id: number): OrbReaction[] {
    const orb = this.orbs.find((orb) => orb.id === id);

    if (!orb) {
      throw new Error(`Orb not found: ${id}`);
    }
    return [
      {
        type: "delete",
        orb,
      },
    ];
  }

  private splitFromPos(pos: Position, side: Side): OrbReaction[] {
    const neighbors = CellHelper.getNeighbors(pos, this.boardSize);
    const oneProtonPositions = ProtonHelper.positions(1);

    const newOrbs = neighbors.map((newPos) => {
      const newOrb: Orb = {
        id: IdGenerator.newId(),
        count: 1,
        pos: newPos,
        side: side,
        protons: oneProtonPositions.map((pos) => {
          const proton: Proton = {
            id: IdGenerator.newId(),
            pos,
          };
          return proton;
        }),
        movementId: IdGenerator.newId(),
      };
      return newOrb;
    });

    this.orbs.push(...newOrbs);

    return [
      {
        type: "sequence",
        reactions: [
          ...newOrbs.map((newOrb) => {
            const react: OrbReaction = {
              type: "create",
              orb: {
                ...newOrb,
                pos,
              },
            };
            return react;
          }),
          ...newOrbs
            .map((newOrb) => {
              return newOrb.protons.map((proton) => {
                const react: OrbReaction = {
                  type: "createProton",
                  orbId: newOrb.id,
                  pos: proton.pos,
                  protonId: proton.id,
                };
                return react;
              });
            })
            .flat(),
          ...newOrbs.map((newOrb) => {
            const react: OrbReaction = {
              type: "move",
              id: newOrb.id,
              pos: newOrb.pos,
            };

            return react;
          }),
        ],
      },
    ];
  }

  /*
   * Check if there are any overlapping orbs
   * */
  private checkMerges(): OrbReaction[] {
    const orbsMap: Record<string, Orb[]> = {};

    for (const orb of this.orbs) {
      const key = `${orb.pos.x}-${orb.pos.y}`;
      if (!orbsMap[key]) {
        orbsMap[key] = [];
      }
      orbsMap[key].push(orb);
    }

    const reactions: OrbReaction[][] = [];

    for (const orbs of Object.values(orbsMap)) {
      if (orbs.length < 2) continue;

      const totalCount = orbs
        .map((orb) => orb.count)
        .reduce((a, b) => a + b, 0);
      if (totalCount >= 4) {
        reactions.push(this.mergeWhenMoreThan4(orbs));
        continue;
      }

      reactions.push(this.mergeWhenLessThan4(orbs, totalCount));
      continue;
    }

    // TODO: Kötü olabilir
    return reactions.flat();
  }

  private mergeWhenMoreThan4(orbs: Orb[]): OrbReaction[] {
    const splitReactions = this.splitFromPos(
      orbs[0].pos,
      this.oldestOrb(orbs)!.side,
    );
    return [
      {
        type: "parallel",
        reactions: [
          ...orbs.map((orb) => {
            // TODO: Kötü olabilir
            this.orbs.splice(orbs.indexOf(orb), 1);
            const react: OrbReaction = {
              type: "delete",
              orb,
            };
            return react;
          }),
          ...splitReactions,
        ],
      },
    ];
  }

  private oldestOrb(orbs: Orb[]): Orb | undefined {
    let oldestOrb: Orb | undefined = undefined;
    let oldestId = Infinity;
    for (const orb of orbs) {
      if (!orb.movementId) {
        oldestOrb = orb;
        break;
      }

      if (orb.movementId < oldestId) {
        oldestId = orb.movementId;
        oldestOrb = orb;
      }
    }
    return oldestOrb;
  }

  private mergeWhenLessThan4(orbs: Orb[], count: number): OrbReaction[] {
    const oldestOrb = this.oldestOrb(orbs);
    if (!oldestOrb) throw new Error("No oldest orb");

    const randomKiller = orbs
      .filter((o) => o !== oldestOrb)
      .reduce(
        (smallest, orb, idx) => {
          if (smallest == undefined) {
            return { orb, idx };
          } else {
            if (orb.count < smallest.orb.count) {
              return { orb, idx };
            }
          }
          return smallest;
        },
        undefined as { orb: Orb; idx: number } | undefined,
      )!;
    if (randomKiller.idx === -1) throw new Error("No random killer");

    const oldProtons = randomKiller.orb.protons;
    const positions = ProtonHelper.positions(count);
    const newOrb: Orb = {
      id: randomKiller.orb.id,
      movementId: IdGenerator.newId(),
      protons: positions.map((pos) => {
        const proton: Proton = {
          id: IdGenerator.newId(),
          pos,
        };
        return proton;
      }),
      pos: randomKiller.orb.pos,
      count,
      side: randomKiller.orb.side,
    };

    const deadOrbs: Orb[] = [];
    for (const orb of orbs) {
      const idx = this.orbs.indexOf(orb);
      if (idx === -1) throw new Error("Orb not found");
      if (idx === randomKiller.idx) continue;

      deadOrbs.push(orb);
      this.orbs.splice(idx, 1);
    }

    this.orbs.splice(orbs.indexOf(oldestOrb), 1, newOrb);

    return [
      {
        type: "parallel",
        reactions: [
          ...deadOrbs.map((orb) => {
            const react: OrbReaction = {
              type: "delete",
              orb,
            };
            return react;
          }),
          ...newOrb.protons.map((proton, idx) => {
            const react: OrbReaction = oldProtons[idx]
              ? {
                  type: "moveProton",
                  orbId: newOrb.id,
                  protonId: proton.id,
                  pos: proton.pos,
                }
              : {
                  type: "createProton",
                  orbId: newOrb.id,
                  protonId: proton.id,
                  pos: proton.pos,
                };
            return react;
          }),
        ],
      },
    ];
  }
}

export type OrbCommand =
  | {
      type: "create";
      pos: Position;
      side: Side;
      count: number;
    }
  | {
      type: "increment";
      id: number;
      to: number;
    };

export type OrbReaction =
  | {
      type: "finishGame";
    }
  | {
      type: "delete";
      orb: Orb;
    }
  | {
      type: "create";
      orb: Orb;
    }
  | {
      type: "move";
      id: number;
      pos: Position;
    }
  | {
      type: "createProton";
      orbId: number;
      protonId: number;
      pos: Position;
    }
  | {
      type: "moveProton";
      orbId: number;
      protonId: number;
      pos: Position;
    }
  | {
      type: "sequence";
      reactions: OrbReaction[];
    }
  | {
      type: "parallel";
      reactions: OrbReaction[];
    };

class ProtonHelper {
  static positions(count: number) {
    if (count === 1) {
      return [{ x: 1, y: 1 }];
    }
    if (count === 2) {
      return [
        { x: 1, y: 0 },
        { x: 1, y: 2 },
      ];
    }
    if (count === 3) {
      return [
        { x: 0, y: 1 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ];
    }
    if (count === 4) {
      return [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ];
    }

    throw new Error(`Invalid count: ${count}`);
  }

  static center = { x: 1, y: 1 };
}

class CellHelper {
  static getNeighbors(pos: Position, boardSize: number) {
    const neighbors: Position[] = [];

    if (pos.x > 0) {
      neighbors.push({ x: pos.x - 1, y: pos.y });
    }
    if (pos.x < boardSize - 1) {
      neighbors.push({ x: pos.x + 1, y: pos.y });
    }
    if (pos.y > 0) {
      neighbors.push({ x: pos.x, y: pos.y - 1 });
    }
    if (pos.y < boardSize - 1) {
      neighbors.push({ x: pos.x, y: pos.y + 1 });
    }

    return neighbors;
  }
}
