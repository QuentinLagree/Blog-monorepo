import { Injectable } from '@nestjs/common';
import { Post as Article } from '@prisma/client';

import { ArticleService } from 'src/modules/post/posts.service';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { PostNotFoundWithSlugException } from 'src/modules/post/exceptions/post-not-found-with-slug.exception';
import { SlugInvalidFormat } from 'src/modules/post/exceptions/slug-invalid-format.exception';

const VALIDATE_SLUG =
  /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*-\d+$/u;

@Injectable()
export class SlugService {
  constructor(
    private readonly _post: ArticleService,
  ) {}

  public isValidateSlug(slug: string): boolean {
    return VALIDATE_SLUG.test(
      this.normalizeSlug(slug),
    );
  }

  public generateSlugFromArticleTitle(
    articleTitle: string,
    articleId: number,
  ): string {
    const titleSlug = articleTitle
      .normalize('NFC')
      .toLocaleLowerCase('fr-FR')
      .trim()
      .replace(/['’`]+/gu, '-')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!titleSlug) {
      throw new SlugInvalidFormat(
        articleTitle,
      );
    }

    return `${titleSlug}-${articleId}`;
  }

  public async getPostWithSlug(
    rawSlug: string,
  ): Promise<Article> {
    const receivedSlug =
      this.normalizeSlug(rawSlug);

    if (!this.isValidateSlug(receivedSlug)) {
      throw new SlugInvalidFormat(
        receivedSlug,
      );
    }

    const id =
      this.getIdFromSlug(receivedSlug);

    const article =
      await this._post.indexOneWhere({
        id,
      });

    if (!article) {
      throw new PostNotFoundException(id);
    }

    const expectedSlug =
      this.normalizeSlug(
        this.generateSlugFromArticleTitle(
          article.title,
          article.id,
        ),
      );

    console.log({
      articleTitle: article.title,
      receivedSlug,
      expectedSlug,
    });

    if (expectedSlug !== receivedSlug) {
      throw new PostNotFoundWithSlugException(
        receivedSlug,
      );
    }

    return article;
  }

  private normalizeSlug(
    slug: string,
  ): string {
    return slug
      .normalize('NFC')
      .toLocaleLowerCase('fr-FR')
      .trim()
      .replace(/^-+|-+$/g, '');
  }

  private getIdFromSlug(
    slug: string,
  ): number {
    const rawId =
      slug.split('-').at(-1);

    if (!rawId || !/^\d+$/.test(rawId)) {
      throw new SlugInvalidFormat(slug);
    }

    const id = Number(rawId);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      throw new SlugInvalidFormat(slug);
    }

    return id;
  }
}