import { LogLevel } from './log-level.enum';

export type LogEntry = {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
};
