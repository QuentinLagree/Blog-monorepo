import { UserService } from 'src/modules/user/user.service';
import { ArticleService } from 'src/modules/post/posts.service';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';
import { PostAlreadyPublishException } from 'src/modules/user/exceptions/post-already-publish.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { postServiceMock } from '../mocks/mocks';
import { createUserMock } from '../mocks/create.user.mocks';
import { UserToPostController } from 'src/modules/user/user-posts.controller';
import { createPostMock } from '../mocks/create_post.mocks';

describe('UserToPostController', () => {
  let userToPostController: UserToPostController;

  const userServiceMock = {
    show: jest.fn(),
  };

  const createPostDtoMock = (override = {}) => ({
    title: 'Post test',
    content: 'Contenu test',
    ...override,
  });

  const createPublishedPostDtoMock = (override = {}) => ({
    published_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    userToPostController = new UserToPostController(
      userServiceMock as unknown as UserService,
      postServiceMock as unknown as ArticleService,
    );
  });

  describe('getAllUserDrafts', () => {
    it('should return an empty message if user drafts list is empty', async () => {
      const id = 1;
      const user = createUserMock({ id });

      userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue([]);

      const response = await userToPostController.getAllUserDrafts(id);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
        published_at: null,
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

      userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue(posts);

      const response = await userToPostController.getAllUserDrafts(id);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });

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

      userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(id),
      );

      await expect(
        userToPostController.getAllUserDrafts(id),
      ).rejects.toThrow(UserNotFoundException);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });
      expect(postServiceMock.indexWhere).not.toHaveBeenCalled();
    });
  });

  describe('getAllPublishedPostsOfUser', () => {
    it('should return an empty message if published posts list is empty', async () => {
      const id = 1;
      const user = createUserMock({ id });

      userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue([]);

      const response = await userToPostController.getAllPublishedPostsOfUser(id);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
        published_at: {
          not: null,
        },
      });

      expect(response).toEqual(
        makeMessage(
          `List of all published posts of ${user.nom} ${user.prenom} is empty.`,
          `La liste des publications publiées de l'utilisateur ${user.nom} ${user.prenom} est vide.`,
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

      userServiceMock.show.mockResolvedValue(user);
      postServiceMock.indexWhere.mockResolvedValue(posts);

      const response = await userToPostController.getAllPublishedPostsOfUser(id);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });

      expect(postServiceMock.indexWhere).toHaveBeenCalledWith({
        authorId: id,
        published_at: {
          not: null,
        },
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

      userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(id),
      );

      await expect(
        userToPostController.getAllPublishedPostsOfUser(id),
      ).rejects.toThrow(UserNotFoundException);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });
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

      userServiceMock.show.mockResolvedValue(author);
      postServiceMock.store.mockResolvedValue(createdPost);

      const response = await userToPostController.createPost(
        dto,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(userServiceMock.show).toHaveBeenCalledWith({
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

      userServiceMock.show.mockRejectedValue(
        new UserNotFoundException(sessionUser.id),
      );

      await expect(
        userToPostController.createPost(dto, sessionMock as any),
      ).rejects.toThrow(UserNotFoundException);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(userServiceMock.show).toHaveBeenCalledWith({
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

      userServiceMock.show.mockResolvedValue(author);
      postServiceMock.store.mockRejectedValue(error);

      await expect(
        userToPostController.createPost(dto, sessionMock as any),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(userServiceMock.show).toHaveBeenCalledWith({
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

      const response = await userToPostController.publishPost(
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
        userToPostController.publishPost(id, dto, sessionMock as any),
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
        userToPostController.publishPost(id, dto, sessionMock as any),
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
        userToPostController.publishPost(id, dto, sessionMock as any),
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
});