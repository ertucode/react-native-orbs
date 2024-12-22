export type ExtractWithoutType<
  T extends { type: string },
  TTYpe extends T["type"],
> = Omit<Extract<T, { type: TTYpe }>, "type">;

export type Callback = () => void;
