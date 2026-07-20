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
import { finalize } from 'rxjs';

import { ContextMenuTriggerDirective } from '@src/app/shared/ui/context-menu/context-menu.directive';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { InputComponent } from '@src/app/shared/ui/form/inputs/input/input';
import { TextInputValidatorFactory } from '@src/app/shared/ui/form/inputs/input/validators/input-text-validator.factory';
import { TextAreaComponent } from '@src/app/shared/ui/form/text-area/text-area';
import { MarkdownComponent } from 'ngx-markdown';

import { ImageEditorService } from '../../data-access/image-editor.service';
import { MarkdownEditorService } from '../../data-access/markdow.service';
import { PostDraftManager } from '../../data-access/post-draft-manager.service';
import { PostFormSubmitService, PostSaveMode } from '../../data-access/post-form-submit.service';
import { PostEditorImageService } from '../../data-access/post-image-editor.service';
import { SessionService } from 'src/app/shared/services/session.service';
import { Post } from '../../model/post.model';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';
import { MarkdownSyntaxOptions } from 'src/app/shared/ui/context-menu/config/context-menu-options';

@Component({
  selector: 'app-form-post',
  templateUrl: './post-form.html',
  styleUrls: ['./fullscreen-editor.scss'],
  providers: [PostDraftManager],
  imports: [
    ReactiveFormsModule,
    InputComponent,
    TextAreaComponent,
    MarkdownComponent,
    ContextMenuTriggerDirective,
    BaseButtonComponent,
  ],
})
export class PostFormComponent implements AfterViewInit {
  private _destroy_ref = inject(DestroyRef);
  private _form_builder = inject(FormBuilder);
  private _session = inject(SessionService);
  private _router = inject(Router);

  private _markdown = inject(MarkdownEditorService);
  private _submit = inject(PostFormSubmitService);
  private _draft = inject(PostDraftManager);
  private _editor_images = inject(PostEditorImageService);
  private _images = inject(ImageEditorService);
  private readonly _breadCrumb = inject(BreadcrumbService)


  @ViewChild('markdownEditor') markdownEditorElement!: TextAreaComponent;
  @ViewChild('preview', { static: false }) preview?: ElementRef<HTMLElement>;
  @ViewChild('relinkPicker') relinkPicker?: ElementRef<HTMLInputElement>;

  post: InputSignal<Post | undefined> = input();

  options = MarkdownSyntaxOptions

  showPreview: WritableSignal<boolean> = signal(false);
  resolvedMarkdown = signal<string>('');
  loading: WritableSignal<boolean> = signal(false);

  markdownEditor = false;
  isBackAction = false;

  titleControl = new FormControl<string>('', [
    TextInputValidatorFactory({
      minlength: 5,
      maxlength: 85,
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

  form = this._form_builder.group({
    title: this.titleControl,
    description: this.descriptionControl,
    content: this.contentControl,
  });

  constructor() {
   
    this.initPostOrDraft();
    this._draft.watch(this.form);

    this.contentControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroy_ref))
      .subscribe(() => {
        this.updateResolvedMarkdown();
        this._markdown.refreshPreview(this.preview?.nativeElement);
      });
  }

  ngAfterViewInit(): void {
    this._markdown.refreshPreview(this.preview?.nativeElement);
     this._breadCrumb.setWithArticle([
      {
        label: (this.post() === undefined ? 'Ajouter un article' : 'Modifier un article'),
      }
    ])
  }

  ngOnDestroy(): void {
    this._editor_images.clear();

    if (!this.isBackAction) {
      this._draft.flush(this.form);
    } else {
      this._draft.clear();
    }

    this._draft.destroy();
  }

  togglePreview(): void {
    this.showPreview.set(!this.showPreview());
  }

  toggleEditorMarkdown(): void {
    this.markdownEditor = !this.markdownEditor;
  }

  goBack = () => {
    this.isBackAction = true;
    this._router.navigate(['']);
  };

  saveManual(): void {
    this._draft.flush(this.form);
  }

  submit = (mode: PostSaveMode) => {
    if (!this.isFormSubmittable()) return;

    const authorId = this._session.getAuthorIdOrRedirect();
    if (!authorId) return;

    this.loading.set(true);
    this._draft.clear();

    this._submit
      .save({
        currentPost: this.post(),
        payload: this.getPostPayload(),
        authorId,
        mode
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this._router.navigate(['home']),
      });
  };

  formatFromContextMenu = (_data: unknown, syntaxName: string) => {
    this.setFormat(syntaxName);
  };

  setFormat(name: string): void {
    this._markdown.applySyntax(name, this.markdownEditorElement);
  }

  onTabPress(event: KeyboardEvent): void {
    this._markdown.handleTabPress(event);
  }

  onEditorScroll(editorScrollTop: number): void {
    this._markdown.syncScroll(
      editorScrollTop,
      this.markdownEditorElement,
      this.preview?.nativeElement
    );
  }

  blockScroll(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onPickImage(event: Event): void {
    this._editor_images.pickImage(
      event,
      this.markdownEditorElement,
      this.contentControl
    );
  }

  onPreviewClick(event: MouseEvent): void {
    this._editor_images.handlePreviewClick(
      event,
      this.relinkPicker?.nativeElement
    );
  }

  onRelinkPicked(event: Event): void {
    this._editor_images.relinkPicked(event, this.contentControl);
  }

  private initPostOrDraft(): void {
    effect(() => {
      this._draft.init({
        post: this.post(),
        form: this.form,
        onContentChange: () => this.updateResolvedMarkdown(),
      });
    });
  }

  private updateResolvedMarkdown(): void {
    this.resolvedMarkdown.set(
      this._images.resolveLocalImages(this.contentControl.value ?? '')
    );
  }

  private isFormSubmittable(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    return !this.loading();
  }

  private getPostPayload(): {
    title: string;
    description: string;
    content: string;
  } {
    const { title, description, content } = this.form.getRawValue();

    return {
      title: title ?? '',
      description: description ?? '',
      content: content ?? '',
    };
  }
}