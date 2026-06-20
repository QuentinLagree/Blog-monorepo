import { inject, Injectable } from "@angular/core";
import { LocalImageStore } from "src/app/shared/services/storage.image";
import { MarkdownFeaturesService } from "./markdow.service";

@Injectable({
    providedIn: 'root'
})

export class ImageEditorService {

    private localImages = inject(LocalImageStore);
    private _markdown = inject(MarkdownFeaturesService);

    getBlobWithId(id: string): string {
        return this.localImages.get(id) ?? ''
    }

    addLocalImage(id: string, blobUrl: string) {
        this.localImages.add(id, blobUrl)
    }
    
    clearLocalImages() {
        this.localImages.revokeAll?.();
    }


    getImageSyntaxPosition(event: Event): string {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return '';

    input.value = '';

    const id = this.generateImageUUID();
    const blobUrl = URL.createObjectURL(file);

    this.localImages.add(id, blobUrl);

    const alt = file.name.replace(/\.[^/.]+$/, '');

    return `\n![${alt}](localimg:${id})\n`;
  }

  private generateImageUUID(): string {
    return (
      'li_' +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36)
    );
  }

  resolveLocalImages(markdown: string): string {
    return markdown.replace(
      /!\[([^\]]*)\]\(localimg:([a-zA-Z0-9_\-]+)\)/g,
      (_match, alt, id) => {
        const blob = this.getBlobWithId(id);
        const src = blob ?? this._markdown.placeholderSrc(id);

        const safeAlt = this._markdown.escapeHtml(String(alt ?? 'image'));
        const safeId = this._markdown.escapeHtml(String(id));
        const safeSrc = this._markdown.escapeHtml(String(src));

        return `<img src="${safeSrc}" alt="${safeAlt}" title="localimg:${safeId}" style="cursor:pointer" />`;
      }
    );
  }

}