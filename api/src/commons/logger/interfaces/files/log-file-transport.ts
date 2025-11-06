import { LogFormatter } from '../log-entry';

export type FileTransportOptions = {
  dir: string; // dossier des logs
  formatter: LogFormatter; // ex: new PlainFormatter()
  rotateDaily?: boolean; // default: true
  filePrefix?: string; // ex: "app"
};
