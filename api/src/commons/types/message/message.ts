export type Message<T = any> = {
  log?: string;
  message: string;
  data: T;
};
