import { Callback } from "./typeUtils";

export class DoneCounter {
  private count = 0;
  constructor(
    private onDone: Callback,
    private finishCount: number,
  ) {}

  done = () => {
    this.count++;
    if (this.count === this.finishCount) {
      this.onDone();
    }
  };
}
