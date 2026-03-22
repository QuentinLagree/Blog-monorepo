import { MarkdownSyntax } from "./markdownOptions.interface";

export interface ContextMenuItem<T = unknown> {
  item: MarkdownSyntax 

  action: (ctx: T, event?: MouseEvent) => void | Promise<void>;
}