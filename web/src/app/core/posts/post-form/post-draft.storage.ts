import { FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription, Subject } from 'rxjs';
import { PostFormState } from './post-form.state';

export interface PostDraft {
  title: string;
  description: string;
  content: string;
  state: PostFormState;
  updatedAt: number;
}

export class PostDraftStorage {
  private sub?: Subscription;
  private savedSubject = new Subject<PostDraft>();
  saved$ = this.savedSubject.asObservable();

  private pending: any = null;
  private lastContent = '';

  constructor(private key: string) {}

  restore(form: FormGroup): PostFormState | null {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const draft = JSON.parse(raw) as Partial<PostDraft>;
      form.patchValue(
        { title: draft.title ?? '', description: draft.description ?? '', content: draft.content ?? '' },
        { emitEvent: false }
      );
      this.lastContent = (draft.content ?? '') as string;
      return (draft.state as PostFormState) ?? null;
    } catch {
        return null;
    }

  }

  watch(form: FormGroup, getState: () => PostFormState): void {
    this.sub = form.valueChanges.pipe(debounceTime(700)).subscribe((value: any) => {
      const payload: PostDraft = {
        title: value?.title ?? '',
        description: value?.description ?? '',
        content: value?.content ?? '',
        state: getState(),
        updatedAt: Date.now(),
      };

      if (payload.content === this.lastContent) return;

      this.lastContent = payload.content;
      this.writeIdle(payload);
    });
  }

  flush(form: FormGroup, getState: () => PostFormState): void {
    const v: any = form.getRawValue();
    const payload: PostDraft = {
      title: v.title ?? '',
      description: v.description ?? '',
      content: v.content ?? '',
      state: getState(),
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.key, JSON.stringify(payload));
    this.savedSubject.next(payload);
  }

  destroy(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.cancelIdle();
    this.savedSubject.complete();
  }

  private writeIdle(payload: PostDraft) {
    this.cancelIdle();

    const run = () => {
      localStorage.setItem(this.key, JSON.stringify(payload));
      this.savedSubject.next(payload); // <- l’event “saved”
    };

    if ('requestIdleCallback' in window) {
      this.pending = (window as any).requestIdleCallback(run, { timeout: 1500 });
    } else {
      this.pending = setTimeout(run, 250);
    }
  }

  private cancelIdle() {
    if (!this.pending) return;
    if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(this.pending);
    clearTimeout(this.pending);
    this.pending = null;
  }
}
