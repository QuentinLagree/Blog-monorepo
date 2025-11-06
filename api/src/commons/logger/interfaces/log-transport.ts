import { LogEntry } from '../types/log-entry';

export interface LogTransport {
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}
