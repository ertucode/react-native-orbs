import { Balls } from "@/components/Balls";
import { Board } from "@/components/Board";
import React from "react";
import { View, StyleSheet } from "react-native";

const App = () => {
  const boardSize = 5;
  return (
    <View style={styles.container}>
      <Board size={boardSize} />
      <Balls boardSize={boardSize} />
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
