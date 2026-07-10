import { inject, Injectable } from '@angular/core';
import { LocalImageStore } from 'src/app/shared/services/storage.image';
import { MarkdownEditorService } from './markdow.service';

@Injectable({
  providedIn: 'root',
})
export class ImageEditorService {
  private readonly localImages = inject(LocalImageStore);
  private readonly markdown = inject(MarkdownEditorService);

  createLocalImageSyntax(file: File): string {
    const id = this.generateImageId();
    const blobUrl = URL.createObjectURL(file);
    const alt = this.getAltFromFilename(file.name);

    this.localImages.add(id, blobUrl);

    return `\n![${alt}](localimg:${id})\n`;
  }

  addLocalImage(id: string, blobUrl: string): void {
    this.localImages.add(id, blobUrl);
  }

  clearLocalImages(): void {
    this.localImages.revokeAll?.();
  }

  resolveLocalImages(markdown: string): string {
    return markdown.replace(
      /!\[([^\]]*)\]\(localimg:([a-zA-Z0-9_-]+)\)/g,
      (_match, alt, id) => this.createImageHtml(String(alt), String(id))
    );
  }

  private createImageHtml(alt: string, id: string): string {
    const src = this.localImages.get(id) || this.markdown.createMissingImagePlaceholder(id);

    return `<img src="${this.markdown.escapeHtml(src)}" alt="${this.markdown.escapeHtml(alt || 'image')}" title="localimg:${this.markdown.escapeHtml(id)}" style="cursor:pointer" />`;
  }

  private getAltFromFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
  }

  private generateImageId(): string {
    return `li_${crypto.randomUUID()}`;
  }
}