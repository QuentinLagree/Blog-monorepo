import { NotFoundException } from '@nestjs/common';
import { SlugService } from 'src/commons/services/slug.service';
import { PostNotFoundWithSlugException } from 'src/modules/post/exceptions/post-not-found-with-slug.exception';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { SlugInvalidFormat } from 'src/modules/post/exceptions/slug-invalid-format.exception';
import { ArticleService } from 'src/modules/post/posts.service';

describe('SlugService', () => {
  let slugService: SlugService;

  const articleServiceMock = {
    indexOneWhere: jest.fn(),
  };

  const createPostMock = (override = {}) => ({
    id: 1,
    title: 'Mon Super Article',
    content: 'Content',
    description: 'Description',
    authorId: 1,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    slugService = new SlugService(
      articleServiceMock as unknown as ArticleService,
    );
  });

  describe('isValidateSlug', () => {
    it('should return true for valid slug', () => {
      expect(slugService.isValidateSlug('mon-super-article-1')).toBe(true);
    });

    it('should return false for invalid slug without id', () => {
      expect(slugService.isValidateSlug('mon-super-article')).toBe(false);
    });

    it('should return false for invalid slug format', () => {
      expect(slugService.isValidateSlug('Mon Super Article 1')).toBe(false);
    });
  });

  describe('generateSlugFromArticleTitle', () => {
    it('should generate slug from article title and id', () => {
      const response = slugService.generateSlugFromArticleTitle(
        'Mon Super Article',
        1,
      );

      expect(response).toBe('mon-super-article-1');
    });

    it('should remove special characters', () => {
      const response = slugService.generateSlugFromArticleTitle(
        'Salut ! Mon Article: Test',
        12,
      );

      expect(response).toBe('salut-mon-article-test-12');
    });
  });

  describe('getPostWithSlug', () => {
    it('should return post if slug is valid and post is published', async () => {
      const post = createPostMock({
        id: 1,
        title: 'Mon Super Article',
        published_at: new Date(),
      });

      articleServiceMock.indexOneWhere.mockResolvedValue(post);

      const response = await slugService.getPostWithSlug('mon-super-article-1');

      expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
        id: 1,
      });

      expect(response).toEqual(post);
    });

    it('should throw NumberNotCorrectFormat if slug id is not a number', async () => {
      await expect(
        slugService.getPostWithSlug('mon-super-article-abc'),
      ).rejects.toThrow(SlugInvalidFormat);

      expect(articleServiceMock.indexOneWhere).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if post does not exist', async () => {
      articleServiceMock.indexOneWhere.mockResolvedValue(null);

      await expect(
        slugService.getPostWithSlug('mon-super-article-1'),
      ).rejects.toThrow(PostNotFoundException);
    });

    it('should return post even if post is not published', async () => {
      const post = createPostMock({
        id: 1,
        title: 'Mon Super Article',
        published_at: null,
      });

      articleServiceMock.indexOneWhere.mockResolvedValue(post);

      const response = await slugService.getPostWithSlug('mon-super-article-1');

      expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
        id: 1,
      });

      expect(response).toEqual(post);
    });

    it('should throw PostNotFoundWithSlugException if slug does not match article title', async () => {
      const post = createPostMock({
        id: 1,
        title: 'Titre Different',
        published_at: new Date(),
      });

      articleServiceMock.indexOneWhere.mockResolvedValue(post);

      await expect(
        slugService.getPostWithSlug('mon-super-article-1'),
      ).rejects.toThrow(PostNotFoundWithSlugException);
    });
  });
});