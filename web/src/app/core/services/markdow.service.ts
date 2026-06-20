import { inject, Injectable } from "@angular/core";
import { PrismHighlightService } from "./prism-highlight.service";
import { TextAreaComponent } from "src/app/shared/ui/form/text-area/text-area";
import { FormControl } from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class MarkdownFeaturesService {
    private _prism: PrismHighlightService = inject(PrismHighlightService)
    refreshPreview(element: HTMLElement | undefined) {
        this._prism.highlightPreview(element)
    }

    escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    insertAtCursor(text: string, editor: TextAreaComponent, input: FormControl): void {
        const elRef = editor.getElement();
        const editorEl = elRef?.nativeElement as HTMLTextAreaElement | undefined;

        if (!editorEl) return;

        const start = editorEl.selectionStart ?? editorEl.value.length;
        const end = editorEl.selectionEnd ?? editorEl.value.length;

        const current = input.value ?? '';
        const next = current.slice(0, start) + text + current.slice(end);

        input.setValue(next);
        input.markAsDirty();

        queueMicrotask(() => {
            editorEl.focus();

            const position = start + text.length;

            editorEl.setSelectionRange(position, position);
        });
    }

    placeholderSrc(id: string): string {
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
}