export type ExtractWithoutType<
  T extends { type: string },
  TTYpe extends T["type"],
> = Omit<Extract<T, { type: TTYpe }>, "type">;

export type ExtractWithType<
  T extends { type: string },
  TTYpe extends T["type"],
> = Extract<T, { type: TTYpe }>;

export type Callback = () => void;
