import { FormControl } from "@angular/forms";
import { TextAreaComponent } from "src/app/shared/ui/form/text-area/text-area";
import { ImageEditorService } from "./image-editor.service";
import { MarkdownEditorService } from "./markdow.service";
import { ToastService } from "../toasts/toaster.service";
import { inject, Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class PostEditorImageService {
  private imageEditor = inject(ImageEditorService);
  private markdown = inject(MarkdownEditorService);
  private toast = inject(ToastService);

  private relinkTargetId: string | null = null;

  pickImage(
  event: Event,
  editor: TextAreaComponent,
  control: FormControl<string | null>
): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  input.value = '';

  const syntax = this.imageEditor.createLocalImageSyntax(file);

  this.markdown.insertAtCursor(syntax, editor, control);
}

  handlePreviewClick(
    event: MouseEvent,
    picker?: HTMLInputElement
  ): void {
    const id = this.getLocalImageIdFromEvent(event);

    if (!id) return;

    this.relinkTargetId = id;
    picker?.click();
  }

  relinkPicked(
    event: Event,
    control: FormControl<string | null>
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.relinkTargetId) return;

    input.value = '';

    const blobUrl = URL.createObjectURL(file);

    this.imageEditor.addLocalImage(this.relinkTargetId, blobUrl);

    control.setValue(control.value ?? '');

    this.toast.success('Image re-liée ✅', { duration: 1500 });

    this.relinkTargetId = null;
  }

  clear(): void {
    this.imageEditor.clearLocalImages();
  }

  private getLocalImageIdFromEvent(event: MouseEvent): string | null {
    const target = event.target as HTMLElement | null;

    if (!target || target.tagName.toLowerCase() !== 'img') return null;

    const title = (target as HTMLImageElement).getAttribute('title') ?? '';

    if (!title.startsWith('localimg:')) return null;

    return title.slice('localimg:'.length) || null;
  }
}