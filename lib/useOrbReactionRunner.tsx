import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { OrbCommand, OrbReaction, OrbsState, Position, Side } from "./OrbState";
import { Animated } from "react-native";
import { Callback, ExtractWithoutType, ExtractWithType } from "./typeUtils";
import { Game } from "@/constants/Game";
import { DoneCounter } from "./DoneCounter";
import { logger } from "./logger";
import { orbStateFromString } from "./orbStateInitialization";

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
  throwError: (reaction: OrbReaction | "none", err: string) => void;
};

function runReaction(
  reaction: OrbReaction,
  done: Callback,
  options: RunReactionOptions,
) {
  logger.log("INFO:APPLY", reaction.type);
  switch (reaction.type) {
    case "finishGame":
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
    case "sleep":
      return sleep(reaction, done);
    default:
      options.throwError("none", `Invalid reaction: ${reaction}`);
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
    done();
    return [...orbs, newOrb];
  });
}

function moveOrb(
  reaction: ExtractWithType<OrbReaction, "move">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const orb = orbs.find((o) => o.id === reaction.orbId);

    if (!orb) {
      options.throwError(
        reaction,
        `Orb not found: ${reaction.orbId}, orbs: [${orbs.map((o) => o.id).join(", ")}]`,
      );
      return orbs;
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
    /* console.log("deleteOrb", {
      idx,
      id: reaction.orb.id,
      start: JSON.stringify(orbs.map((o) => o.id)),
      end: [...orbs.slice(0, idx), ...orbs.slice(idx + 1)].map((o) => o.id),
    }); */
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
      done();
      return orbs;
    }

    const proton = orb.protons.find((p) => p.id === reaction.protonId);
    if (!proton) {
      done();
      return orbs;
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
  reaction: ExtractWithType<OrbReaction, "createProton">,
  options: RunReactionOptions,
  done: Callback,
) {
  options.setOrbs((orbs) => {
    const orbIdx = orbs.findIndex((o) => o.id === reaction.orbId);
    if (orbIdx === -1) {
      options.throwError(reaction, `Orb not found: ${reaction.orbId}`);
      return orbs;
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
      options.throwError(
        reaction,
        `Proton already exists: ${reaction.protonId}`,
      );
      return orbs;
    }

    const updatedOrb: UiOrb = {
      ...orb,
      protons: [
        ...orb.protons.slice(0, protonIdx),
        newProton,
        ...orb.protons.slice(protonIdx),
      ],
    };

    logger.log("INFO:APPLY:DONE", "createProton");
    done();
    return [...orbs.slice(0, orbIdx), updatedOrb, ...orbs.slice(orbIdx + 1)];
  });
}

function sleep(
  reaction: ExtractWithoutType<OrbReaction, "sleep">,
  done: Callback,
) {
  setTimeout(done, reaction.ms);
}

export function useOrbReactionRunnerContext() {
  return useContext(OrbReactionRunnerContext);
}

export type IOrbReactionRunnerContext = {
  runCommand(command: OrbCommand): void;
  orbs: UiOrb[];
  restart(): void;
  boardSize: number;
  onBoardPress(i: number, j: number): void;
};
export const OrbReactionRunnerContext =
  createContext<IOrbReactionRunnerContext>(undefined as any);

export const OrbReactionRunnerContextProvider = ({
  boardSize,
  children,
}: {
  boardSize: number;
  children: React.ReactNode;
}) => {
  const [reactions, setReactions] = useState<OrbReaction[]>([]);
  const [orbs, setOrbs] = useState<UiOrb[]>([]);
  const disabled = reactions.length !== 0;
  const [gameId, setGameId] = useState(0);
  const [currentSide, setCurrentSide] = useState<Side>(1);

  const orbsState = useMemo(() => {
    // BROKEN???
    return OrbsState.createCached(boardSize, gameId);
  }, [boardSize, gameId]);

  useEffect(() => {
    restart();
    const reactions = orbsState.initialize(
      orbStateFromString(Game.initialOrbs),
    );
    setReactions([{ id: -1, type: "parallel", reactions }]);
  }, [orbsState]);

  useEffect(() => {
    if (reactions.length === 0) return;

    logger.log("INFO", "========================");
    logger.log("INFO:REACTIONS", reactions);
    logger.log("INFO", "========================");
    new SequenceRunner(reactions, {
      setOrbs,
      boardSize,
      throwError: (reaction, err) => {
        logger.log(
          "ORBS:ERROR",
          reaction,
          orbsState.getOrbsAsString(true),
          `orbs: [${orbs.map((o) => o.id).join(", ")}] [${orbsState.orbs.map((o) => o.id).join(", ")}]`,
        );
        // console.error(err);

        throw new Error(err);
      },
    }).run(() => {
      logger.log("INFO:APPLY", "ran reactions");
      setOrbs((orbs) => {
        console.log(
          `orbs: [${orbs.map((o) => o.id).join(", ")}] [${orbsState.orbs.map((o) => o.id).join(", ")}]`,
        );
        return orbs;
      });
      setReactions([]);
    });
  }, [reactions, setOrbs]);

  function runCommand(command: OrbCommand) {
    if (disabled) return;
    setReactions(orbsState.runCommand(command, currentSide));
  }
  function restart() {
    if (disabled) return;
    setReactions([]);
    setOrbs([]);
    setGameId((g) => g + 1);
    setCurrentSide(1);
  }
  const value: IOrbReactionRunnerContext = {
    runCommand,
    orbs,
    restart,
    boardSize,
    onBoardPress(i, j) {
      if (disabled) return;

      logger.log("INFO:INTERACTION", "onBoardPress", {
        x: i,
        y: j,
        side: currentSide,
      });
      const orb = orbs.find((o) => o.pos.x === i && o.pos.y === j);

      if (orb) {
        if (orb.side !== currentSide) return;
        runCommand({
          type: "increment",
          id: orb.id,
          to: orb.protons.length + 1,
        });
      } else {
        runCommand({
          type: "create",
          pos: { x: i, y: j },
          side: currentSide,
          count: 1,
        });
      }
      setCurrentSide((s) => (s === 1 ? 2 : 1));
    },
  };
  return (
    <OrbReactionRunnerContext.Provider value={value}>
      {children}
    </OrbReactionRunnerContext.Provider>
  );
};

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
