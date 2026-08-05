export type TableOfContentsItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

export type ReadingStatus = {
  hasStarted: boolean;
  completed: boolean;
  progress: number;
};
