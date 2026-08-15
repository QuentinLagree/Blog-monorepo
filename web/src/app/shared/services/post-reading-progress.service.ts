import { HttpContext } from '@angular/common/http';
import {
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SUCCESS_MESSAGE } from
  'src/app/shared/helpers/toasts/models/toasts.config';
import { Message } from
  'src/app/shared/types/message.type';

import { ReadingStatus } from
  '../../features/posts/pages/post-detail/models/post-detail.types';
import { PostService } from '../../features/posts/data-access/post.service';
import { UserService } from './user.service';

const SILENT_CONTEXT =
  new HttpContext().set(
    SUCCESS_MESSAGE,
    false,
  );

const COMPLETION_THRESHOLD = 95;
const SAVE_DELAY = 750;

@Injectable()
export class PostReadingProgressService {


  private readonly _postService =
    inject(PostService);

  private postId:
    number | null = null;

  private saveTimeout?: number;
  private saveInProgress = false;
  private pendingProgress:
    number | null = null;

  private readonly lastSavedProgress =
    signal<number | null>(null);

  readonly savedProgress =
    signal(0);

  readonly hasStarted =
    signal(false);

  readonly completed =
    signal(false);

  readonly saving =
    signal(false);

  readonly authenticated = signal(false)

  async initialize(
    postId: number,
    authenticated: boolean,
  ): Promise<void> {
    this.clearSaveTimeout();

    this.postId = postId;
    this.pendingProgress = null;
    this.lastSavedProgress.set(null);

    this.savedProgress.set(0);
    this.hasStarted.set(false);
    this.completed.set(false);
    this.saving.set(false);

    this.authenticated.set(authenticated)

    if (!authenticated) {
      return;
    }

    console.log(postId)

    try {
      const response:
        Message<ReadingStatus> =
        await firstValueFrom(
          this._postService
            .getReadingStatus(
              postId,
              {
                context:
                  SILENT_CONTEXT,
              },
            ),
        );

      if (!response.data) {
        return;
      }

      this.applySavedStatus(
        response.data.progress,
        response.data.completed,
      );

      this.hasStarted.set(
        response.data.hasStarted,
      );
    } catch (error: unknown) {
      console.error(
        'Impossible de charger le statut de lecture.',
        error,
      );
    }
  }

  update(
    progress: number,
  ): void {
    const normalized =
      this.normalize(progress);

    const lastSaved =
      this.lastSavedProgress() ?? 0;

    if (
      normalized <= 0 ||
      normalized <= lastSaved
    ) {
      return;
    }

    this.pendingProgress =
      normalized;

    this.scheduleSave();
  }

  flush(): void {
    this.clearSaveTimeout();

    if (
      this.pendingProgress !== null
    ) {
      void this.persist(
        this.pendingProgress,
      );
    }
  }

  destroy(): void {
    this.flush();
    this.postId = null;
  }

  private scheduleSave(): void {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    this.clearSaveTimeout();

    this.saveTimeout =
      window.setTimeout(() => {
        this.saveTimeout =
          undefined;

        if (
          this.pendingProgress !== null
        ) {
          void this.persist(
            this.pendingProgress,
          );
        }
      }, SAVE_DELAY);
  }

  private async persist(
    progress: number,
  ): Promise<void> {

    if (!this.authenticated()) return;
    const postId =
      this.postId;


    if (
      !postId ||
      progress <= 0 ||
      progress <=
      (this.lastSavedProgress() ?? 0)
    ) {
      return;
    }

    if (this.saveInProgress) {
      this.pendingProgress =
        progress;

      return;
    }

    this.saveInProgress = true;
    this.saving.set(true);

    try {
      await firstValueFrom(
        this._postService
          .updateReadingProgress(
            postId,
            progress,
            {
              context:
                SILENT_CONTEXT,
            },
          ),
      );

      this.pendingProgress =
        this.pendingProgress === progress
          ? null
          : this.pendingProgress;

      this.applySavedStatus(
        progress,
        progress >=
        COMPLETION_THRESHOLD,
      );
    } catch (error: unknown) {
      this.pendingProgress =
        progress;

      console.error(
        'Impossible de sauvegarder la progression de lecture.',
        error,
      );
    } finally {
      this.saveInProgress = false;
      this.saving.set(false);

      const nextProgress =
        this.pendingProgress;

      if (
        nextProgress !== null &&
        nextProgress !==
        this.lastSavedProgress()
      ) {
        void this.persist(
          nextProgress,
        );
      }
    }
  }

  private applySavedStatus(
    progress: number,
    completed: boolean,
  ): void {
    this.lastSavedProgress.set(
      progress,
    );

    this.savedProgress.set(
      progress,
    );

    this.hasStarted.set(
      progress > 0,
    );

    this.completed.set(
      completed,
    );
  }

  private clearSaveTimeout(): void {
    if (
      typeof window !== 'undefined' &&
      this.saveTimeout
    ) {
      window.clearTimeout(
        this.saveTimeout,
      );

      this.saveTimeout =
        undefined;
    }
  }

  private normalize(
    progress: number,
  ): number {
    return Math.round(
      Math.min(
        100,
        Math.max(
          0,
          progress,
        ),
      ),
    );
  }
}