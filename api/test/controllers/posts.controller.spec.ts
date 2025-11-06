import { CreatePostsServiceMock } from 'test/mocks/services/post/create_posts.service.mocks';
import { PostController } from './posts.controller';
import { PostsService } from './posts.service';
import { Test, TestingModule } from '@nestjs/testing';
import { createPostMock } from 'src/usecases/mocks/create_post.mocks';
import { makeMessage, Message } from 'src/commons/helpers/logger.helper';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ID } from 'src/commons/types/id.types';
import { Post } from '@prisma/client';
import { expectHttpExceptionWithMessage } from 'test/helpers/HTTPExceptionErrorHandleTest.utils';

const FATAL_ERROR = 'Database Down';
let hasValidIDMock: jest.SpyInstance;

describe('PostsController Tests', () => {
  let controller: PostController;
  let _posts: { [K in keyof PostsService]: jest.Mock };

  beforeEach(async () => {
    _posts = CreatePostsServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostsService, useValue: _posts }],
    }).compile();

    controller = app.get<PostController>(PostController);
  });
  describe('PostController - providers are defined', () => {
    it('controller should be defined ', () => {
      expect(controller).toBeDefined();
    });
    it('postService should be defined ', () => {
      expect(_posts).toBeDefined();
    });
  });

  describe('PostController - index()', () => {
    beforeEach(() => {
      _posts.index.mockReset();
    });
    afterEach(() => jest.restoreAllMocks());
    it('Should return an array of user', async () => {
      const posts = [createPostMock(), createPostMock({ id: 2 })];
      _posts.index.mockResolvedValue(posts);

      const result: Promise<Message> = controller.index();

      expect(_posts.index).toHaveBeenCalled();
      await expect(result).resolves.toEqual({
        message: 'Liste de toutes les publications',
        data: posts,
      });
    });
    it('Should return an empty list of users', async () => {
      _posts.index.mockResolvedValue([]);

      const result: Promise<Message> = controller.index();

      expect(_posts.index).toHaveBeenCalled();

      await expect(result).resolves.toEqual({
        message: 'La liste des publications est vide',
        data: null,
      });
    });

    it('Should return a Fatal Error (ex: crash server or prisma)', async () => {
      const error = new Error(FATAL_ERROR);
      _posts.index.mockRejectedValue(error);

      await expect(_posts.index).rejects.toThrow(error);

      await expectHttpExceptionWithMessage(
        () => controller.index(),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
    });
  });

  describe('PostController - indexPublished', () => {
    beforeEach(() => {
      _posts.index.mockReset();
    });
    afterEach(() => jest.restoreAllMocks());
    it('Should return an array of user', async () => {
      const posts = [
        createPostMock({ published: true }),
        createPostMock({ id: 2 }),
      ];
      _posts.index.mockResolvedValue(posts.filter((post) => post.published));

      const result: Promise<Message> = controller.indexPublished();

      expect(_posts.index).toHaveBeenCalled();
      await expect(result).resolves.toEqual({
        message: 'Liste de toutes les publications publiées',
        data: [posts[0]],
      });
    });
    it('Should return an empty list of users', async () => {
      _posts.index.mockResolvedValue([]);

      const result: Promise<Message> = controller.indexPublished();

      expect(_posts.index).toHaveBeenCalled();

      await expect(result).resolves.toEqual({
        message: 'La liste des publications publiées est vide',
        data: null,
      });
    });

    it('Should return a Fatal Error (ex: crash server or prisma)', async () => {
      const error = new Error(FATAL_ERROR);
      _posts.index.mockRejectedValue(error);

      await expect(_posts.index).rejects.toThrow(error);

      await expectHttpExceptionWithMessage(
        () => controller.index(),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
    });
  });

  describe('UserController - show()', () => {
    beforeEach(() => {
      _posts.show.mockReset();
      hasValidIDMock = jest.spyOn(ID, 'hasValid');
      hasValidIDMock.mockReset();
      hasValidIDMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());

    it('Should return a post when found with id', async () => {
      const id = 42;
      const post: Partial<Post> = createPostMock({ id });
      _posts.show.mockResolvedValue(post);

      const result: Promise<Message> = controller.show(id);

      expect(_posts.show).toHaveBeenCalledTimes(1);
      expect(_posts.show).toHaveBeenCalledWith({ id });

      await expect(result).resolves.toEqual({
        message: `La publication 42 a bien été trouvé.`,
        data: post,
      });
    });
    it('sould return an error message when ID is undefined', async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.show(undefined as any),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : 'undefined' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(undefined);
      expect(hasValid).toHaveLastReturnedWith(false);
    });

    it("Should return an Error when id isn't valid (decimal number)", async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);
      await expectHttpExceptionWithMessage(
        () => controller.show(1.5),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : 'undefined' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(1.5);
      expect(hasValid).toHaveLastReturnedWith(false);
      expect(_posts.show).toHaveBeenCalledTimes(0);
    });

    it('Should return a post with unknow id from database', async () => {
      _posts.show.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.show(999),
        HttpStatus.NOT_FOUND,
        makeMessage(
          `Posts Not Found with id 999`,
          `La publication 999 n'a pas été trouvé.`,
          null,
        ),
      );
      expect(_posts.show).toHaveBeenCalledTimes(1);
      expect(_posts.show).toHaveBeenCalledWith({ id: 999 });
      await expect(_posts.show).rejects.toThrow(NotFoundException);
    });

    it('sould return a Fatal Error (ex: crash server or prisma)', async () => {
      const error = new Error(FATAL_ERROR);
      _posts.show.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.show(1),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
      expect(_posts.show).toHaveBeenCalledTimes(1);
      expect(_posts.show).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('UserController - destroy()', () => {
    beforeEach(() => {
      _posts.destroy.mockReset();
      hasValidIDMock = jest.spyOn(ID, 'hasValid');
      hasValidIDMock.mockReset();
      hasValidIDMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());

    it('should delete post with success message', async () => {
      _posts.destroy.mockResolvedValue(null);

      const result: Promise<Message> = controller.destroy(1);

      hasValidIDMock;

      await expect(result).resolves.toEqual({
        message: 'La suppression de votre publication est un succée !',
        data: null,
      });

      expect(_posts.destroy).toHaveBeenCalledTimes(1);
      expect(_posts.destroy).toHaveBeenCalledWith({ id: 1 });
      expect(_posts.destroy).toHaveReturned();
    });

    it('should return a message when post is not found', async () => {
      const id: number = 999;

      _posts.destroy.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.destroy(id),
        HttpStatus.NOT_FOUND,
        makeMessage(
          'Post deleted failed',
          `Cette publication n'existe pas.`,
          null,
        ),
      );
      expect(_posts.destroy).toHaveBeenCalledTimes(1);
      await expect(_posts.destroy).rejects.toThrow(NotFoundException);
      expect(_posts.destroy).toHaveBeenCalledWith({ id: 999 });
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.destroy(1.5),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : '1.5' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(1.5);
      expect(_posts.destroy).toHaveBeenCalledTimes(0);
    });

    it('should throw error if database down', async () => {
      const error = new Error(FATAL_ERROR);
      _posts.destroy.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.destroy(1),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
      );
      expect(_posts.destroy).toHaveBeenCalledTimes(1);
      await expect(_posts.destroy()).rejects.toThrow(Error(FATAL_ERROR));
    });
  });
});
