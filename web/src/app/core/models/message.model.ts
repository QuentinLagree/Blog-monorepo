// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Message<T = any, K = any> {
  message: string;
  data: T;
  meta: K
}
