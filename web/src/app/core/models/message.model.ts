// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Message<T = any> {
  message: string;
  data: T;
}
