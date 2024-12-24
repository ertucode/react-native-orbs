import { Balls } from "@/components/Balls";
import { Board } from "@/components/Board";
import { OrbReactionRunnerContextProvider } from "@/lib/useOrbReactionRunner";
import React from "react";
import { View, StyleSheet } from "react-native";

const App = () => {
  const boardSize = 5;
  return (
    <View key={2} style={styles.container}>
      <OrbReactionRunnerContextProvider boardSize={boardSize}>
        <Board />
        <Balls />
      </OrbReactionRunnerContextProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
