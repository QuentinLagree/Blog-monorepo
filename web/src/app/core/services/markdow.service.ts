import { inject, Injectable } from "@angular/core";
import { PrismHighlightService } from "./prism-highlight.service";
import { TextAreaComponent } from "src/app/shared/ui/form/text-area/text-area";
import { FormControl } from "@angular/forms";
import { MarkdownSyntax } from "src/app/shared/ui/context-menu/types/markdownOptions.interface";
import { MarkdownSyntaxOptions } from "src/app/shared/ui/context-menu/config/context-menu-options";

@Injectable({ providedIn: 'root' })
export class MarkdownEditorService {
    private prism = inject(PrismHighlightService);

    refreshPreview(element?: HTMLElement): void {
        this.prism.highlightPreview(element);
    }

    insertAtCursor(
        text: string,
        editor: TextAreaComponent,
        control: FormControl<string | null>
    ): void {
        const editorEl = editor.getElement()?.nativeElement as
            | HTMLTextAreaElement
            | undefined;

        if (!editorEl) return;

        const start = editorEl.selectionStart ?? editorEl.value.length;
        const end = editorEl.selectionEnd ?? editorEl.value.length;
        const current = control.value ?? '';

        control.setValue(
            current.slice(0, start) + text + current.slice(end)
        );

        control.markAsDirty();

        queueMicrotask(() => {
            editorEl.focus();

            const cursorPosition = start + text.length;
            editorEl.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    createMissingImagePlaceholder(id: string): string {
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="220">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <rect x="24" y="24" width="752" height="172" rx="14" fill="#ffffff" stroke="#d1d5db"/>
  <text x="50%" y="48%" text-anchor="middle" font-size="20" fill="#111827" font-family="Arial, sans-serif">
    Image manquante
  </text>
  <text x="50%" y="62%" text-anchor="middle" font-size="14" fill="#6b7280" font-family="Arial, sans-serif">
    Cliquez pour re-sélectionner (id: ${id})
  </text>
</svg>`.trim();

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

    applySyntax(name: string, editor: TextAreaComponent): void {
  const item: MarkdownSyntax | undefined = MarkdownSyntaxOptions.find(
    syntax => syntax.name === name
  );

  if (!item) {
    throw new Error(`Syntax name : '${name}' doesn't exist!`);
  }

  editor.applySyntax(item);
}

handleTabPress(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;

  event.preventDefault();

  const textarea = event.target as HTMLTextAreaElement;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  textarea.value =
    textarea.value.slice(0, start) + '\t' + textarea.value.slice(end);

  textarea.selectionStart = textarea.selectionEnd = start + 1;
}

syncScroll(
  editorScrollTop: number,
  editor: TextAreaComponent,
  preview?: HTMLElement
): void {
  const editorEl = editor.getElement()?.nativeElement;

  if (!editorEl || !preview) return;

  const editorMax = editorEl.scrollHeight - editorEl.clientHeight;
  if (editorMax <= 0) return;

  const previewMax = preview.scrollHeight - preview.clientHeight;
  const ratio = editorScrollTop / editorMax;

  preview.scrollTop = ratio * previewMax;
}
    
}