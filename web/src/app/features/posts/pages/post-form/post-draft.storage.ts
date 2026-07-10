import { FormGroup } from '@angular/forms';
import { debounceTime, Subject, Subscription } from 'rxjs';

export interface PostDraft {
  title: string;
  description: string;
  content: string;
  updatedAt: number;
}

type PostDraftFormValue = {
  title?: string | null;
  description?: string | null;
  content?: string | null;
};

export class PostDraftStorage {
  private subscription?: Subscription;
  private pendingIdleId: number | null = null;
private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastSerializedDraft = '';

  private readonly savedSubject = new Subject<PostDraft>();
  readonly saved$ = this.savedSubject.asObservable();

  constructor(private readonly key: string) {}

  restore(form: FormGroup): boolean {
    const draft = this.read();

    if (!draft) return false;

    form.patchValue(
      {
        title: draft.title,
        description: draft.description,
        content: draft.content,
      },
      { emitEvent: false }
    );

    this.lastSerializedDraft = this.serialize(draft);

    return true;
  }

  watch(form: FormGroup): void {
    this.subscription?.unsubscribe();

    this.subscription = form.valueChanges
      .pipe(debounceTime(700))
      .subscribe(() => {
        this.saveLater(this.createDraftFromForm(form));
      });
  }

  flush(form: FormGroup): void {
    this.saveNow(this.createDraftFromForm(form));
  }

  clear(): void {
    this.cancelPendingSave();
    localStorage.removeItem(this.key);
    this.lastSerializedDraft = '';
  }

  destroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    this.cancelPendingSave();
    this.savedSubject.complete();
  }

  private read(): PostDraft | null {
    const rawDraft = localStorage.getItem(this.key);

    if (!rawDraft) return null;

    try {
      return this.normalize(JSON.parse(rawDraft));
    } catch {
      localStorage.removeItem(this.key);
      return null;
    }
  }

  private saveLater(draft: PostDraft): void {
  if (!this.shouldSave(draft)) return;

  this.cancelPendingSave();

  const save = () => this.saveNow(draft);

  if ('requestIdleCallback' in globalThis) {
    this.pendingIdleId = globalThis.requestIdleCallback(save, { timeout: 1500 });
    return;
  }

  this.pendingTimeoutId = setTimeout(save, 250);
}

private cancelPendingSave(): void {
  if (this.pendingIdleId !== null) {
    globalThis.cancelIdleCallback?.(this.pendingIdleId);
    this.pendingIdleId = null;
  }

  if (this.pendingTimeoutId !== null) {
    clearTimeout(this.pendingTimeoutId);
    this.pendingTimeoutId = null;
  }
}

  private saveNow(draft: PostDraft): void {
    if (!this.shouldSave(draft)) return;

    const serializedDraft = this.serialize(draft);

    localStorage.setItem(this.key, serializedDraft);

    this.lastSerializedDraft = serializedDraft;
    this.savedSubject.next(draft);
  }

  private shouldSave(draft: PostDraft): boolean {
    if (this.isEmpty(draft)) return false;

    return this.serialize(draft) !== this.lastSerializedDraft;
  }

  private createDraftFromForm(form: FormGroup): PostDraft {
    return this.createDraft(form.getRawValue() as PostDraftFormValue);
  }

  private createDraft(value: PostDraftFormValue): PostDraft {
    return {
      title: value.title ?? '',
      description: value.description ?? '',
      content: value.content ?? '',
      updatedAt: Date.now(),
    };
  }

  private normalize(value: Partial<PostDraft>): PostDraft {
    return {
      title: value.title ?? '',
      description: value.description ?? '',
      content: value.content ?? '',
      updatedAt: value.updatedAt ?? Date.now(),
    };
  }

  private serialize(draft: PostDraft): string {
    return JSON.stringify({
      title: draft.title,
      description: draft.description,
      content: draft.content,
    });
  }

  private isEmpty(draft: PostDraft): boolean {
    return !draft.title.trim() && !draft.description.trim() && !draft.content.trim();
  }
}