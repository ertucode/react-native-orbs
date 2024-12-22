import { useEffect, useMemo, useState } from "react";
import {
  OrbCommand,
  OrbReaction,
  OrbsState,
  OrbsStateInitialization,
  Position,
  Side,
} from "./OrbState";
import { Animated } from "react-native";
import { Callback, ExtractWithoutType } from "./typeUtils";
import { Game } from "@/constants/Game";
import { DoneCounter } from "./DoneCounter";
import { logger } from "./logger";

function runParallel(
  reactions: OrbReaction[],
  options: RunReactionOptions,
  done: Callback,
) {
  const length = reactions.length;
  const counter = new DoneCounter(done, length);
  for (const reaction of reactions) {
    runReaction(reaction, counter.done, options);
  }
}

type SetOrbs = React.Dispatch<React.SetStateAction<UiOrb[]>>;

class SequenceRunner {
  constructor(
    private reactions: OrbReaction[],
    private options: RunReactionOptions,
  ) {}

  run(done: Callback) {
    let idx = 0;
    const onDone = () => {
      idx++;
      if (idx === this.reactions.length) {
        done();
      } else {
        runReaction(this.reactions[idx], onDone, this.options);
      }
    };
    runReaction(this.reactions[0], onDone, this.options);
  }
}

type RunReactionOptions = {
  setOrbs: SetOrbs;
  boardSize: number;
};

function runReaction(
  reaction: OrbReaction,
  done: Callback,
  options: RunReactionOptions,
) {
  switch (reaction.type) {
    case "finishGame":
      // TODO
      return done();
    case "parallel":
      return runParallel(reaction.reactions, options, done);
    case "sequence":
      return new SequenceRunner(reaction.reactions, options).run(done);
    case "create":
      return createOrb(reaction, options, done);
    case "move":
      return moveOrb(reaction, options, done);
    case "delete":
      return deleteOrb(reaction, options, done);
    case "moveProton":
      return moveProton(reaction, options, done);
    case "createProton":
      return createProton(reaction, options, done);
    default:
      throw new Error(`Invalid reaction: ${reaction}`);
  }
}

function createOrb(
  reaction: ExtractWithoutType<OrbReaction, "create">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const newOrb: UiOrb = {
      id: reaction.orb.id,
      pos: reaction.orb.pos,
      side: reaction.orb.side,
      animated: {
        x: new Animated.Value(
          PhonePositionHelper.orbPosition(
            reaction.orb.pos.x,
            options.boardSize,
          ),
        ),
        y: new Animated.Value(
          PhonePositionHelper.orbPosition(
            reaction.orb.pos.y,
            options.boardSize,
          ),
        ),
        scale: new Animated.Value(1),
      },
      protons: [],
    };
    return [...orbs, newOrb];
  });
  done();
}

function moveOrb(
  reaction: ExtractWithoutType<OrbReaction, "move">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const orb = orbs.find((o) => o.id === reaction.id);

    if (!orb) {
      throw new Error(`Orb not found: ${reaction.id}`);
    }

    logger.log(
      "INFO",
      "moveOrb",
      JSON.stringify({ from: orb.pos, to: reaction.pos }),
    );
    orb.pos = reaction.pos;

    const counter = new DoneCounter(done, 2);

    Animated.timing(orb.animated.x, {
      toValue: PhonePositionHelper.orbPosition(
        reaction.pos.x,
        options.boardSize,
      ),
      duration: Game.animation.orb,
      useNativeDriver: true,
    }).start(counter.done);

    Animated.timing(orb.animated.y, {
      toValue: PhonePositionHelper.orbPosition(
        reaction.pos.y,
        options.boardSize,
      ),
      duration: Game.animation.orb,
      useNativeDriver: true,
    }).start(counter.done);

    return orbs;
  });
}

function deleteOrb(
  reaction: ExtractWithoutType<OrbReaction, "delete">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    logger.log(
      "INFO",
      "deleteOrb",
      reaction.orb.id,
      JSON.stringify(reaction.orb.pos),
    );
    const idx = orbs.findIndex((o) => o.id === reaction.orb.id);
    if (idx === -1) {
      return orbs;
    }
    done();
    return [...orbs.slice(0, idx), ...orbs.slice(idx + 1)];
  });
}

function moveProton(
  reaction: ExtractWithoutType<OrbReaction, "moveProton">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const orb = orbs.find((o) => o.id === reaction.orbId);
    if (!orb) {
      throw new Error(`Orb not found: ${reaction.orbId}`);
    }

    const proton = orb.protons.find((p) => p.id === reaction.protonId);
    if (!proton) {
      throw new Error(`Proton not found: ${reaction.protonId}`);
    }

    const counter = new DoneCounter(done, 2);
    Animated.timing(proton.animated.x, {
      toValue: PhonePositionHelper.protonPosition(reaction.pos.x),
      duration: Game.animation.proton,
      useNativeDriver: true,
    }).start(counter.done);

    Animated.timing(proton.animated.y, {
      toValue: PhonePositionHelper.protonPosition(reaction.pos.y),
      duration: Game.animation.proton,
      useNativeDriver: true,
    }).start(counter.done);

    return orbs;
  });
}

function createProton(
  reaction: ExtractWithoutType<OrbReaction, "createProton">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const orbIdx = orbs.findIndex((o) => o.id === reaction.orbId);
    if (orbIdx === -1) {
      throw new Error(`Orb not found: ${reaction.orbId}`);
    }

    const orb = orbs[orbIdx];

    const newProton: UiProton = {
      id: reaction.protonId,
      animated: {
        x: new Animated.Value(
          PhonePositionHelper.protonPosition(reaction.pos.x),
        ),
        y: new Animated.Value(
          PhonePositionHelper.protonPosition(reaction.pos.y),
        ),
      },
    };
    const protonIdx = orb.protons.findIndex((p) => p.id === reaction.protonId);
    if (protonIdx !== -1) {
      throw new Error(`Proton already exists: ${reaction.protonId}`);
    }

    const updatedOrb: UiOrb = {
      ...orb,
      protons: [
        ...orb.protons.slice(0, protonIdx),
        newProton,
        ...orb.protons.slice(protonIdx),
      ],
    };

    logger.log("INFO", "updatedOrbProtonLength", updatedOrb.protons.length);

    done();
    return [...orbs.slice(0, orbIdx), updatedOrb, ...orbs.slice(orbIdx + 1)];
  });
}

export function useOrbReactionRunner(boardSize: number) {
  const [reactions, setReactions] = useState<OrbReaction[]>([]);
  const [orbs, setOrbs] = useState<UiOrb[]>([]);
  const disabled = reactions.length !== 0;

  const orbsState = useMemo(() => {
    return new OrbsState(boardSize);
  }, [boardSize]);

  useEffect(() => {
    const reactions = orbsState.initialize(initialState);
    setReactions([{ type: "parallel", reactions }]);
  }, [orbsState]);

  useEffect(() => {
    if (reactions.length === 0) return;

    logger.log("INFO", "========================");
    logger.log("INFO", JSON.stringify(reactions, null, 4));
    logger.log("INFO", "========================");
    new SequenceRunner(reactions, { setOrbs, boardSize }).run(() => {
      setReactions([]);
    });
  }, [reactions, setOrbs]);

  return {
    runCommand(command: OrbCommand) {
      if (disabled) return;
      setReactions(orbsState.runCommand(command));
    },
    orbs,
  };
}

export type UiOrb = {
  pos: Position;
  animated: { x: Animated.Value; y: Animated.Value; scale: Animated.Value };
  side: 1 | 2;
  protons: UiProton[];
  id: number;
};

export type UiProton = {
  animated: { x: Animated.Value; y: Animated.Value };
  id: number;
};

function fromString(str: string): OrbsStateInitialization {
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

const initialState: OrbsStateInitialization = fromString(`
  |  |  |▼1|  
  |  |  |▲1|▼1
  |  |▲1|▼4|▲1
  |  |  |▲1|  
  |  |  |  |  
`);

const orbSize = Game.orb.size;
const protonSize = orbSize / Game.orb.protonRatio;

class PhonePositionHelper {
  static protonPosition(pos: number) {
    return Game.orb.size / 2 + protonSize * (pos - 1.5);
  }

  static orbPosition(pos: number, boardSize: number) {
    return (
      (pos - Math.floor(boardSize / 2)) *
        (Game.board.cellSize + Game.board.gap) -
      Game.orb.size / 2
    );
  }
}
