import { createContext, useContext, useState } from "react";

export type IAnimationCountContext = {
  count: number;
  onStart: () => void;
  onEnd: () => void;
  loading: boolean;
};
const AnimationCountContext = createContext<IAnimationCountContext>(
  undefined as any,
);

export function useAnimationCount() {
  const context = useContext(AnimationCountContext);
  if (context === undefined) {
    throw new Error(
      "useAnimationCount must be used within a AnimationCountProvider",
    );
  }
  return context;
}

export function AnimationCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);

  return (
    <AnimationCountContext.Provider
      value={{
        count,
        onStart: () => setCount((prevCount) => prevCount + 1),
        onEnd: () => setCount((prevCount) => prevCount - 1),
        loading: count > 0,
      }}
    >
      {children}
    </AnimationCountContext.Provider>
  );
}
