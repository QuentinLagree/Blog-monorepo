import { PostController } from 'src/modules/post/posts.controller';
import { ArticleService } from 'src/modules/post/posts.service';
import { UserService, userSelectPayload } from 'src/modules/user/user.service';
import { SlugService } from 'src/commons/services/slug.service';
import { UserSession } from 'src/commons/types/session-user.type';
import { Post } from '@prisma/client';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { UpdatePostDto } from 'src/modules/post/dto/update.post.dto';
import { PaginationDto } from 'src/modules/pagination/pagination.dto';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';
import { PostAlreadyPublishException } from 'src/modules/user/exceptions/post-already-publish.exception';

describe('PostController', () => {
  let postController: PostController;
  const articleServiceMock = {
    indexForReader: jest.fn(),
    showForReader: jest.fn(),
    show: jest.fn(),
    store: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    isPublished: jest.fn(),
  } satisfies jest.Mocked<
    Pick<
      ArticleService,
      | 'indexForReader'
      | 'showForReader'
      | 'show'
      | 'store'
      | 'update'
      | 'destroy'
      | 'isPublished'
    >
  >;
  const userServiceMock = { show: jest.fn() } satisfies jest.Mocked<
    Pick<UserService, 'show'>
  >;
  const slugServiceMock = { getPostWithSlug: jest.fn() } satisfies jest.Mocked<
    Pick<SlugService, 'getPostWithSlug'>
  >;
  const createSessionUserMock = (id = 10): UserSession => ({
    id,
    email: 'test@test.com',
    role: 'user',
  });
  const createUserMock = (
    overrides: Partial<userSelectPayload> = {},
  ): userSelectPayload => ({
    id: 10,
    pseudo: 'testuser',
    role: 'user',
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
  const createPostMock = (overrides: Partial<Post> = {}): Post => ({
    id: 1,
    authorId: 10,
    title: 'Titre test',
    description: 'Description test',
    content: 'Contenu test',
    published_at: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  const createPublishedPostDtoMock = (
    override: Partial<PublishedPostDto> = {},
  ): PublishedPostDto => ({
    published_at: new Date(),
    ...override,
  });

  const createPostDtoMock = (
    override: Partial<CreatePostDto> = {},
  ): CreatePostDto => ({
    title: 'Titre test',
    description: 'Description test',
    content: 'Contenu test',
    ...override,
  });

  const updatePostDtoMock = (
    override: Partial<UpdatePostDto> = {},
  ): UpdatePostDto => ({
    title: 'Titre modifié',
    content: 'Contenu modifié',
    ...override,
  });

  beforeEach(() => {
    jest.resetAllMocks();

    postController = new PostController(
      articleServiceMock as unknown as ArticleService,
      userServiceMock as unknown as UserService,
      slugServiceMock as unknown as SlugService,
    );
  });

  describe('index', () => {
    it('should return an empty message if posts list is empty', async () => {
      const payload = {
        page: 1,
        limit: 10,
      };

      const meta = { currentPage: 1, limit: 10, totalArticle: 0 };
      const sessionUser = createSessionUserMock(10);

      articleServiceMock.indexForReader.mockResolvedValue([[], meta]);

      const response = await postController.index(payload, sessionUser);

      expect(articleServiceMock.indexForReader).toHaveBeenCalledWith(
        payload,
        sessionUser,
      );

      expect(response).toEqual({
        message: 'La liste des publications est vide',
        data: [],
        meta: meta,
      });
    });

    it('should return posts list with pagination meta', async () => {
      const payload = {
        page: 1,
        limit: 10,
      };

      const posts = [createPostMock({ id: 1 }), createPostMock({ id: 2 })];
      const sessionUser = createSessionUserMock(10);

      const meta = {
        currentPage: 1,
        limit: 10,
        totalArticle: 2,
      };

      articleServiceMock.indexForReader.mockResolvedValue([posts, meta]);

      const response = await postController.index(payload, sessionUser);

      expect(articleServiceMock.indexForReader).toHaveBeenCalledWith(
        payload,
        sessionUser,
      );

      expect(response).toEqual({
        message: 'Liste de tous les articles.',
        data: posts,
        meta: meta,
      });
    });

    it('should list posts without a connected user', async () => {
      const payload: PaginationDto = { page: 1, limit: 10 };
      const meta = { currentPage: 1, limit: 10, totalArticle: 0 };
      articleServiceMock.indexForReader.mockResolvedValue([[], meta]);
      // CurrentUser may supply undefined on this public route.
      const response = await postController.index(payload, undefined!);
      expect(articleServiceMock.indexForReader).toHaveBeenCalledWith(
        payload,
        undefined,
      );
      expect(response).toEqual({
        message: 'La liste des publications est vide',
        data: [],
        meta,
      });
    });

    it('should throw an error if posts loading fails', async () => {
      const payload = {
        page: 1,
        limit: 10,
      };

      const sessionUser = createSessionUserMock(10);

      const error = new Error('Posts loading failed');

      articleServiceMock.indexForReader.mockRejectedValue(error);

      await expect(postController.index(payload, sessionUser)).rejects.toThrow(
        error,
      );

      expect(articleServiceMock.indexForReader).toHaveBeenCalledWith(
        payload,
        sessionUser,
      );
    });
  });

  describe('createPost', () => {
    it('should create a post for the connected user', async () => {
      const sessionUser = createSessionUserMock(10);

      const dto = createPostDtoMock();
      const author = createUserMock({ id: sessionUser.id });
      const createdPost = createPostMock({
        id: 1,
        authorId: sessionUser.id,
      });

      userServiceMock.show.mockResolvedValue(author);
      articleServiceMock.store.mockResolvedValue(createdPost);

      const response = await postController.createPost(dto, sessionUser);

      expect(userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(articleServiceMock.store).toHaveBeenCalledWith(dto, author);

      expect(response).toEqual({
        message:
          "La publication est créée, allez sur la page d'accueil ou votre compte pour la visualiser.",
        data: createdPost,
        meta: undefined,
      });
    });

    it('should throw UserNotFoundException if connected user is not found', async () => {
      const sessionUser = createSessionUserMock(10);

      const dto = createPostDtoMock();

      userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(sessionUser.id),
      );

      await expect(postController.createPost(dto, sessionUser)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(articleServiceMock.store).not.toHaveBeenCalled();
    });

    it('should throw an error if post creation fails', async () => {
      const sessionUser = createSessionUserMock(10);

      const dto = createPostDtoMock();
      const author = createUserMock({ id: sessionUser.id });
      const error = new Error('Post creation failed');

      userServiceMock.show.mockResolvedValue(author);
      articleServiceMock.store.mockRejectedValue(error);

      await expect(postController.createPost(dto, sessionUser)).rejects.toThrow(
        error,
      );

      expect(userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(articleServiceMock.store).toHaveBeenCalledWith(dto, author);
    });
  });

  describe('publishPost', () => {
    it('should publish a post', async () => {
      const id = 1;
      const sessionUser = createSessionUserMock(10);

      const dto = createPublishedPostDtoMock();

      const post = createPostMock({
        id,
        published_at: null,
      });

      const updatedPost = createPostMock({
        id,
        published_at: dto.published_at,
      });

      articleServiceMock.show.mockResolvedValue(post);
      articleServiceMock.isPublished.mockReturnValue(false);
      articleServiceMock.update.mockResolvedValue(updatedPost);

      const response = await postController.publishPost(id, dto, sessionUser);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });

      expect(articleServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(articleServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        sessionUser.id,
      );

      expect(response).toEqual({
        message: 'La publication a été publiée.',
        data: updatedPost,
        meta: undefined,
      });
    });

    it('should throw PostAlreadyPublishException if post is already published', async () => {
      const id = 1;
      const sessionUser = createSessionUserMock(10);

      const dto = createPublishedPostDtoMock();

      const post = createPostMock({
        id,
        published_at: new Date(),
      });

      articleServiceMock.show.mockResolvedValue(post);
      articleServiceMock.isPublished.mockReturnValue(true);

      await expect(
        postController.publishPost(id, dto, sessionUser),
      ).rejects.toThrow(PostAlreadyPublishException);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });

      expect(articleServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(articleServiceMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if post is not found', async () => {
      const id = 1;
      const sessionUser = createSessionUserMock(10);

      const dto = createPublishedPostDtoMock();
      const error = new Error('Post not found');

      articleServiceMock.show.mockRejectedValue(error);

      await expect(
        postController.publishPost(id, dto, sessionUser),
      ).rejects.toThrow(error);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });

      expect(articleServiceMock.isPublished).not.toHaveBeenCalled();
      expect(articleServiceMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if publish update fails', async () => {
      const id = 1;
      const sessionUser = createSessionUserMock(10);

      const dto = createPublishedPostDtoMock();
      const post = createPostMock({
        id,
        published_at: null,
      });

      const error = new Error('Publish update failed');

      articleServiceMock.show.mockResolvedValue(post);
      articleServiceMock.isPublished.mockReturnValue(false);
      articleServiceMock.update.mockRejectedValue(error);

      await expect(
        postController.publishPost(id, dto, sessionUser),
      ).rejects.toThrow(error);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });

      expect(articleServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(articleServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        sessionUser.id,
      );
    });
  });

  describe('slugTestWithID', () => {
    it('should return a post by slug', async () => {
      const slug = 'titre-test-1';
      const article = createPostMock({ title: 'titre test' });

      slugServiceMock.getPostWithSlug.mockResolvedValue(article);

      const response = await postController.slugTestWithID(slug);

      expect(slugServiceMock.getPostWithSlug).toHaveBeenCalledWith(
        slug,
        undefined,
      );

      expect(response).toEqual({
        message: 'Article trouvé !',
        data: article,
        meta: undefined,
      });
    });
  });

  describe('slug lookup errors', () => {
    it('should propagate an error when slug lookup fails', async () => {
      const slug = 'titre-test-1';
      const error = new Error('Slug lookup failed');
      slugServiceMock.getPostWithSlug.mockRejectedValue(error);
      await expect(postController.slugTestWithID(slug)).rejects.toBe(error);
      expect(slugServiceMock.getPostWithSlug).toHaveBeenCalledWith(
        slug,
        undefined,
      );
    });
  });

  describe('show', () => {
    it('should return a post by id', async () => {
      const id = 1;
      const article = createPostMock({ id });

      articleServiceMock.showForReader.mockResolvedValue(article);

      const response = await postController.show(id);

      expect(articleServiceMock.showForReader).toHaveBeenCalledWith(
        { id },
        undefined,
      );

      expect(response).toEqual({
        message: `L'article ${article.id} a bien été trouvé.`,
        data: article,
        meta: undefined,
      });
    });

    it('should throw an error if post is not found', async () => {
      const id = 1;
      const error = new Error('Post not found');

      articleServiceMock.showForReader.mockRejectedValue(error);

      await expect(postController.show(id)).rejects.toThrow(error);

      expect(articleServiceMock.showForReader).toHaveBeenCalledWith(
        { id },
        undefined,
      );
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const id = 1;
      const userId = 10;
      const dto = updatePostDtoMock();

      const sessionUser = createSessionUserMock(userId);

      const updatedPost = createPostMock({
        id,
        title: dto.title,
        content: dto.content,
      });

      articleServiceMock.update.mockResolvedValue(updatedPost);

      const response = await postController.updatePost(id, dto, sessionUser);

      expect(articleServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        userId,
      );

      expect(response).toEqual({
        message: 'La publication a été modifiée !',
        data: updatedPost,
        meta: undefined,
      });
    });

    it('should throw an error if post update fails', async () => {
      const id = 1;
      const userId = 10;
      const dto = updatePostDtoMock();
      const error = new Error('Post update failed');

      const sessionUser = createSessionUserMock(userId);

      articleServiceMock.update.mockRejectedValue(error);

      await expect(
        postController.updatePost(id, dto, sessionUser),
      ).rejects.toThrow(error);

      expect(articleServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        userId,
      );
    });
  });

  describe('destroy', () => {
    it('should return a success message if post is deleted', async () => {
      const id = 1;

      articleServiceMock.destroy.mockResolvedValue(undefined);

      const response = await postController.destroy(id);

      expect(articleServiceMock.destroy).toHaveBeenCalledWith({ id });

      expect(response).toEqual({
        message: 'La suppression de votre publication est un succès !',
        data: null,
        meta: undefined,
      });
    });

    it('should throw an error if post deletion fails', async () => {
      const id = 1;
      const error = new Error('Post delete failed');

      articleServiceMock.destroy.mockRejectedValue(error);

      await expect(postController.destroy(id)).rejects.toThrow(error);

      expect(articleServiceMock.destroy).toHaveBeenCalledWith({ id });
    });
  });
});
