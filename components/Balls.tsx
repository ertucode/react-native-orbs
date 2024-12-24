import { Game } from "@/constants/Game";
import { useOrbReactionRunnerContext } from "@/lib/useOrbReactionRunner";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native";

export function Balls() {
  const { orbs, restart } = useOrbReactionRunnerContext();
  console.warn("BALLS");

  return (
    <View style={styles.container}>
      {orbs.map((orb) => {
        return (
          <Animated.View
            key={orb.id}
            style={[
              styles.orb,
              {
                transform: [
                  { translateX: orb.animated.y },
                  { translateY: orb.animated.x },
                  { scale: orb.animated.scale },
                ],
              },
              orb.side === 1 ? styles.side1 : styles.side2,
            ]}
          >
            {orb.protons.map((proton) => {
              return (
                <Animated.View
                  key={proton.id}
                  style={[
                    styles.proton,
                    {
                      transform: [
                        { translateX: proton.animated.y },
                        { translateY: proton.animated.x },
                      ],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
        );
      })}
      <Pressable style={styles.button} onPress={() => restart()}>
        <Text style={styles.buttonText}>Restart</Text>
      </Pressable>
    </View>
  );
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
  orb: {
    width: ballSize,
    height: ballSize,
    borderRadius: ballSize / 2,
    position: "absolute",
    pointerEvents: "none",
  },
  proton: {
    width: ballBallSize,
    height: ballBallSize,
    borderRadius: ballBallSize / 2,
    position: "absolute",
    backgroundColor: "white",
    pointerEvents: "none",
  },
  button: {
    width: 100,
    height: 30,
    backgroundColor: "red",
    position: "absolute",
    bottom: -200,
    left: -50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});
