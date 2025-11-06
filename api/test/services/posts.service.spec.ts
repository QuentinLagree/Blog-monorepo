import { TestingModule, Test } from '@nestjs/testing';
import { NotFoundException, ValidationError } from '@nestjs/common';
import { Post } from '@prisma/client';
import { PostsService } from './posts.service';
import {
  CreatePrismaServiceMock,
  PrismaUserServiceMockType,
} from 'test/mocks/services/database/create.prisma.service.mocks';
import { PrismaService } from 'src/database/prisma.service';
import { createPostMock } from 'src/usecases/mocks/create_post.mocks';

const FATAL_ERROR = 'Database Down';

describe('PostService', () => {
  let _posts: PostsService;
  let _prisma: PrismaUserServiceMockType;

  // Initialisation avant chaque test
  beforeEach(async () => {
    _prisma = CreatePrismaServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      providers: [PostsService, { provide: PrismaService, useValue: _prisma }],
    }).compile();

    _posts = app.get<PostsService>(PostsService);
  });

  describe('PostService - providers are defined', () => {
    it('PostService should be defined', () => {
      expect(_posts).toBeDefined();
    });

    it('Prisma Service should be defined', () => {
      expect(_prisma).toBeDefined();
    });
  });

  describe('PostService - index()', () => {
    beforeEach(() => {
      _prisma.post.findMany.mockReset();
    });
    it('should return an array of post', async () => {
      const users: Partial<Post>[] = [
        createPostMock(),
        createPostMock({ id: 2 }),
      ];
      _prisma.post.findMany.mockResolvedValue(users);

      const result: Promise<Post[]> = _posts.index();

      await expect(result).resolves.toEqual(users);
      expect(_prisma.post.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findMany()).resolves.toEqual(users);
      expect(_prisma.post.findMany).toHaveBeenCalledWith();
    });

    it('should return an empty list of posts', async () => {
      _prisma.post.findMany.mockResolvedValue([]);

      const result: Promise<Post[]> = _posts.index();

      await expect(result).resolves.toEqual([]);
      expect(_prisma.post.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findMany()).resolves.toEqual([]);
      expect(_prisma.post.findMany).toHaveBeenCalledWith();
    });
  });

  describe('PostService - index(true) -- Published Post', () => {
    beforeEach(() => {
      _prisma.post.findMany.mockReset();
    });
    it('should return an array of post', async () => {
      const users: Partial<Post>[] = [
        createPostMock({ published: true }),
        createPostMock({ id: 2 }),
      ];
      _prisma.post.findMany.mockResolvedValue(
        users.filter((post) => post.published),
      );

      const result: Promise<Post[]> = _posts.index(true);

      await expect(result).resolves.toEqual([users[0]]);
      expect(_prisma.post.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findMany()).resolves.toEqual([users[0]]);
      expect(_prisma.post.findMany).toHaveBeenCalledWith();
    });

    it('should return an empty list of published posts', async () => {
      const posts = [createPostMock()];
      _prisma.post.findMany.mockResolvedValue(
        posts.filter((post) => post.published),
      );

      const result: Promise<Post[]> = _posts.index(true);

      await expect(result).resolves.toEqual([]);
      expect(_prisma.post.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findMany()).resolves.toEqual([]);
      expect(_prisma.post.findMany).toHaveBeenCalledWith();
    });
  });

  describe('PostService - show()', () => {
    beforeEach(() => {
      _prisma.post.findUnique.mockReset();
    });
    it('should return a post when found', async () => {
      const post: Partial<Post> = createPostMock({ id: 42 });
      _prisma.post.findUnique.mockResolvedValue(post);

      const result: Promise<Post> = _posts.show({ id: 42 });

      await expect(result).resolves.toEqual(post);
      expect(_prisma.post.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findUnique()).resolves.toEqual(post);
      expect(_prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('sould return an error message when ID is undefined', async () => {
      _prisma.post.findUnique.mockResolvedValue(undefined);
      await expect(_posts.show(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(_prisma.post.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findUnique()).resolves.toBe(undefined);
      expect(_prisma.post.findUnique).toHaveBeenCalledWith({
        where: undefined,
      });
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      _prisma.post.findUnique.mockResolvedValue(undefined);
      await expect(_posts.show(1.5 as any)).rejects.toThrow(NotFoundException);
      expect(_prisma.post.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findUnique()).resolves.toBe(undefined);
      expect(_prisma.post.findUnique).toHaveBeenCalledWith({ where: 1.5 });
    });

    it('should throw NotFoundExcpetion when a user is not found', async () => {
      _prisma.post.findUnique.mockResolvedValue(null);

      await expect(_posts.show({ id: 999 })).rejects.toThrow(NotFoundException);
      expect(_prisma.post.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findUnique()).resolves.toBe(null);
      expect(_prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should return a Fatal Error (database down)', async () => {
      _prisma.post.findUnique.mockRejectedValue(new Error(FATAL_ERROR));

      await expect(_posts.show({ id: 1 })).rejects.toThrow(FATAL_ERROR);
      expect(_prisma.post.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.post.findUnique()).rejects.toThrow(
        Error(FATAL_ERROR),
      );
    });
  });

  describe('PostService - destroy()', () => {
    it('should delete a post', async () => {
      const userToDelete = createPostMock({ id: 1 });
      _prisma.post.findUnique.mockResolvedValue(userToDelete);
      _prisma.post.delete.mockResolvedValue(undefined);

      await expect(_posts.destroy({ id: 1 })).resolves.toBeUndefined();

      expect(_prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(_prisma.post.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if user not found', async () => {
      _prisma.post.findUnique.mockResolvedValue(null);

      await expect(_posts.destroy({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      await expect(_posts.destroy(1.5 as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if database down', async () => {
      _prisma.post.delete.mockRejectedValue(new Error('Database Down'));

      await expect(_posts.destroy({ id: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
