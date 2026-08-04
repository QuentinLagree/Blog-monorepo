import { PostController } from 'src/modules/post/posts.controller';
import { ArticleService } from 'src/modules/post/posts.service';
import { UserService } from 'src/modules/user/user.service';
import { SlugService } from 'src/commons/services/slug.service';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { UpdatePostDto } from 'src/modules/post/dto/update.post.dto';
import { PaginationDto } from 'src/modules/pagination/pagination.dto';
import { slugServiceMock, userServiceMock } from '../mocks/mocks';
import { createPostMock } from '../mocks/create_post.mocks';
import { createUserMock } from '../mocks/create.user.mocks';

describe('PostController', () => {
  let postController: PostController;

  const articleServiceMock = {
    index: jest.fn(),
    show: jest.fn(),
    store: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  const createPostDtoMock = (override = {}) => ({
    title: 'Titre test',
    description: 'edede',
    content: 'Contenu test',
    published_at: new Date(),
    authorId: 1,
    ...override,
  });

  const updatePostDtoMock = (override = {}) => ({
    title: 'Titre modifié',
    content: 'Contenu modifié',
    published: true,
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

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
    } as PaginationDto;

    const meta = {
      currentPage: 1,
      limit: 10,
      totalArticle: 0,
    };

    articleServiceMock.index.mockResolvedValue([[], meta]);

    const response = await postController.index(payload);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload);

    expect(response).toEqual(
      makeMessage(
        'List of all posts is empty.',
        'La liste des publications est vide',
        [],
      ),
    );
  });

  it('should return posts list with pagination meta', async () => {
    const payload = {
      page: 1,
      limit: 10,
    } as PaginationDto;

    const posts = [
      createPostMock({ id: 1 }),
      createPostMock({ id: 2 }),
    ];

    const meta = {
      currentPage: 1,
      limit: 10,
      totalArticle: 2,
    };

    articleServiceMock.index.mockResolvedValue([posts, meta]);

    const response = await postController.index(payload);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload);

    expect(response).toEqual(
      makeMessage(
        'List of all posts',
        'Liste de toutes les publications',
        posts,
        meta,
      ),
    );
  });

  it('should throw an error if posts loading fails', async () => {
    const payload = {
      page: 1,
      limit: 10,
    } as PaginationDto;

    const error = new Error('Posts loading failed');

    articleServiceMock.index.mockRejectedValue(error);

    await expect(
      postController.index(payload),
    ).rejects.toThrow(error);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload);
  });
});

  describe('slugTestWithID', () => {
    it('should return a post by slug', async () => {
      const slug = 'titre-test';
      const article = createPostMock({ title: 'titre test' });

      slugServiceMock.getPostWithSlug.mockResolvedValue(article);

      const response = await postController.slugTestWithID(slug);

      expect(slugServiceMock.getPostWithSlug).toHaveBeenCalledWith(slug);

      expect(response).toEqual(
        makeMessage(
          'Post found !',
          'Article trouvé !',
          article,
        ),
      );
    });
  });

  describe('show', () => {
    it('should return a post by id', async () => {
      const id = 1;
      const article = createPostMock({ id });

      articleServiceMock.show.mockResolvedValue(article);

      const response = await postController.show(id);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });

      expect(response).toEqual(
        makeMessage(
          `Post found with ID: ${article.id}!`,
          `La publication ${article.id} a bien été trouvé.`,
          article,
        ),
      );
    });

    it('should throw an error if post is not found', async () => {
      const id = 1;
      const error = new Error('Post not found');

      articleServiceMock.show.mockRejectedValue(error);

      await expect(postController.show(id)).rejects.toThrow(error);

      expect(articleServiceMock.show).toHaveBeenCalledWith({ id });
    });
  });

  describe('store', () => {
  it('should create a post for the authenticated user', async () => {
    const dto = createPostDtoMock() as CreatePostDto;
    const authenticatedUserId = 1;

    const author = createUserMock({
      id: authenticatedUserId,
    });

    const createdPost = createPostMock({
      id: 1,
      authorId: authenticatedUserId,
    });

    const sessionMock = {
      get: jest.fn().mockReturnValue({
        id: authenticatedUserId,
      }),
    };

    userServiceMock.show.mockResolvedValue(author);
    articleServiceMock.store.mockResolvedValue(createdPost);

    const response = await postController.store(
      dto,
      sessionMock as any,
    );

    expect(sessionMock.get).toHaveBeenCalledWith('user');

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: authenticatedUserId,
    });

    expect(articleServiceMock.store).toHaveBeenCalledWith(
      dto,
      author,
    );

    expect(response).toEqual(
      makeMessage(
        'Post created !',
        'La publication a été créée !',
        createdPost,
      ),
    );
  });

  it('should use the session user instead of the DTO authorId', async () => {
    const dto = createPostDtoMock({
      authorId: 999,
    }) as CreatePostDto;

    const authenticatedUserId = 1;

    const author = createUserMock({
      id: authenticatedUserId,
    });

    const createdPost = createPostMock({
      id: 1,
      authorId: authenticatedUserId,
    });

    const sessionMock = {
      get: jest.fn().mockReturnValue({
        id: authenticatedUserId,
      }),
    };

    userServiceMock.show.mockResolvedValue(author);
    articleServiceMock.store.mockResolvedValue(createdPost);

    await postController.store(dto, sessionMock as any);

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: authenticatedUserId,
    });

    expect(userServiceMock.show).not.toHaveBeenCalledWith({
      id: dto.authorId,
    });
  });

  it('should throw an error if authenticated user is not found', async () => {
    const dto = createPostDtoMock() as CreatePostDto;
    const authenticatedUserId = 999;
    const error = new Error('User not found');

    const sessionMock = {
      get: jest.fn().mockReturnValue({
        id: authenticatedUserId,
      }),
    };

    userServiceMock.show.mockRejectedValue(error);

    await expect(
      postController.store(dto, sessionMock as any),
    ).rejects.toThrow(error);

    expect(sessionMock.get).toHaveBeenCalledWith('user');

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: authenticatedUserId,
    });

    expect(articleServiceMock.store).not.toHaveBeenCalled();
  });

  it('should throw an error if post creation fails', async () => {
    const dto = createPostDtoMock() as CreatePostDto;
    const authenticatedUserId = 1;

    const author = createUserMock({
      id: authenticatedUserId,
    });

    const error = new Error('Post creation failed');

    const sessionMock = {
      get: jest.fn().mockReturnValue({
        id: authenticatedUserId,
      }),
    };

    userServiceMock.show.mockResolvedValue(author);
    articleServiceMock.store.mockRejectedValue(error);

    await expect(
      postController.store(dto, sessionMock as any),
    ).rejects.toThrow(error);

    expect(sessionMock.get).toHaveBeenCalledWith('user');

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: authenticatedUserId,
    });

    expect(articleServiceMock.store).toHaveBeenCalledWith(
      dto,
      author,
    );
  });
});

  describe('updatePost', () => {
    it('should update a post', async () => {
      const id = 1;
      const userId = 10;
      const dto = updatePostDtoMock() as UpdatePostDto;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const updatedPost = createPostMock({
        id,
        title: dto.title,
        content: dto.content,
      });

      articleServiceMock.update.mockResolvedValue(updatedPost);

      const response = await postController.updatePost(
        id,
        dto,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(articleServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        userId,
      );

      expect(response).toEqual(
        makeMessage(
          'Post updated !',
          'La publication a été modifiée !',
          updatedPost,
        ),
      );
    });

    it('should throw an error if post update fails', async () => {
      const id = 1;
      const userId = 10;
      const dto = updatePostDtoMock() as UpdatePostDto;
      const error = new Error('Post update failed');

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      articleServiceMock.update.mockRejectedValue(error);

      await expect(
        postController.updatePost(id, dto, sessionMock as any),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

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

      expect(response).toEqual(
        makeMessage(
          'Post deleted !',
          'La suppression de votre publication est un succès !',
          null,
        ),
      );
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