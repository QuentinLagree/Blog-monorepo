import { ArticleService } from 'src/modules/post/posts.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { Role } from 'src/commons/roles/role.enum';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { UpdatePostDto } from 'src/modules/post/dto/update.post.dto';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';
import { PaginationDto } from 'src/modules/pagination/pagination.dto';
import { userSelectPayload } from 'src/modules/user/user.service';

describe('ArticleService', () => {
  let articleService: ArticleService;

  const prismaMock = {
    $transaction: jest.fn(),

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

    like: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },

    postRead: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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

  const createPostWithCountMock = (override = {}) => {
    const {
      created_at: _created_at,
      content: _content,
      ...postWithoutContent
    } = createPostMock();
    return {
      author: {
        id: 1,
        pseudo: 'testuser',
      },
      _count: {
        likes: 5,
      },
      ...postWithoutContent,
      ...override,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();

    articleService = new ArticleService(prismaMock as unknown as PrismaService);
  });

  describe('count', () => {
    it('should count all posts', async () => {
      prismaMock.post.count.mockResolvedValue(5);

      const response = await articleService.count();

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(prismaMock.post.count).toHaveBeenCalledTimes(1);
      expect(response).toBe(5);
    });

    it('should return 0 when no posts exist', async () => {
      prismaMock.post.count.mockResolvedValue(0);
      const response = await articleService.count();

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(prismaMock.post.count).toHaveBeenCalledTimes(1);
      expect(response).toBe(0);
    });

    it('should count only published posts when published is true', async () => {
      prismaMock.post.count.mockResolvedValue(5);

      const response = await articleService.count(true);

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: {
            not: null,
          },
        },
      });

      expect(prismaMock.post.count).toHaveBeenCalledTimes(1);
      expect(response).toBe(5);
    });
    it('should count only draft posts when published is false', async () => {
      prismaMock.post.count.mockResolvedValue(5);

      const response = await articleService.count(false);

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: null,
        },
      });

      expect(prismaMock.post.count).toHaveBeenCalledTimes(1);
      expect(response).toBe(5);
    });
    it('should propagate the error when Prisma count fails', async () => {
      const error = new Error('Database error');
      prismaMock.post.count.mockRejectedValue(error);

      await expect(articleService.count()).rejects.toThrow(error);
    });
  });

  describe('index', () => {
    it('should return all posts with pagination metadata', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        published: false,
      } as PaginationDto;

      const posts = [
        createPostWithCountMock({ id: 1 }),
        createPostWithCountMock({
          id: 2,
          _count: {
            likes: 8,
          },
        }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts);
      prismaMock.post.count.mockReturnValue(50);

      prismaMock.$transaction.mockResolvedValue([posts, 50]);

      const response = await articleService.index(paginationDto);

      expect(response[0]).toHaveLength(2); // Vérifie le nombre d'article retourné.

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: {
            published_at: null,
          },
          omit: {
            created_at: true,
            content: true,
          },
          include: expect.objectContaining({
            _count: {
              select: {
                likes: true,
              },
            },
            author: {
              select: {
                id: true,
                pseudo: true,
              },
            },
          }),
        }),
      );

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: null,
        },
      });

      expect(prismaMock.$transaction).toHaveBeenCalledWith([posts, 50]);

      response[0].forEach((post, index) => {
        const mock = posts[index];
        expect(post.id).toBe(mock.id);
        expect(post.like.count).toBe(mock._count.likes);
        expect(post.author.id).toBe(1);
        expect(post.author.pseudo).toBe('testuser');
        expect(post).not.toHaveProperty('_count');
        expect(post).not.toHaveProperty('created_at');
        expect(post).not.toHaveProperty('content');
      });

      expect(response[1]).toEqual({
        currentPage: 1,
        limit: 10,
        totalArticle: 50,
      });
    });

    it('should calculate the correct skip value', async () => {
      const paginationDto = {
        page: 3,
        limit: 5,
      } as PaginationDto;

      const posts = [
        createPostWithCountMock({ id: 11 }),
        createPostWithCountMock({ id: 12 }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts);
      prismaMock.post.count.mockReturnValue(12);

      prismaMock.$transaction.mockResolvedValue([posts, 12]);

      await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        }),
      );
    });

    it('should use default pagination values', async () => {
      const paginationDto = {} as PaginationDto;

      prismaMock.post.findMany.mockReturnValue([]);
      prismaMock.post.count.mockReturnValue(0);

      prismaMock.$transaction.mockResolvedValue([[], 0]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: {},
        }),
      );

      expect(response[1]).toEqual(
        expect.objectContaining({
          currentPage: 1,
          limit: 10,
        }),
      );
    });

    it('should return only published posts when published is true', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        published: true,
      } as PaginationDto;

      const posts = [
        createPostWithCountMock({
          id: 1,
          published_at: new Date(),
        }),
        createPostWithCountMock({
          id: 2,
          published_at: new Date(),
        }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts);
      prismaMock.post.count.mockReturnValue(2);

      prismaMock.$transaction.mockResolvedValue([posts, 2]);

      await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published_at: {
              not: null,
            },
          },
        }),
      );

      expect(prismaMock.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published_at: {
              not: null,
            },
          },
        }),
      );
    });

    it('should return only drafts when published is false', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        published: false,
      } as PaginationDto;

      const posts = [
        createPostWithCountMock({
          id: 1,
          published_at: null,
        }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts);
      prismaMock.post.count.mockReturnValue(1);

      prismaMock.$transaction.mockResolvedValue([posts, 1]);

      await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published_at: null,
          },
        }),
      );
      expect(prismaMock.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published_at: null,
          },
        }),
      );
    });

    it('should apply unfinished reading filter for the current user', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        reading: false,
      } satisfies PaginationDto;

      prismaMock.post.findMany.mockReturnValue([]);
      prismaMock.post.count.mockReturnValue(0);

      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await articleService.index(paginationDto, 5);

      const postReadsFilter = {
        where: {
          postReads: {
            none: {
              completed: true,
              userId: 5,
            },
          },
        },
      };

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining(postReadsFilter),
      );

      expect(prismaMock.post.count).toHaveBeenCalledWith(
        expect.objectContaining(postReadsFilter),
      );
    });

    it('should not apply reading filter when reading is true', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        reading: true,
      } satisfies PaginationDto;

      prismaMock.post.findMany.mockReturnValue([]);
      prismaMock.post.count.mockReturnValue(0);

      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await articleService.index(paginationDto, 5);

      const expectedWhere = {
        where: {},
      };

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining(expectedWhere),
      );

      expect(prismaMock.post.count).toHaveBeenCalledWith(
        expect.objectContaining(expectedWhere),
      );
    });

    it('should not apply reading filter when userId is undefined', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        reading: false,
      } satisfies PaginationDto;

      prismaMock.post.findMany.mockReturnValue([]);
      prismaMock.post.count.mockReturnValue(0);

      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await articleService.index(paginationDto);

      const expectedWhere = {
        where: {},
      };

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining(expectedWhere),
      );

      expect(prismaMock.post.count).toHaveBeenCalledWith(
        expect.objectContaining(expectedWhere),
      );
    });

    it('should throw an error if the transaction fails', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      } as PaginationDto;

      const error = new Error('Database error');

      prismaMock.post.findMany.mockReturnValue([]);
      prismaMock.post.count.mockResolvedValue(0);
      prismaMock.$transaction.mockRejectedValue(error);

      await expect(articleService.index(paginationDto)).rejects.toThrow(error);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('indexWhere', () => {
    it('should return posts matching the where filter with their like counts', async () => {
      const whereFilterAuthorId = {
        authorId: 5,
      };

      const posts = [
        createPostWithCountMock({
          authorId: 5,
          author: {
            id: 5,
            pseudo: 'testuser',
          },
        }),
      ];

      prismaMock.post.findMany.mockResolvedValue(posts);

      const response = await articleService.indexWhere(whereFilterAuthorId);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: 5,
          },
          omit: {
            created_at: true,
            content: true,
          },
          include: expect.objectContaining({
            author: {
              select: {
                id: true,
                pseudo: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          }),
        }),
      );

      expect(response).toHaveLength(posts.length);

      response.forEach((post, index) => {
        const mock = posts[index];
        expect(post.id).toBe(mock.id);
        expect(post.like.count).toBe(mock._count.likes);
        expect(post.author.id).toBe(mock.authorId);
        expect(post.author.pseudo).toBe(mock.author.pseudo);
        expect(post).not.toHaveProperty('_count');
        expect(post).not.toHaveProperty('created_at');
        expect(post).not.toHaveProperty('content');
      });
    });

    it('should return an empty array when no posts match the where filter', async () => {
      prismaMock.post.findMany.mockResolvedValue([]);

      const response = await articleService.indexWhere({
        authorId: 999,
      });

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: 999,
          },
        }),
      );

      expect(response).toEqual([]);
    });

    it('should propagate the error when Prisma findMany fails', async () => {
      const error = new Error('Database error');

      prismaMock.post.findMany.mockRejectedValue(error);

      await expect(articleService.indexWhere({})).rejects.toThrow(error);
    });
  });

  describe('indexOneWhere', () => {
    it('should return a post when it matches the unique filter', async () => {
      const post = createPostMock({ id: 5 });

      prismaMock.post.findUnique.mockResolvedValue(post);

      const response = await articleService.indexOneWhere({ id: 5 });
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });

      expect(response).toEqual(post);
    });

    it('should return null when no post matchs the unique filter', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(
        articleService.indexOneWhere({ id: 999 }),
      ).resolves.toBeNull();
    });

    it('should throw an error if findUnique fails', async () => {
      const error = new Error('Database error');
      prismaMock.post.findUnique.mockRejectedValue(error);

      await expect(articleService.indexOneWhere({ id: 1 })).rejects.toThrow(
        error,
      );
    });
  });

  describe('show', () => {
    it('should return a post when it matches the unique filter', async () => {
      const post = createPostMock({ id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);

      const response = await articleService.show({ id: 1 });

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(response).toBe(post);
    });
    it('should throw PostNotFoundException when no post matches the unique filter', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(articleService.show({ id: 999 })).rejects.toThrow(
        new PostNotFoundException(999),
      );
    });

    it('should throw an error if findUnique fails', async () => {
      const error = new Error('Database error');
      prismaMock.post.findUnique.mockRejectedValue(error);

      await expect(articleService.show({ id: 1 })).rejects.toThrow(error);
    });
  });

  describe('store', () => {
    it('should create a draft post with the provided data and author', async () => {
      const dto: CreatePostDto = {
        title: 'Post test',
        content: 'Content test',
        description: 'Description test',
      };

      const author: userSelectPayload = createUserMock({ id: 1 });
      const createdPost = createPostMock({
        id: 1,
        title: dto.title,
        content: dto.content,
        description: dto.description,
        authorId: author.id,
        author: {
          id: 1,
          pseudo: 'testuser',
          role: 'user',
          created_at: new Date(),
        },
      });

      prismaMock.post.create.mockResolvedValue(createdPost);

      const response = await articleService.store(dto, author);

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
            select: {
              id: true,
              pseudo: true,
              role: true,
              created_at: true,
            },
          },
        },
      });

      expect(response).toEqual(createdPost);
    });

    it('should propagate the error when Prisma create fails', async () => {
      const author: userSelectPayload = createUserMock({ id: 1 });
      const dto: CreatePostDto = {
        title: 'Post test',
        content: 'Content test',
        description: 'Description test',
      };

      const error = new Error('Database error');
      prismaMock.post.create.mockRejectedValue(error);

      await expect(articleService.store(dto, author)).rejects.toThrow(error);

      expect(prismaMock.post.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a post when the user is an admin', async () => {
      const dto: UpdatePostDto = {
        content: 'content',
      };
      const post = createPostMock({ authorId: 1 });
      const admin = createUserMock({ role: Role.Admin, id: 2 });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue(admin);
      prismaMock.post.update.mockResolvedValue({
        ...post,
        ...dto,
      });
      const response = await articleService.update(
        { id: post.id },
        dto,
        admin.id,
      );

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: post.id,
          },
        }),
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: admin.id,
          },
          select: {
            role: true,
          },
        }),
      );

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: post.id,
          },
          data: dto,
        }),
      );

      expect(response).toEqual(
        expect.objectContaining({
          content: dto.content,
        }),
      );
    });

    it('should update a post when the user is the author', async () => {
      const dto: PublishedPostDto = {
        published_at: new Date(),
      };
      const post = createPostMock({ authorId: 1 });
      const author = createUserMock({ role: Role.User, id: 1 });

      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue(author);
      prismaMock.post.update.mockResolvedValue({
        ...post,
        ...dto,
      });
      const response = await articleService.update(
        { id: post.id },
        dto,
        author.id,
      );

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: post.id,
          },
        }),
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: author.id,
          },
          select: {
            role: true,
          },
        }),
      );

      expect(prismaMock.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: post.id,
          },
          data: dto,
        }),
      );

      expect(response).toEqual(
        expect.objectContaining({
          published_at: dto.published_at,
        }),
      );
    });

    it('should throw UserNotHaveAuthorisation when the user is neither admin nor author', async () => {
      const dto: UpdatePostDto = {
        content: 'content',
      };
      const post = createPostMock({ authorId: 1 });
      const user = createUserMock({ role: Role.User, id: 2 });
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue(user);

      await expect(
        articleService.update({ id: post.id }, dto, user.id),
      ).rejects.toThrow(UserNotHaveAuthorisation);

      expect(prismaMock.post.update).toHaveBeenCalledTimes(0);
    });

    it('should throw UserNotFoundException when the user does not exist', async () => {
      const post = createPostMock({ id: 10 });
      const dto: UpdatePostDto = { content: 'content' };
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.user.findUnique.mockResolvedValue(null);
      const response = articleService.update({ id: post.id }, dto, 1);

      await expect(response).rejects.toThrow(UserNotFoundException);
      await expect(response).rejects.toThrow("l'utilisateur : 1 n'existe pas.");

      expect(prismaMock.post.update).toHaveBeenCalledTimes(0);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
        }),
      );
    });

    it('should throw PostNotFoundException when the post does not exist', async () => {
      const dto: UpdatePostDto = { content: 'content' };
      prismaMock.post.findUnique.mockResolvedValue(null);
      await expect(articleService.update({ id: 999 }, dto, 1)).rejects.toThrow(
        PostNotFoundException,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(0);
      expect(prismaMock.post.update).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma user.findUnique fails', async () => {
      const error = new Error('user findUnique fails');
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 1 }));
      prismaMock.user.findUnique.mockRejectedValue(error);

      await expect(
        articleService.update({ id: 1 }, { content: 'content' }, 999),
      ).rejects.toThrow(error);
      expect(prismaMock.post.update).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma post.update fails', async () => {
      const error = new Error('Update fails');
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 1 }));
      prismaMock.user.findUnique.mockResolvedValue(
        createUserMock({ id: 1, role: Role.Admin }),
      );
      prismaMock.post.update.mockRejectedValue(error);

      await expect(
        articleService.update({ id: 1 }, { content: 'content' }, 1),
      ).rejects.toThrow(error);
      expect(prismaMock.post.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should delete a post', async () => {
      const post = createPostMock({ id: 5 });
      prismaMock.post.findUnique.mockResolvedValue(post);
      prismaMock.post.delete.mockResolvedValue(post);

      const response = await articleService.destroy({ id: 5 });
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });
      expect(prismaMock.post.delete).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
      });
      expect(response).toBeUndefined();
    });

    it('should throw PostNotFoundException when the post does not exist', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);
      await expect(articleService.destroy({ id: 999 })).rejects.toThrow(
        PostNotFoundException,
      );

      expect(prismaMock.post.delete).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma post.findUnique fails', async () => {
      const error = new Error('Delete fails');
      prismaMock.post.findUnique.mockRejectedValue(error);

      await expect(articleService.destroy({ id: 1 })).rejects.toThrow(error);
      expect(prismaMock.post.delete).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma post.delete fails', async () => {
      const error = new Error('Delete fails');
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 1 }));
      prismaMock.post.delete.mockRejectedValue(error);

      await expect(articleService.destroy({ id: 1 })).rejects.toThrow(error);
      expect(prismaMock.post.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('isPublished', () => {
    it('should return true if post has publish', () => {
      const post = createPostMock({
        published_at: new Date(),
      });

      expect(articleService.isPublished(post)).toBe(true);
    });

    it('should return false if post has not publish', () => {
      const post = createPostMock({
        published_at: null,
      });

      expect(articleService.isPublished(post)).toBe(false);
    });
  });

  describe('getLikeCount', () => {
    it('should return the number of likes with liked set to false', async () => {
      const postId = 1;

      prismaMock.like.count.mockResolvedValue(5);

      const response = await articleService.getLikeCount(postId);

      expect(prismaMock.like.count).toHaveBeenCalledWith({
        where: {
          postId,
        },
      });

      expect(response).toEqual({
        liked: false,
        likesCount: 5,
      });
    });

    it('should return zero when the post has no likes', async () => {
      const postId = 1;

      prismaMock.like.count.mockResolvedValue(0);

      const response = await articleService.getLikeCount(postId);

      expect(response).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should propagate the error if counting likes fails', async () => {
      const postId = 1;
      const error = new Error('Database error');

      prismaMock.like.count.mockRejectedValue(error);

      await expect(articleService.getLikeCount(postId)).rejects.toThrow(error);
    });
  });

  describe('getLikeStatus', () => {
    it('should return the public count without looking up a personal like', async () => {
      prismaMock.like.count.mockResolvedValue(4);

      await expect(articleService.getLikeStatus(undefined, 2)).resolves.toEqual(
        {
          liked: false,
          likesCount: 4,
        },
      );
      expect(prismaMock.like.count).toHaveBeenCalledWith({
        where: { postId: 2 },
      });
      expect(prismaMock.like.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('should propagate a public count failure', async () => {
      const error = new Error('Count unavailable');
      prismaMock.like.count.mockRejectedValue(error);
      await expect(articleService.getLikeStatus(undefined, 2)).rejects.toThrow(
        error,
      );
    });

    it('should return liked true when the user has liked the post', async () => {
      const userId = 1;
      const postId = 2;

      const like = {
        id: 1,
        userId,
        postId,
        created_at: new Date(),
      };

      prismaMock.like.findUnique.mockResolvedValue(like);
      prismaMock.like.count.mockResolvedValue(4);

      prismaMock.$transaction.mockResolvedValue([like, 4]);

      const response = await articleService.getLikeStatus(userId, postId);

      expect(prismaMock.like.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      expect(prismaMock.like.count).toHaveBeenCalledWith({
        where: {
          postId,
        },
      });

      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        prismaMock.like.findUnique.mock.results[0].value,
        prismaMock.like.count.mock.results[0].value,
      ]);

      expect(response).toEqual({
        liked: true,
        likesCount: 4,
      });
    });

    it('should return liked false when the user has not liked the post', async () => {
      const userId = 1;
      const postId = 2;

      prismaMock.like.findUnique.mockResolvedValue(null);
      prismaMock.like.count.mockResolvedValue(3);

      prismaMock.$transaction.mockResolvedValue([null, 3]);

      const response = await articleService.getLikeStatus(userId, postId);

      expect(response).toEqual({
        liked: false,
        likesCount: 3,
      });
    });

    it('should propagate the error if the transaction fails', async () => {
      const userId = 1;
      const postId = 2;
      const error = new Error('Transaction error');

      prismaMock.like.findUnique.mockResolvedValue(null);
      prismaMock.like.count.mockResolvedValue(0);
      prismaMock.$transaction.mockRejectedValue(error);

      await expect(
        articleService.getLikeStatus(userId, postId),
      ).rejects.toThrow(error);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getReadingStatus', () => {
    it('should return completed reading status when the user has finished the post', async () => {
      const userId = 1;
      const postId = 2;

      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.findUnique.mockResolvedValue({
        completed: true,
        progress: 100,
      });

      const response = await articleService.getReadingStatus(userId, postId);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(prismaMock.postRead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_postId: {
              userId: 1,
              postId: 2,
            },
          },
          select: {
            progress: true,
            completed: true,
          },
        }),
      );

      expect(response).toEqual({
        hasStarted: true,
        completed: true,
        progress: 100,
      });
    });

    it('should return reading progress when the post is not completed', async () => {
      const userId = 1;
      const postId = 2;

      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.findUnique.mockResolvedValue({
        completed: false,
        progress: 25,
      });

      const response = await articleService.getReadingStatus(userId, postId);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(prismaMock.postRead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          select: {
            progress: true,
            completed: true,
          },
        }),
      );

      expect(response).toEqual({
        hasStarted: true,
        completed: false,
        progress: 25,
      });
    });

    it('should return default reading status when the user has never started the post', async () => {
      const userId = 1;
      const postId = 2;

      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.findUnique.mockResolvedValue(null);

      const response = await articleService.getReadingStatus(userId, postId);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(prismaMock.postRead.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          select: {
            progress: true,
            completed: true,
          },
        }),
      );

      expect(response).toEqual({
        hasStarted: false,
        completed: false,
        progress: 0,
      });
    });

    it('should throw PostNotFoundException when the post does not exist', async () => {
      const userId = 1;
      const postId = 2;

      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(
        articleService.getReadingStatus(userId, postId),
      ).rejects.toThrow(PostNotFoundException);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(prismaMock.postRead.findUnique).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma postRead.findUnique fails', async () => {
      const userId = 1;
      const postId = 2;
      const error = new Error('Get Reading status fails');

      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.findUnique.mockRejectedValue(error);

      await expect(
        articleService.getReadingStatus(userId, postId),
      ).rejects.toThrow(error);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(prismaMock.postRead.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateReadingProgress', () => {
    it('should reading progress with completed false when progress is below 95', async () => {
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.upsert.mockResolvedValue({
        progress: 94,
        completed: false,
      });

      const response = await articleService.updateReadingProgress(1, 2, 94);

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
        select: {
          id: true,
        },
      });

      expect(prismaMock.postRead.upsert).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId: 1,
            postId: 2,
          },
        },
        create: {
          userId: 1,
          postId: 2,
          progress: 94,
          completed: false,
        },
        update: {
          progress: 94,
          completed: false,
        },
        select: {
          progress: true,
          completed: true,
        },
      });

      expect(response).toEqual({
        progress: 94,
        completed: false,
        hasStarted: true,
      });
    });
    it('should mark reading as completed when progress is exactly 95', async () => {
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.upsert.mockResolvedValue({
        progress: 95,
        completed: true,
      });

      const response = await articleService.updateReadingProgress(1, 2, 95);

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
        select: {
          id: true,
        },
      });

      expect(prismaMock.postRead.upsert).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId: 1,
            postId: 2,
          },
        },
        create: {
          userId: 1,
          postId: 2,
          progress: 95,
          completed: true,
        },
        update: {
          progress: 95,
          completed: true,
        },
        select: {
          progress: true,
          completed: true,
        },
      });

      expect(response).toEqual({
        progress: 95,
        completed: true,
        hasStarted: true,
      });
    });

    it('should mark reading as completed when progress is greater than 95', async () => {
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.upsert.mockResolvedValue({
        progress: 98,
        completed: true,
      });

      const response = await articleService.updateReadingProgress(1, 2, 98);

      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
        select: {
          id: true,
        },
      });

      expect(prismaMock.postRead.upsert).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId: 1,
            postId: 2,
          },
        },
        create: {
          userId: 1,
          postId: 2,
          progress: 98,
          completed: true,
        },
        update: {
          progress: 98,
          completed: true,
        },
        select: {
          progress: true,
          completed: true,
        },
      });

      expect(response).toEqual({
        progress: 98,
        completed: true,
        hasStarted: true,
      });
    });

    it('should throw PostNotFoundException when the post does not exist without calling upsert', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);

      await expect(
        articleService.updateReadingProgress(1, 999, 50),
      ).rejects.toThrow(PostNotFoundException);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
        select: {
          id: true,
        },
      });
      expect(prismaMock.postRead.upsert).toHaveBeenCalledTimes(0);
    });
    it('should propagate the error when Prisma post.findUnique fails without calling upsert', async () => {
      const error = new Error('Find Post fails');
      prismaMock.post.findUnique.mockRejectedValue(error);

      await expect(
        articleService.updateReadingProgress(1, 2, 50),
      ).rejects.toThrow(error);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
        select: {
          id: true,
        },
      });
      expect(prismaMock.postRead.upsert).toHaveBeenCalledTimes(0);
    });

    it('should propagate the error when Prisma postRead.upsert fails', async () => {
      const error = new Error('Creation or Update fails');
      prismaMock.post.findUnique.mockResolvedValue(createPostMock({ id: 2 }));
      prismaMock.postRead.upsert.mockRejectedValue(error);

      await expect(
        articleService.updateReadingProgress(1, 2, 50),
      ).rejects.toThrow(error);
      expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
        select: {
          id: true,
        },
      });
      expect(prismaMock.postRead.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
