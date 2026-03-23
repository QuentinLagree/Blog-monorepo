import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, map, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { generateSyntaxList } from '@src/app/shared/helpers/markdown/markdown.helper';
import { MarkdownSyntaxOptions } from '@src/app/shared/ui/context-menu/config/context-menu-options';
import { ContextMenuTriggerDirective } from '@src/app/shared/ui/context-menu/context-menu.directive';
import { MarkdownSyntax } from '@src/app/shared/ui/context-menu/types/markdownOptions.interface';
import { BaseButtonComponent } from '@src/app/shared/ui/form/buttons/base-button';
import { InputComponent } from '@src/app/shared/ui/form/inputs/input/input';
import { TextInputValidatorFactory } from '@src/app/shared/ui/form/inputs/input/validators/input-text-validator.factory';
import { TextAreaComponent } from '@src/app/shared/ui/form/text-area/text-area';
import { MarkdownComponent } from 'ngx-markdown';

import { Post, PostService } from '../../services/post.service';
import { SessionService } from '../../services/session.service';

import { PostDraftStorage } from './post-draft.storage';
import { POST_FORM_STATES, PostFormState, nextState, prevState } from './post-form.state';
import { PrismHighlightService } from '../../services/prism-highlight.service';
import { ToastService } from '../../toasts/toaster.service';
import { LocalImageStore } from '@src/app/shared/services/storage.image';

@Component({
  selector: 'app-form-post',
  templateUrl: './post-form.html',
  styleUrls: ['./fullscreen-editor.scss'],
  imports: [
    ReactiveFormsModule,
    InputComponent,
    BaseButtonComponent,
    TextAreaComponent,
    MarkdownComponent,
    ContextMenuTriggerDirective,
  ],
})
export class PostFormComponent implements AfterViewInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private session = inject(SessionService);
  private router = inject(Router);
  private prism = inject(PrismHighlightService);
  private toast = inject(ToastService);
  private localImages = inject(LocalImageStore);

  private readonly ACTION_COOLDOWN_MS = 60000; // 60s (1min)

  @ViewChild('markdownEditor') markdownEditorElement!: TextAreaComponent;
  @ViewChild('preview', { static: false }) preview?: ElementRef<HTMLElement>;

  // ✅ input file pour relink (placeholder click)
  @ViewChild('relinkPicker') relinkPicker?: ElementRef<HTMLInputElement>;
  private relinkTargetId: string | null = null;

  post: InputSignal<Post | undefined> = input();
  resolvedMarkdown = signal<string>('');

  loading: WritableSignal<boolean> = signal(false);
  markdownEditor = false;

  state = signal<PostFormState>('TITLE');

  titleControl = new FormControl<string>(this.post()?.title ?? '', [
    TextInputValidatorFactory({
      minlength: 5,
      maxlength: 30,
      options: { acceptSpecialCaracters: false },
    }),
  ]);

  descriptionControl = new FormControl<string>(this.post()?.description ?? '', [
    TextInputValidatorFactory({
      maxlength: 255,
      options: { acceptSpecialCaracters: false },
    }),
  ]);

  contentControl = new FormControl<string>(this.post()?.content ?? `# Titre\n\n> Exemple`, [
    TextInputValidatorFactory({ validate: false, required: false }),
  ]);

  form = this.fb.group({
    title: this.titleControl,
    description: this.descriptionControl,
    content: this.contentControl,
  });

  private draft = new PostDraftStorage(this.getDraftKey());

  constructor() {
    generateSyntaxList();

    // ✅ restore draft + state
    const restoredState = this.draft.restore(this.form);
    console.log(restoredState)
    if ((restoredState === 'TITLE' || restoredState === 'DESCRIPTION' || restoredState === 'CONTENT') && restoredState) {
      this.state.set(restoredState as PostFormState);
      this.toast.info('Récupération du brouillon', { duration: 2000 });
    }

    // ✅ autosave via storage
    this.draft.watch(this.form, () => this.state());

    // ✅ toast “cooldown”
    this.draft.saved$
      .pipe(
        throttleTime(this.ACTION_COOLDOWN_MS, undefined, { leading: true, trailing: false }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((payload) => {
        console.log('[saved$] emitted', payload.updatedAt);
        this.toast.info('Brouillon sauvegardé', { duration: 2000 });
      });

    // ✅ resolved markdown + prism (1 seule subscription)
    this.contentControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resolvedMarkdown.set(this.resolveLocalImages(this.contentControl.value ?? ''));
        this.prism.highlightPreview(this.preview?.nativeElement);
      });

    // init
    this.resolvedMarkdown.set(this.resolveLocalImages(this.contentControl.value ?? ''));

    // (optionnel) ton autosave direct localStorage devient redondant si PostDraftStorage le fait déjà.
    // Si tu le gardes, évite doublon. Perso: je le supprime.
    // this.contentControl.valueChanges...
  }

  ngAfterViewInit(): void {
    this.prism.highlightPreview(this.preview?.nativeElement);
  }

  ngOnDestroy() {
    // ✅ libère les blob URLs
    this.localImages.revokeAll?.();

    this.draft.flush(this.form, () => this.state());
    this.draft.destroy();
  }

  private getDraftKey() {
    return 'post:draft:v1';
  }

  goBack = () => this.router.navigate(['']);

  toggleEditorMarkdown() {
    this.markdownEditor = !this.markdownEditor;
  }

  nextStep() {
    this.state.set(nextState(this.state()));

  }

  prevStep() {
    const prevStateCurrent = prevState(this.state())
    this.state.set(prevStateCurrent);
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
  };

  formatFromContextMenu = (_data: any, syntaxName: string) => this.setFormat(syntaxName);

  setFormat(name: string) {
    const item: MarkdownSyntax | undefined = MarkdownSyntaxOptions.find((s) => s.name === name);
    if (!item) throw new Error(`Syntax name : '${name}' doesn't exist!`);
    this.markdownEditorElement.applySyntax(item);
  }

  onTabPress(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value = textarea.value.slice(0, start) + '\t' + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  }

  onEditorScroll(editorScrollTop: number) {
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

  blockScroll(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  saveManual() {
    this.draft.flush(this.form, () => this.state());
  }

  // -------------------------
  // Images localimg + placeholder + relink
  // -------------------------

  onPickImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const id = this.uuid();
    const blobUrl = URL.createObjectURL(file);
    this.localImages.add(id, blobUrl);

    const alt = file.name.replace(/\.[^/.]+$/, '');
    this.insertAtCursor(`\n![${alt}](localimg:${id})\n`);
  }

  // ✅ clic dans la preview sur placeholder → relink
  onPreviewClick(ev: MouseEvent) {
  const target = ev.target as HTMLElement | null;
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

  // ✅ l’utilisateur re-choisit un fichier pour cet id
  onRelinkPicked(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.relinkTargetId) return;

    input.value = '';

    const blobUrl = URL.createObjectURL(file);
    this.localImages.add(this.relinkTargetId, blobUrl);

    // force re-render markdown
    const cur = this.contentControl.value ?? '';
    this.contentControl.setValue(cur);

    this.toast.success('Image re-liée ✅', { duration: 1500 });
    this.relinkTargetId = null;
  }

  private uuid() {
    return 'li_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private insertAtCursor(text: string) {
    const elRef = this.markdownEditorElement.getElement();
    const editorEl = elRef?.nativeElement as HTMLTextAreaElement | undefined;
    if (!editorEl) return;

    const start = editorEl.selectionStart ?? editorEl.value.length;
    const end = editorEl.selectionEnd ?? editorEl.value.length;

    const current = this.contentControl.value ?? '';
    const next = current.slice(0, start) + text + current.slice(end);

    this.contentControl.setValue(next);
    this.contentControl.markAsDirty();

    queueMicrotask(() => {
      editorEl.focus();
      const pos = start + text.length;
      editorEl.setSelectionRange(pos, pos);
    });
  }

  private resolveLocalImages(md: string): string {
  // remplace ![alt](localimg:id) par un <img> HTML avec title="localimg:id"
  return md.replace(/!\[([^\]]*)\]\(localimg:([a-zA-Z0-9_\-]+)\)/g, (_m, alt, id) => {
    const blob = this.localImages.get(id);
    const src = blob ?? this.placeholderSrc(id);

    const safeAlt = this.escapeHtml(String(alt ?? 'image'));
    const safeId = this.escapeHtml(String(id));
    const safeSrc = this.escapeHtml(String(src));

    // ✅ title est généralement conservé par le sanitizer
    return `<img src="${safeSrc}" alt="${safeAlt}" title="localimg:${safeId}" style="cursor:pointer" />`;
  });
}


  private placeholderSrc(id: string) {
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

  private escapeHtml(s: string) {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
