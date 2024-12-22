import { Balls } from "@/components/Balls";
import { Board } from "@/components/Board";
import { AnimationCountProvider } from "@/hooks/useAnimationCount";
import React from "react";
import { View, StyleSheet } from "react-native";

const App = () => {
  const boardSize = 5;
  return (
    <View style={styles.container}>
      <AnimationCountProvider>
        <Board size={boardSize} />
        <Balls boardSize={boardSize} />
      </AnimationCountProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
