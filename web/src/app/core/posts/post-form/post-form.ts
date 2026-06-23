import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  InputSignal,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, throttleTime } from 'rxjs';

import { generateSyntaxList } from '@src/app/shared/helpers/markdown/markdown.helper';
import { MarkdownSyntaxOptions } from '@src/app/shared/ui/context-menu/config/context-menu-options';
import { ContextMenuTriggerDirective } from '@src/app/shared/ui/context-menu/context-menu.directive';
import { MarkdownSyntax } from '@src/app/shared/ui/context-menu/types/markdownOptions.interface';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { InputComponent } from '@src/app/shared/ui/form/inputs/input/input';
import { TextInputValidatorFactory } from '@src/app/shared/ui/form/inputs/input/validators/input-text-validator.factory';
import { TextAreaComponent } from '@src/app/shared/ui/form/text-area/text-area';
import { MarkdownComponent } from 'ngx-markdown';

import { Post, PostService, UpdatedPost } from '../../services/post.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../toasts/toaster.service';

import { ImageEditorService } from '../../services/image-editor.service';
import { MarkdownFeaturesService } from '../../services/markdow.service';
import { PostDraftStorage } from './post-draft.storage';

@Component({
  selector: 'app-form-post',
  templateUrl: './post-form.html',
  styleUrls: ['./fullscreen-editor.scss'],
  imports: [
    ReactiveFormsModule,
    InputComponent,
    TextAreaComponent,
    MarkdownComponent,
    ContextMenuTriggerDirective,
    BaseButtonComponent
],
})
export class PostFormComponent implements AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private session = inject(SessionService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private image_editor = inject(ImageEditorService)
  private _markdown = inject(MarkdownFeaturesService)
  

  private readonly ACTION_COOLDOWN_MS = 60000;

  @ViewChild('markdownEditor') markdownEditorElement!: TextAreaComponent;
  @ViewChild('preview', { static: false }) preview?: ElementRef<HTMLElement>;

  @ViewChild('relinkPicker') relinkPicker?: ElementRef<HTMLInputElement>;
  private relinkTargetId: string | null = null;

  post: InputSignal<Post | undefined> = input();

  resolvedMarkdown = signal<string>('');
  loading: WritableSignal<boolean> = signal(false);

  markdownEditor = false;

  titleControl = new FormControl<string>('', [
    TextInputValidatorFactory({
      minlength: 5,
      maxlength: 30,
      options: { acceptSpecialCaracters: false },
    }),
  ]);

  descriptionControl = new FormControl<string>('', [
    TextInputValidatorFactory({
      maxlength: 255,
      options: { acceptSpecialCaracters: true },
    }),
  ]);

  contentControl = new FormControl<string>('# Titre\n\n> Exemple', [
    TextInputValidatorFactory({
      validate: false,
      required: false,
    }),
  ]);

  form = this.fb.group({
    title: this.titleControl,
    description: this.descriptionControl,
    content: this.contentControl,
  });

  private draft = new PostDraftStorage(this.getDraftKey());

  private hasInitializedFromInput = false;
  private hasRestoredDraft = false;

  constructor() {
    generateSyntaxList();

    this.initPostOrDraft();

    this.draft.watch(this.form);

    this.draft.saved$
      .pipe(
        throttleTime(this.ACTION_COOLDOWN_MS, undefined, {
          leading: true,
          trailing: false,
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.toast.info('Brouillon sauvegardé', { duration: 2000 });
      });

    this.contentControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateResolvedMarkdown();
        this._markdown.refreshPreview(this.preview?.nativeElement)
      });
  }

  ngAfterViewInit(): void {
    this._markdown.refreshPreview(this.preview?.nativeElement)
  }

  ngOnDestroy(): void {
    this.image_editor.clearLocalImages()

    this.draft.flush(this.form);
    this.draft.destroy();
  }

  private initPostOrDraft(): void {
    effect(() => {
      const inputPost = this.post();

      if (inputPost) {
        this.applyPostInput(inputPost);
        return;
      }

      this.restoreDraftOnce();
    });
  }

  private applyPostInput(post: Post): void {
    if (this.hasInitializedFromInput) return;

    this.hasInitializedFromInput = true;
    this.hasRestoredDraft = true;

    this.form.patchValue(
      {
        title: post.title ?? '',
        description: post.description ?? '',
        content: post.content ?? '',
      },
      { emitEvent: true }
    );

    // Le post passé en Input écrase le brouillon courant.
    this.draft.flush(this.form);

    this.updateResolvedMarkdown();

    this.toast.info('Post chargé dans le formulaire', {
      duration: 1000,
    });
  }

  private restoreDraftOnce(): void {
    if (this.hasRestoredDraft) return;

    this.hasRestoredDraft = true;

    const restoredState = this.draft.restore(this.form);

      this.toast.info('Récupération du brouillon', {
        duration: 2000,
      });

    this.updateResolvedMarkdown();
  }
  private updateResolvedMarkdown(): void {
    this.resolvedMarkdown.set(
      this.image_editor.resolveLocalImages(this.contentControl.value ?? '')
    );
  }

  private getDraftKey(): string {
    return 'post:draft:v1';
  }

  goBack = () => this.router.navigate(['']);

  toggleEditorMarkdown(): void {
    this.markdownEditor = !this.markdownEditor;
  }

  submit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const authorId = this.session.getUserIdSync();

    if (!authorId) {
      this.router.navigate(['auth/login']);
      return;
    }

    if (this.loading()) return;

    const { title, description, content } = this.form.getRawValue();

    if (!this.post()) {

        console.log("CREATE")

      

      const post: Post = {
        title: title ?? '',
        description: description ?? '',
        content: content ?? '',
        authorId,
        published_at: new Date(),
        created_at: new Date(),
      };

      this.loading.set(true);

      this.postService
        .publishPost(post)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            localStorage.removeItem(this.getDraftKey());
            this.router.navigate(['home']);
          },
        });
      } else {
        console.log("UPDATE")
        const currentPost = this.post();

        if (!currentPost || currentPost.id === undefined) return;

        const updatePost: UpdatedPost = {
          title: title ?? '',
          description: description ?? '',
          content: content ?? '',
        };

        this.loading.set(true);

        this.postService
          .updatePost(currentPost.id, updatePost)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.router.navigate(['home']);
            },
          });
      }
      
  };
 
  formatFromContextMenu = (_data: unknown, syntaxName: string) => {
    this.setFormat(syntaxName);
  };

  setFormat(name: string): void {
    const item: MarkdownSyntax | undefined = MarkdownSyntaxOptions.find(
      (syntax) => syntax.name === name
    );

    if (!item) {
      throw new Error(`Syntax name : '${name}' doesn't exist!`);
    }

    this.markdownEditorElement.applySyntax(item);
  }

  onTabPress(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value =
      textarea.value.slice(0, start) + '\t' + textarea.value.slice(end);

    textarea.selectionStart = textarea.selectionEnd = start + 1;
  }

  onEditorScroll(editorScrollTop: number): void {
    const el = this.markdownEditorElement.getElement();
    const editorEl = el?.nativeElement;
    const previewEl = this.preview?.nativeElement;

    if (!editorEl || !previewEl) return;

    const editorMax = editorEl.scrollHeight - editorEl.clientHeight;

    if (editorMax <= 0) return;

    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    const ratio = editorScrollTop / editorMax;

    previewEl.scrollTop = ratio * previewMax;
  }

  blockScroll(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  saveManual(): void {
    this.draft.flush(this.form);
  }

  onPickImage(event: Event): void {
    this._markdown.insertAtCursor(this.image_editor.getImageSyntaxPosition(event), this.markdownEditorElement, this.contentControl);
  }

  onPreviewClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target) return;
    if (target.tagName.toLowerCase() !== 'img') return;

    const img = target as HTMLImageElement;
    const title = img.getAttribute('title') ?? '';

    if (!title.startsWith('localimg:')) return;

    const id = title.slice('localimg:'.length);

    if (!id) return;

    this.relinkTargetId = id;
    this.relinkPicker?.nativeElement.click();
  }

  onRelinkPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.relinkTargetId) return;

    input.value = '';

    const blobUrl = URL.createObjectURL(file);

    this.image_editor.addLocalImage(this.relinkTargetId, blobUrl);

    const currentContent = this.contentControl.value ?? '';

    this.contentControl.setValue(currentContent);

    this.toast.success('Image re-liée ✅', {
      duration: 1500,
    });

    this.relinkTargetId = null;
  }
}