import { DestroyRef, Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { throttleTime } from 'rxjs';
import { PostDraftStorage } from '../pages/post-form/post-draft.storage';
import { ToastService } from 'src/app/shared/helpers/toasts/toaster.service';
import { Post } from '../model/post.model';


@Injectable()
export class PostDraftManager {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  private readonly ACTION_COOLDOWN_MS = 60000;
  private readonly draftKey = 'post:draft:v1';

  private draft = new PostDraftStorage(this.draftKey);

  private hasInitializedFromInput = false;
  private hasRestoredDraft = false;

  watch(form: FormGroup): void {
    this.draft.watch(form);

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
  }

  init(params: {
    post: Post | undefined;
    form: FormGroup;
    onContentChange: () => void;
  }): void {
    const { post, form, onContentChange } = params;

    if (post) {
      this.applyPostInput(post, form, onContentChange);
      return;
    }

    this.restoreDraftOnce(form, onContentChange);
  }

  flush(form: FormGroup): void {
    this.draft.flush(form);
  }

  clear(): void {
    this.draft.clear();
  }

  destroy(): void {
    this.draft.destroy();
  }

  private applyPostInput(
    post: Post,
    form: FormGroup,
    onContentChange: () => void
  ): void {
    if (this.hasInitializedFromInput) return;

    this.hasInitializedFromInput = true;
    this.hasRestoredDraft = true;

    form.patchValue(
      {
        title: post.title ?? '',
        description: post.description ?? '',
        content: post.content ?? '',
      },
      { emitEvent: true }
    );

    this.draft.flush(form);
    onContentChange();
  }

  private restoreDraftOnce(
    form: FormGroup,
    onContentChange: () => void
  ): void {
    if (this.hasRestoredDraft) return;

    this.hasRestoredDraft = true;

    if (this.draft.restore(form)) {
      this.toast.info('Récupération du brouillon', {
        duration: 2000,
      });
    }

    onContentChange();
  }
}