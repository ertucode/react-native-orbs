import { OrbsState } from "../OrbState";
import { orbStateFromString } from "../orbStateInitialization";

describe("OrbState", () => {
  it("merge", () => {
    const state = new OrbsState(5);

    state.initialize(
      orbStateFromString(`
  |  |  |  |  
  |  |  |▲1|  
  |  |  |▼4|  
  |  |  |  |  
  |  |  |  |
`),
    );

    console.log(state.getOrbsAsString(true));
    const reactions = state.runCommand({
      type: "increment",
      to: 5,
      id: state.orbs.find((o) => o.pos.x === 2 && o.pos.y === 3)!.id,
    });

    console.log(JSON.stringify(reactions, null, 4));
  });
});
