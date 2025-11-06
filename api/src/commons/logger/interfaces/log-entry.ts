import { LogEntry } from '../types/log-entry';

export interface LogFormatter {
  format(entry: LogEntry): string;
  fileExtension?: string; // pour les transports qui créent des fichiers
}
