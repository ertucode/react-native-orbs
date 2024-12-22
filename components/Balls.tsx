import { Game } from "@/constants/Game";
import {
  IAnimationCountContext,
  useAnimationCount,
} from "@/hooks/useAnimationCount";
import { useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

type CellPosition = { x: number; y: number };
export type CellBall = {
  pos: CellPosition;
  animated: { x: Animated.Value; y: Animated.Value; scale: Animated.Value };
  side: 1 | 2;
  balls: CellBallBall[];
  id: number;
};

export type CellBallBall = {
  animated: { x: Animated.Value; y: Animated.Value };
  id: number;
};

const initialState = {
  side1: { x: 2, y: 2 },
  side2: { x: 1, y: 3 },
};
export function Balls({ boardSize }: { boardSize: number }) {
  const [balls, setBalls] = useState<CellBall[]>([
    createCellBall(initialState.side1, 1, createCellBallBalls(2), boardSize),
    createCellBall(initialState.side2, 2, createCellBallBalls(3), boardSize),
  ]);

  const anims = useAnimationCount();

  function onBallPress(idx: number) {
    const ball = balls[idx];

    const currentCount = ball.balls.length;

    if (currentCount === 4) {
      function onEnd() {
        if (anims.loading) return;

        for (const [firstIdx, firstBall] of balls.entries()) {
          for (const [secondIdx, secondBall] of balls.entries()) {
          }
        }
      }

      setBalls((prevBalls) => {
        prevBalls.splice(idx, 1);
        const neighbors = getNeighbors(ball.pos, boardSize);
        const newBalls = neighbors.map((pos) => {
          return createCellBallFromTo(
            ball.pos,
            pos,
            ball.side,
            createCellBallBalls(1),
            boardSize,
            anims,
            onEnd,
          );
        });
        return [...prevBalls, ...newBalls];
      });
      return;
    } else {
      const newBalls = incrementBallCount(ball.balls, currentCount + 1);
      setBalls((prevBalls) => {
        return [
          ...prevBalls.slice(0, idx),
          { ...ball, balls: newBalls },
          ...prevBalls.slice(idx + 1),
        ];
      });
    }
  }

  return (
    <View style={styles.container}>
      {balls.map((ball, idx) => {
        return (
          <Pressable
            key={`${ball.pos.x}-${ball.pos.y}-${ball.side}`}
            onPress={() => onBallPress(idx)}
          >
            <Animated.View
              style={[
                styles.ball,
                {
                  transform: [
                    { translateX: ball.animated.y },
                    { translateY: ball.animated.x },
                    { scale: ball.animated.scale },
                  ],
                },
                ball.side === 1 ? styles.side1 : styles.side2,
              ]}
            >
              {ball.balls.map((ballBall) => {
                return (
                  <Animated.View
                    key={ballBall.id}
                    style={[
                      styles.ballBall,
                      {
                        transform: [
                          { translateX: ballBall.animated.y },
                          { translateY: ballBall.animated.x },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createCellBall(
  pos: CellPosition,
  side: 1 | 2,
  balls: CellBallBall[],
  boardSize: number,
): CellBall {
  return {
    id: Math.random(),
    pos,
    animated: {
      x: new Animated.Value(cellBallPositionInPhone(pos.x, boardSize)),
      y: new Animated.Value(cellBallPositionInPhone(pos.y, boardSize)),
      scale: new Animated.Value(1),
    },
    side,
    balls,
  };
}

/* type AnimationMetadata =
  | {
      type: "split";
      killPos: CellPosition;
      neighbors: CellPosition[];
    }
  | {
      type: "merge";
      pairs: { prevId: number; nextId: number }[];
    };

// Burası çağırılıyorsa count 4 olmak zorunda
function resolveAnimationsToRun(
  balls: CellBall[],
  idx: number,
  boardSize: number,
) {
  const animations: AnimationMetadata[] = [];
  const ball = balls[idx];
  const neighbors = getNeighbors(ball.pos, boardSize);

  animations.push({
    type: "split",
    killPos: ball.pos,
    neighbors,
  });

  return animations;
}

function simulateAnimation(balls: CellBall[], animation: AnimationMetadata, boardSize: number) {
  if (animation.type === "split") {
    const { killPos, neighbors } = animation;
    const newBalls = neighbors.map((pos) => {
      return createCellBallFromTo(
        killPos,
        pos,
        balls[killPos.x].side,
        createCellBallBalls(1),
        boardSize,
        anims,
      );
    });
    return [...balls, ...newBalls];
  } else if (animation.type === "merge") {
    const { pairs } = animation;
    const newBalls = pairs.map(({ prevId, nextId }) => {
      return {
        ...balls[prevId],
        balls: balls[prevId].balls.concat(balls[nextId].balls),
      };
    });
    return newBalls;
  }
  return balls
} */

function createCellBallFromTo(
  from: CellPosition,
  to: CellPosition,
  side: 1 | 2,
  balls: CellBallBall[],
  boardSize: number,
  anims: IAnimationCountContext,
  onEnd: () => void,
): CellBall {
  const ball: CellBall = {
    id: Math.random(),
    pos: to,
    animated: {
      x: new Animated.Value(cellBallPositionInPhone(from.x, boardSize)),
      y: new Animated.Value(cellBallPositionInPhone(from.y, boardSize)),
      scale: new Animated.Value(1),
    },
    side,
    balls,
  };

  const end = () => {
    // Bunlarin sirasi onemli
    anims.onEnd();
    onEnd();
  };

  setTimeout(() => {
    anims.onStart();
    Animated.timing(ball.animated.x, {
      toValue: cellBallPositionInPhone(to.x, boardSize),
      duration: Game.animation.orb,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(end);
    anims.onStart();
    Animated.timing(ball.animated.y, {
      toValue: cellBallPositionInPhone(to.y, boardSize),
      duration: Game.animation.orb,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(end);
  }, 0);

  return ball;
}

/*
 * ___
 * _1_
 * ___
 *
 * ___
 * 2_2
 * ___
 *
 * 3_3
 * ___
 * _3_
 *
 * 4-4
 * ___
 * 4_4
 * */
function createCellBallBalls(count: 1 | 2 | 3 | 4): CellBallBall[] {
  /* return [
    createCellBallBall(pos, { x: 0, y: 0 }),
    createCellBallBall(pos, { x: 1, y: 0 }),
    createCellBallBall(pos, { x: 2, y: 0 }),
    createCellBallBall(pos, { x: 0, y: 1 }),
    createCellBallBall(pos, { x: 1, y: 1 }),
    createCellBallBall(pos, { x: 2, y: 1 }),
    createCellBallBall(pos, { x: 0, y: 2 }),
    createCellBallBall(pos, { x: 1, y: 2 }),
    createCellBallBall(pos, { x: 2, y: 2 }),
  ]; */

  const positions = cellBallBallPositions(count);

  return positions.map((p) => createCellBallBall(p));
}

function cellBallBallPositions(count: number) {
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

function incrementBallCount(balls: CellBallBall[], to: number) {
  if (to === 2) {
    const positions = cellBallBallPositions(2);
    animateBallBall(balls[0], positions[0]);
    return [balls[0], createCellBallBall(positions[1])];
  }

  if (to === 3) {
    const positions = cellBallBallPositions(3);
    animateBallBall(balls[0], positions[0]);
    animateBallBall(balls[1], positions[1]);
    return [balls[0], balls[1], createCellBallBall(positions[2])];
  }

  if (to === 4) {
    const positions = cellBallBallPositions(4);
    animateBallBall(balls[0], positions[0]);
    animateBallBall(balls[1], positions[1]);
    animateBallBall(balls[2], positions[2]);
    return [balls[0], balls[1], balls[2], createCellBallBall(positions[3])];
  }

  throw new Error(`Invalid count: ${to}`);
}

function animateBallBall(ball: CellBallBall, pos: CellPosition) {
  Animated.timing(ball.animated.x, {
    toValue: cellBallBallPositionInPhone(pos.x),
    duration: Game.animation.proton,
    useNativeDriver: true,
    easing: Easing.linear,
  }).start();
  Animated.timing(ball.animated.y, {
    toValue: cellBallBallPositionInPhone(pos.y),
    duration: Game.animation.proton,
    useNativeDriver: true,
    easing: Easing.linear,
  }).start();
}

function createCellBallBall(ballBallLocation: CellPosition): CellBallBall {
  const ball: CellBallBall = {
    id: Math.random(),
    animated: {
      x: new Animated.Value(cellBallBallPositionInPhone(1)),
      y: new Animated.Value(cellBallBallPositionInPhone(1)),
    },
  };
  setTimeout(() => {
    animateBallBall(ball, ballBallLocation);
  }, 0);
  return ball;
}

function cellBallBallPositionInPhone(posCellBallBall: number) {
  return Game.orb.size / 2 + ballBallSize * (posCellBallBall - 1.5);
}

function cellBallPositionInPhone(pos: number, boardSize: number) {
  return (
    (pos - Math.floor(boardSize / 2)) * (Game.board.cellSize + Game.board.gap) -
    Game.orb.size / 2
  );
}

function getNeighbors(pos: CellPosition, boardSize: number) {
  const neighbors: CellPosition[] = [];

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

const ballSize = Game.orb.size;
const ballBallSize = ballSize / Game.orb.protonRatio;
const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  side1: {
    backgroundColor: "red",
  },
  side2: {
    backgroundColor: "blue",
  },
  ball: {
    width: ballSize,
    height: ballSize,
    borderRadius: ballSize / 2,
    position: "absolute",
  },
  ballBall: {
    width: ballBallSize,
    height: ballBallSize,
    borderRadius: ballBallSize / 2,
    position: "absolute",
    backgroundColor: "white",
    pointerEvents: "none",
  },
});
