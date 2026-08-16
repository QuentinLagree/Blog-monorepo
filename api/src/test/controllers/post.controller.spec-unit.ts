import { PostController } from 'src/modules/post/posts.controller';
import { ArticleService } from 'src/modules/post/posts.service';
import { UserService } from 'src/modules/user/user.service';
import { SlugService } from 'src/commons/services/slug.service';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { UpdatePostDto } from 'src/modules/post/dto/update.post.dto';
import { PaginationDto } from 'src/modules/pagination/pagination.dto';
import { postServiceMock, slugServiceMock, userServiceMock } from '../mocks/mocks';
import { createPostMock } from '../mocks/create_post.mocks';
import { createUserMock } from '../mocks/create.user.mocks';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';
import { PostAlreadyPublishException } from 'src/modules/user/exceptions/post-already-publish.exception';

describe('PostController', () => {
  let postController: PostController;
  const _userServiceMock = userServiceMock;

  const articleServiceMock = postServiceMock;

  const createPublishedPostDtoMock = (override = {}) => ({
    published_at: new Date(),
    ...override,
  });
  
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

    const meta = undefined;
    const sessionUser = {
        id: 1,
        email: 'test@test.com',
        role: 'User',
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

    articleServiceMock.index.mockResolvedValue([[], meta]);

    const response = await postController.index(payload, sessionMock as any);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload, sessionUser.id);

    expect(response).toEqual(
      makeMessage(
        'List of all posts is empty.',
        'La liste des publications est vide',
        [],
        meta
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
    const sessionUser = {
        id: 1,
        email: 'test@test.com',
        role: 'User',
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

    const meta = {
      currentPage: 1,
      limit: 10,
      totalArticle: 2,
    };

    articleServiceMock.index.mockResolvedValue([posts, meta]);

    const response = await postController.index(payload, sessionMock as any);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload, sessionUser.id);

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

    const sessionUser = {
        id: 1,
        email: 'test@test.com',
        role: 'User',
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

    const error = new Error('Posts loading failed');

    articleServiceMock.index.mockRejectedValue(error);

    await expect(
      postController.index(payload, sessionMock as any),
    ).rejects.toThrow(error);

    expect(articleServiceMock.index).toHaveBeenCalledWith(payload, sessionUser.id);
  });
});

describe('getAllUserDrafts', () => {
    it('should return an empty message if user drafts list is empty', async () => {
      const id = 1;
      const user = createUserMock({ id });

      _userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue([]);

      const response = await postController.getAllUserDrafts(id);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
        published_at: null
      });

      expect(response).toEqual(
        makeMessage(
          `List of all draft posts of ${user.nom} ${user.prenom} is empty.`,
          `La liste des brouillons de l'utilisateur ${user.nom} ${user.prenom} est vide.`,
          null,
        ),
      );
    });

    it('should return all draft posts of user', async () => {
      const id = 1;
      const user = createUserMock({ id });
      const posts = [
        createPostMock({ id: 1, authorId: id, published_at: null }),
        createPostMock({ id: 2, authorId: id, published_at: null }),
      ];

      _userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue(posts);

      const response = await postController.getAllUserDrafts(id);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
        published_at: null,
      });

      expect(response).toEqual(
        makeMessage(
          `List of all draft posts of user ${user.nom} ${user.prenom}`,
          `Liste de tous les brouillons de ${user.nom} ${user.prenom}.`,
          posts,
        ),
      );
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const id = 1;

      _userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(id),
      );

      await expect(
        postController.getAllUserDrafts(id),
      ).rejects.toThrow(UserNotFoundException);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });
      expect(postServiceMock.indexWhere).not.toHaveBeenCalled();
    });
  });

  

  

  describe('getAllPublishedPostsOfUser', () => {
    it('should return an empty message if published posts list is empty', async () => {
      const id = 1;
      const user = createUserMock({ id });

      _userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue([]);

      const response = await postController.getAllPostsOfUser(id);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
      });

      expect(response).toEqual(
        makeMessage(
          `List of all posts of ${user.nom} ${user.prenom} is empty.`,
          `La liste des publications de l'utilisateur ${user.nom} ${user.prenom} est vide.`,
          null,
        ),
      );
    });

    it('should return all published posts of user', async () => {
      const id = 1;
      const user = createUserMock({ id });
      const publishedDate = new Date();

      const posts = [
        createPostMock({ id: 1, authorId: id, published_at: publishedDate }),
        createPostMock({ id: 2, authorId: id, published_at: publishedDate }),
      ];

      _userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue(posts);

      const response = await postController.getAllPostsOfUser(id);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
      });

      expect(response).toEqual(
        makeMessage(
          `List of all published posts of user ${user.nom} ${user.prenom}`,
          `Liste de toutes les publications publiées de ${user.nom} ${user.prenom}.`,
          posts,
        ),
      );
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const id = 1;

      _userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(id),
      );

      await expect(
        postController.getAllPostsOfUser(id),
      ).rejects.toThrow(UserNotFoundException);

      expect(_userServiceMock.show).toHaveBeenCalledWith({ id });
      expect(postServiceMock.indexWhere).not.toHaveBeenCalled();
    });
  });

  describe('createPost', () => {
    it('should create a post for the connected user', async () => {
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPostDtoMock() as CreatePostDto;
      const author = createUserMock({ id: sessionUser.id });
      const createdPost = createPostMock({
        id: 1,
        authorId: sessionUser.id,
      });

      _userServiceMock.show.mockResolvedValue(author);
      postServiceMock.store.mockResolvedValue(createdPost);

      const response = await postController.createPost(
        dto,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(postServiceMock.store).toHaveBeenCalledWith(
        dto,
        author,
      );

      expect(response).toEqual(
        makeMessage(
          'Post created success',
          'La publication est créée, allez sur votre compte pour la visualiser.',
          createdPost,
        ),
      );
    });

    it('should throw UserNotFoundException if connected user is not found', async () => {
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPostDtoMock() as CreatePostDto;

      _userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(sessionUser.id),
      );

      await expect(
        postController.createPost(dto, sessionMock as any),
      ).rejects.toThrow(UserNotFoundException);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(postServiceMock.store).not.toHaveBeenCalled();
    });

    it('should throw an error if post creation fails', async () => {
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPostDtoMock() as CreatePostDto;
      const author = createUserMock({ id: sessionUser.id });
      const error = new Error('Post creation failed');

      _userServiceMock.show.mockResolvedValue(author);
      postServiceMock.store.mockRejectedValue(error);

      await expect(
        postController.createPost(dto, sessionMock as any),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.show).toHaveBeenCalledWith({
        id: sessionUser.id,
      });

      expect(postServiceMock.store).toHaveBeenCalledWith(
        dto,
        author,
      );
    });
  });

  describe('publishPost', () => {
    it('should publish a post', async () => {
      const id = 1;
      const sessionUser = {
        id: 10,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPublishedPostDtoMock() as PublishedPostDto;

      const post = createPostMock({
        id,
        published_at: null,
      });

      const updatedPost = createPostMock({
        id,
        published_at: dto.published_at,
      });

      postServiceMock.show.mockResolvedValue(post);
      postServiceMock.isPublished.mockReturnValue(false);
      postServiceMock.update.mockResolvedValue(updatedPost);

      const response = await postController.publishPost(
        id,
        dto,
        sessionMock as any,
      );

      expect(postServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(postServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        sessionUser.id,
      );

      expect(response).toEqual(
        makeMessage(
          'Post published',
          'La publication a été publiée.',
          updatedPost,
        ),
      );
    });

    it('should throw PostAlreadyPublishException if post is already published', async () => {
      const id = 1;
      const sessionUser = {
        id: 10,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPublishedPostDtoMock() as PublishedPostDto;

      const post = createPostMock({
        id,
        published_at: new Date(),
      });

      postServiceMock.show.mockResolvedValue(post);
      postServiceMock.isPublished.mockReturnValue(true);

      await expect(
        postController.publishPost(id, dto, sessionMock as any),
      ).rejects.toThrow(PostAlreadyPublishException);

      expect(postServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(postServiceMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if post is not found', async () => {
      const id = 1;
      const sessionUser = {
        id: 10,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPublishedPostDtoMock() as PublishedPostDto;
      const error = new Error('Post not found');

      postServiceMock.show.mockRejectedValue(error);

      await expect(
        postController.publishPost(id, dto, sessionMock as any),
      ).rejects.toThrow(error);

      expect(postServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.isPublished).not.toHaveBeenCalled();
      expect(postServiceMock.update).not.toHaveBeenCalled();
    });

    it('should throw an error if publish update fails', async () => {
      const id = 1;
      const sessionUser = {
        id: 10,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue(sessionUser),
      };

      const dto = createPublishedPostDtoMock() as PublishedPostDto;
      const post = createPostMock({
        id,
        published_at: null,
      });

      const error = new Error('Publish update failed');

      postServiceMock.show.mockResolvedValue(post);
      postServiceMock.isPublished.mockReturnValue(false);
      postServiceMock.update.mockRejectedValue(error);

      await expect(
        postController.publishPost(id, dto, sessionMock as any),
      ).rejects.toThrow(error);

      expect(postServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.isPublished).toHaveBeenCalledWith(post);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(postServiceMock.update).toHaveBeenCalledWith(
        { id },
        dto,
        sessionUser.id,
      );
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