import { ArticleService } from 'src/modules/post/posts.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { Role } from 'src/commons/roles/role.enum';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorisation.exception';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { UpdatePostDto } from 'src/modules/post/dto/update.post.dto';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';

describe('ArticleService', () => {
  let articleService: ArticleService;

  const prismaMock = {
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const createPostMock = (override = {}) => ({
    id: 1,
    title: 'Post test',
    content: 'Content test',
    description: 'Description test',
    authorId: 1,
    published_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  const createUserMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    pseudo: 'testuser',
    nom: 'Doe',
    prenom: 'John',
    role: Role.User,
    created_at: new Date(),
    updated_at: new Date(),
    posts: [],
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    articleService = new ArticleService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('countAll', () => {
    it('should count all posts', async () => {
      prismaMock.post.count.mockResolvedValue(5);

      const response = await articleService.countAll();

      expect(prismaMock.post.count).toHaveBeenCalledTimes(1);
      expect(response).toBe(5);
    });
  });

  describe('countByPublishedStatus', () => {
    it('should count published posts', async () => {
      prismaMock.post.count.mockResolvedValue(3);

      const response = await articleService.countByPublishedStatus(true);

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: {
            not: null,
          },
        },
      });

      expect(response).toBe(3);
    });

    it('should count draft posts', async () => {
      prismaMock.post.count.mockResolvedValue(2);

      const response = await articleService.countByPublishedStatus(false);

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: null,
        },
      });

      expect(response).toBe(2);
    });
  });

  describe('index', () => {
    it('should return posts with default pagination', async () => {
      const posts = [createPostMock({ id: 1 }), createPostMock({ id: 2 })];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.index({} as any);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {},
      });

      expect(response).toEqual(posts);
    });

    it('should return posts with custom pagination', async () => {
      const posts = [createPostMock({ id: 11 })];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.index({
        page: 2,
        limit: 10,
      } as any);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 10,
        where: {},
      });

      expect(response).toEqual(posts);
    });

    it('should return only published posts when published is true', async () => {
      const posts = [
        createPostMock({
          published_at: new Date(),
        }),
      ];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.index({
        page: 1,
        limit: 10,
        published: true,
      } as any);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {
          published_at: {
            not: null,
          },
        },
      });

      expect(response).toEqual(posts);
    });

    it('should return only drafts when published is false', async () => {
      const posts = [
        createPostMock({
          published_at: null,
        }),
      ];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.index({
        page: 1,
        limit: 10,
        published: false,
      } as any);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {
          published_at: null,
        },
      });

      expect(response).toEqual(posts);
    });
  });

  describe('indexWhere', () => {
    it('should return posts with where filter', async () => {
      const where = {
        authorId: 1,
        published_at: null,
      };

      const posts = [createPostMock({ authorId: 1 })];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.indexWhere(where);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        where,
      });

      expect(response).toEqual(posts);
    });
  });

  describe('indexOneWhere', () => {
    it('should return one post with unique where', async () => {
      const where = { id: 1 };
      const post = createPostMock({ id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);

      const response = await articleService.indexOneWhere(where);

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where,
      });

      expect(response).toEqual(post);
    });
  });

  describe('show', () => {
    it('should return one post', async () => {
      const post = createPostMock({ id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);

      const response = await articleService.show({ id: 1 });

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(response).toEqual(post);
    });

    it('should throw PostNotFoundException if post is not found', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(articleService.show({ id: 1 })).rejects.toThrow(
        PostNotFoundException,
      );

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('store', () => {
    it('should create a post', async () => {
      const dto = {
        title: 'Post test',
        content: 'Content test',
        description: 'Description test',
      } as CreatePostDto;

      const author = createUserMock({ id: 1 });
      const createdPost = createPostMock({
        id: 1,
        title: dto.title,
        content: dto.content,
        description: dto.description,
        authorId: author.id,
      });

      prismaMock.post.create.mockResolvedValue(createdPost);

      const response = await articleService.store(dto, author as any);

      expect(prismaMock.post.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          content: dto.content,
          description: dto.description,
          published_at: null,
          author: {
            connect: {
              id: author.id,
            },
          },
        },
        include: {
          author: {
            select: expect.any(Object),
          },
        },
      });

      expect(response).toEqual(createdPost);
    });
  });

  describe('update', () => {
    it('should update a post if user is author', async () => {
      const where = { id: 1 };
      const userId = 1;

      const post = createPostMock({
        id: 1,
        authorId: userId,
      });

      const dto = {
        title: 'Updated title',
      } as UpdatePostDto;

      const updatedPost = createPostMock({
        id: 1,
        authorId: userId,
        title: 'Updated title',
      });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue({
        role: Role.User,
      });
      prismaMock.post.update.mockResolvedValue(updatedPost);

      const response = await articleService.update(where, dto, userId);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { role: true },
      });

      expect(prismaMock.post.update).toHaveBeenCalledWith({
        where: {
          id: post.id,
        },
        data: dto,
      });

      expect(response).toEqual(updatedPost);
    });

    it('should update a post if user is admin', async () => {
      const where = { id: 1 };
      const userId = 99;

      const post = createPostMock({
        id: 1,
        authorId: 1,
      });

      const dto = {
        title: 'Updated by admin',
      } as UpdatePostDto;

      const updatedPost = createPostMock({
        id: 1,
        title: 'Updated by admin',
      });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue({
        role: Role.Admin,
      });
      prismaMock.post.update.mockResolvedValue(updatedPost);

      const response = await articleService.update(where, dto, userId);

      expect(prismaMock.post.update).toHaveBeenCalledWith({
        where: {
          id: post.id,
        },
        data: dto,
      });

      expect(response).toEqual(updatedPost);
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      const where = { id: 1 };
      const userId = 1;
      const post = createPostMock({ id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        articleService.update(where, { title: 'Updated' } as UpdatePostDto, userId),
      ).rejects.toThrow(UserNotFoundException);

      expect(prismaMock.post.update).not.toHaveBeenCalled();
    });

    it('should throw UserNotHaveAuthorisation if user is not author or admin', async () => {
      const where = { id: 1 };
      const userId = 2;

      const post = createPostMock({
        id: 1,
        authorId: 1,
      });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue({
        role: Role.User,
      });

      await expect(
        articleService.update(where, { title: 'Updated' } as UpdatePostDto, userId),
      ).rejects.toThrow(UserNotHaveAuthorisation);

      expect(prismaMock.post.update).not.toHaveBeenCalled();
    });

    it('should publish a post with PublishedPostDto', async () => {
      const where = { id: 1 };
      const userId = 1;
      const publishedAt = new Date();

      const post = createPostMock({
        id: 1,
        authorId: userId,
        published_at: null,
      });

      const dto = {
        published_at: publishedAt,
      } as PublishedPostDto;

      const updatedPost = createPostMock({
        id: 1,
        authorId: userId,
        published_at: publishedAt,
      });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue({
        role: Role.User,
      });
      prismaMock.post.update.mockResolvedValue(updatedPost);

      const response = await articleService.update(where, dto, userId);

      expect(prismaMock.post.update).toHaveBeenCalledWith({
        where: {
          id: post.id,
        },
        data: dto,
      });

      expect(response).toEqual(updatedPost);
    });
  });

  describe('destroy', () => {
    it('should delete a post', async () => {
      const where = { id: 1 };
      const post = createPostMock({ id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.post.delete.mockResolvedValue(post);

      await articleService.destroy(where);

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where,
      });

      expect(prismaMock.post.delete).toHaveBeenCalledWith({
        where,
      });
    });

    it('should throw PostNotFoundException if post does not exist', async () => {
      const where = { id: 1 };

      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(articleService.destroy(where)).rejects.toThrow(
        PostNotFoundException,
      );

      expect(prismaMock.post.delete).not.toHaveBeenCalled();
    });
  });

  describe('isPublished', () => {
    it('should return true if post has published_at', () => {
      const post = createPostMock({
        published_at: new Date(),
      });

      expect(articleService.isPublished(post as any)).toBe(true);
    });

    it('should return false if post published_at is null', () => {
      const post = createPostMock({
        published_at: null,
      });

      expect(articleService.isPublished(post as any)).toBe(false);
    });
  });
});