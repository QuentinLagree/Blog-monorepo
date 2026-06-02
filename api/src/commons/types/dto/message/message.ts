export type Message<T = any, K = any> = {
  log?: string;
  message: string;
  data: T;
  meta?: K;
};
