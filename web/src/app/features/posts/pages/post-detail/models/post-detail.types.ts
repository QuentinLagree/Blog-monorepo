export interface TableOfContentsItem {
  id: string;
  label: string;
  level: 2 | 3;
}

export interface ReadingStatus {
  hasStarted: boolean;
  completed: boolean;
  progress: number;
}
