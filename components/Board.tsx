import { Game } from "@/constants/Game";
import { useOrbReactionRunnerContext } from "@/lib/useOrbReactionRunner";
import { Pressable, StyleSheet, View } from "react-native";

export function Board() {
  const { boardSize: size, onBoardPress } = useOrbReactionRunnerContext();
  console.warn("BOARD");

  return (
    <View
      style={[
        styles.board,
        {
          width: size * cellSize + gap * (size - 1) + padding * 2,
          height: size * cellSize + gap * (size - 1) + padding * 2,
        },
      ]}
    >
      {Array.from({ length: size }).map((_, i) => (
        <View key={i} style={[styles.row]}>
          {Array.from({ length: size }).map((_, j) => (
            <Pressable
              onPress={() => onBoardPress(i, j)}
              style={[styles.cell]}
              key={j}
            ></Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const gap = Game.board.gap;
const cellSize = Game.board.cellSize;
const padding = Game.board.padding;
const borderRadius = Game.board.borderRadius;
const styles = StyleSheet.create({
  board: {
    backgroundColor: "blue",
    flexDirection: "column",
    position: "absolute",
    gap: gap,
    padding,
    borderRadius,
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderRadius,
    backgroundColor: "white",
  },
  row: {
    flexDirection: "row",
    gap: gap,
    height: cellSize,
    width: "100%",
    backgroundColor: "blue",
  },
});
