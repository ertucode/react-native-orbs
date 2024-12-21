import { Game } from "@/constants/Game";
import { useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

type CellPosition = { x: number; y: number };
export type CellBall = {
  pos: CellPosition;
  animated: { x: Animated.Value; y: Animated.Value; scale: Animated.Value };
  side: 1 | 2;
  balls: CellBallBall[];
};

export type CellBallBall = {
  pos: { x: number; y: number };
  animated: { x: Animated.Value; y: Animated.Value };
  id: number;
};

const initialState = {
  side1: { x: 2, y: 2 },
  side2: { x: 1, y: 3 },
};
export function Balls({ boardSize }: { boardSize: number }) {
  const [balls, setBalls] = useState<CellBall[]>([
    createCellBall(
      initialState.side1,
      1,
      createCellBallBalls(initialState.side1, 1),
      boardSize,
    ),
    createCellBall(
      initialState.side2,
      2,
      createCellBallBalls(initialState.side2, 3),
      boardSize,
    ),
  ]);

  return (
    <View style={styles.container}>
      {balls.map((ball) => {
        return (
          <Animated.View
            key={`${ball.pos.x}-${ball.pos.y}`}
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
function createCellBallBalls(
  pos: CellPosition,
  count: 1 | 2 | 3 | 4,
): CellBallBall[] {
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

  if (count === 1) {
    return [createCellBallBall(pos, { x: 1, y: 1 })];
  }
  if (count === 2) {
    return [
      createCellBallBall(pos, { x: 1, y: 0 }),
      createCellBallBall(pos, { x: 1, y: 2 }),
    ];
  }
  if (count === 3) {
    return [
      createCellBallBall(pos, { x: 0, y: 0 }),
      createCellBallBall(pos, { x: 0, y: 2 }),
      createCellBallBall(pos, { x: 2, y: 1 }),
    ];
  }
  if (count === 4) {
    return [
      createCellBallBall(pos, { x: 0, y: 0 }),
      createCellBallBall(pos, { x: 0, y: 2 }),
      createCellBallBall(pos, { x: 2, y: 0 }),
      createCellBallBall(pos, { x: 2, y: 2 }),
    ];
  }

  throw new Error(`Invalid count: ${count}`);
}

function createCellBallBall(
  pos: CellPosition,
  ballBallLocation: CellPosition,
): CellBallBall {
  return {
    id: Math.random(),
    pos,
    animated: {
      x: new Animated.Value(cellBallBallPositionInPhone(ballBallLocation.x)),
      y: new Animated.Value(cellBallBallPositionInPhone(ballBallLocation.y)),
    },
  };
}

function cellBallBallPositionInPhone(posCellBallBall: number) {
  return Game.ball.size / 2 + ballBallSize * (posCellBallBall - 1.5);
}

function cellBallPositionInPhone(pos: number, boardSize: number) {
  return (
    (pos - Math.floor(boardSize / 2)) * (Game.board.cellSize + Game.board.gap) -
    Game.ball.size / 2
  );
}

const ballSize = Game.ball.size;
const ballBallSize = ballSize / Game.ball.ballRatio;
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
  },
});
