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

  describe('index', () => {
    it('should return all posts with pagination metadata', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      } as PaginationDto;

      const posts = [
        createPostMock({ id: 1 }),
        createPostMock({ id: 2 }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts as any);
      prismaMock.post.count.mockReturnValue(2 as any);

      prismaMock.$transaction.mockResolvedValue([
        posts,
        2,
      ]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {},
      });

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: null,
        },
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();

      expect(response).toEqual([
        posts,
        {
          currentPage: 1,
          limit: 10,
          totalArticle: 2,
        },
      ]);
    });

    it('should calculate the correct skip value', async () => {
      const paginationDto = {
        page: 3,
        limit: 5,
      } as PaginationDto;

      const posts = [
        createPostMock({ id: 11 }),
        createPostMock({ id: 12 }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts as any);
      prismaMock.post.count.mockReturnValue(12 as any);

      prismaMock.$transaction.mockResolvedValue([
        posts,
        12,
      ]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 5,
        skip: 10,
        where: {},
      });

      expect(response).toEqual([
        posts,
        {
          currentPage: 3,
          limit: 5,
          totalArticle: 12,
        },
      ]);
    });

    it('should use default pagination values', async () => {
      const paginationDto = {} as PaginationDto;

      prismaMock.post.findMany.mockReturnValue([] as any);
      prismaMock.post.count.mockReturnValue(0 as any);

      prismaMock.$transaction.mockResolvedValue([
        [],
        0,
      ]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {},
      });

      expect(response).toEqual([
        [],
        {
          currentPage: 1,
          limit: 10,
          totalArticle: 0,
        },
      ]);
    });

    it('should return only published posts when published is true', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        published: true,
      } as PaginationDto;

      const posts = [
        createPostMock({
          id: 1,
          published_at: new Date(),
        }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts as any);
      prismaMock.post.count.mockReturnValue(1 as any);

      prismaMock.$transaction.mockResolvedValue([
        posts,
        1,
      ]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {
          postReads: {},
          published_at: {
            not: null,
          },
        },
      });

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: {
            not: null,
          },
        },
      });

      expect(response).toEqual([
        posts,
        {
          currentPage: 1,
          limit: 10,
          totalArticle: 1,
        },
      ]);
    });

    it('should return only drafts when published is false', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        published: false,
      } as PaginationDto;

      const posts = [
        createPostMock({
          id: 1,
          published_at: null,
        }),
      ];

      prismaMock.post.findMany.mockReturnValue(posts as any);
      prismaMock.post.count.mockReturnValue(1 as any);

      prismaMock.$transaction.mockResolvedValue([
        posts,
        1,
      ]);

      const response = await articleService.index(paginationDto);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        where: {
          postReads: {},
          published_at: null,
        },
      });

      expect(prismaMock.post.count).toHaveBeenCalledWith({
        where: {
          published_at: null,
        },
      });

      expect(response).toEqual([
        posts,
        {
          currentPage: 1,
          limit: 10,
          totalArticle: 1,
        },
      ]);
    });

    it('should throw an error if the transaction fails', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      } as PaginationDto;

      const error = new Error('Database error');

      prismaMock.post.findMany.mockReturnValue([] as any);
      prismaMock.post.count.mockReturnValue(0 as any);
      prismaMock.$transaction.mockRejectedValue(error);

      await expect(
        articleService.index(paginationDto),
      ).rejects.toThrow(error);

      expect(prismaMock.$transaction).toHaveBeenCalled();
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

    await expect(
      articleService.getLikeCount(postId),
    ).rejects.toThrow(error);
  });
});

describe('getLikeStatus', () => {
  it('should return liked true when the user has liked the post', async () => {
    const userId = 1;
    const postId = 2;

    const like = {
      id: 1,
      userId,
      postId,
      created_at: new Date(),
    };

    prismaMock.like.findUnique.mockReturnValue(like as any);
    prismaMock.like.count.mockReturnValue(4 as any);

    prismaMock.$transaction.mockResolvedValue([
      like,
      4,
    ]);

    const response = await articleService.getLikeStatus(
      userId,
      postId,
    );

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
      like,
      4,
    ]);

    expect(response).toEqual({
      liked: true,
      likesCount: 4,
    });
  });

  it('should return liked false when the user has not liked the post', async () => {
    const userId = 1;
    const postId = 2;

    prismaMock.like.findUnique.mockReturnValue(null as any);
    prismaMock.like.count.mockReturnValue(3 as any);

    prismaMock.$transaction.mockResolvedValue([
      null,
      3,
    ]);

    const response = await articleService.getLikeStatus(
      userId,
      postId,
    );

    expect(response).toEqual({
      liked: false,
      likesCount: 3,
    });
  });

  it('should propagate the error if the transaction fails', async () => {
    const userId = 1;
    const postId = 2;
    const error = new Error('Transaction error');

    prismaMock.like.findUnique.mockReturnValue(null as any);
    prismaMock.like.count.mockReturnValue(0 as any);
    prismaMock.$transaction.mockRejectedValue(error);

    await expect(
      articleService.getLikeStatus(userId, postId),
    ).rejects.toThrow(error);

    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

describe('getReadingStatus', () => {
  it('should return the current reading status', async () => {
    const userId = 1;
    const postId = 2;
    const post = createPostMock({ id: postId });

    prismaMock.post.findUnique.mockResolvedValue(post);

    prismaMock.postRead.findUnique.mockResolvedValue({
      progress: 60,
      completed: false,
    });

    const response = await articleService.getReadingStatus(
      userId,
      postId,
    );

    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: {
        id: postId,
      },
    });

    expect(prismaMock.postRead.findUnique).toHaveBeenCalledWith({
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
    });

    expect(response).toEqual({
      hasStarted: true,
      completed: false,
      progress: 60,
    });
  });

  it('should return a completed reading status', async () => {
    const userId = 1;
    const postId = 2;
    const post = createPostMock({ id: postId });

    prismaMock.post.findUnique.mockResolvedValue(post);

    prismaMock.postRead.findUnique.mockResolvedValue({
      progress: 100,
      completed: true,
    });

    const response = await articleService.getReadingStatus(
      userId,
      postId,
    );

    expect(response).toEqual({
      hasStarted: true,
      completed: true,
      progress: 100,
    });
  });

  it('should return the default status when reading has not started', async () => {
    const userId = 1;
    const postId = 2;
    const post = createPostMock({ id: postId });

    prismaMock.post.findUnique.mockResolvedValue(post);
    prismaMock.postRead.findUnique.mockResolvedValue(null);

    const response = await articleService.getReadingStatus(
      userId,
      postId,
    );

    expect(response).toEqual({
      hasStarted: false,
      completed: false,
      progress: 0,
    });
  });

  it('should throw PostNotFoundException when the post does not exist', async () => {
    const userId = 1;
    const postId = 999;

    prismaMock.post.findUnique.mockResolvedValue(null);

    await expect(
      articleService.getReadingStatus(userId, postId),
    ).rejects.toThrow(PostNotFoundException);

    expect(prismaMock.postRead.findUnique).not.toHaveBeenCalled();
  });
});

describe('updateReadingProgress', () => {
  it('should create the reading progress when it does not exist', async () => {
    const userId = 1;
    const postId = 2;
    const progress = 50;

    const postRead = {
      id: 1,
      userId,
      postId,
      progress,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
    });

    prismaMock.postRead.upsert.mockResolvedValue(postRead);

    const response = await articleService.updateReadingProgress(
      userId,
      postId,
      progress,
    );

    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    expect(prismaMock.postRead.upsert).toHaveBeenCalledWith({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
        progress,
        completed: false,
      },
      update: {
        progress,
        completed: false,
      },
    });

    expect(response).toEqual(postRead);
  });

  it('should mark reading as completed when progress is 95', async () => {
    const userId = 1;
    const postId = 2;
    const progress = 95;

    const postRead = {
      id: 1,
      userId,
      postId,
      progress,
      completed: true,
    };

    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
    });

    prismaMock.postRead.upsert.mockResolvedValue(postRead);

    const response = await articleService.updateReadingProgress(
      userId,
      postId,
      progress,
    );

    expect(prismaMock.postRead.upsert).toHaveBeenCalledWith({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
        progress,
        completed: true,
      },
      update: {
        progress,
        completed: true,
      },
    });

    expect(response).toEqual(postRead);
  });

  it('should mark reading as completed when progress is greater than 95', async () => {
    const userId = 1;
    const postId = 2;
    const progress = 100;

    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
    });

    prismaMock.postRead.upsert.mockResolvedValue({
      id: 1,
      userId,
      postId,
      progress,
      completed: true,
    });

    await articleService.updateReadingProgress(
      userId,
      postId,
      progress,
    );

    expect(prismaMock.postRead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          completed: true,
        }),
        update: expect.objectContaining({
          completed: true,
        }),
      }),
    );
  });

  it('should throw PostNotFoundException when the post does not exist', async () => {
    const userId = 1;
    const postId = 999;
    const progress = 50;

    prismaMock.post.findUnique.mockResolvedValue(null);

    await expect(
      articleService.updateReadingProgress(
        userId,
        postId,
        progress,
      ),
    ).rejects.toThrow(PostNotFoundException);

    expect(prismaMock.postRead.upsert).not.toHaveBeenCalled();
  });

  it('should propagate the error if the upsert fails', async () => {
    const userId = 1;
    const postId = 2;
    const progress = 50;
    const error = new Error('Database error');

    prismaMock.post.findUnique.mockResolvedValue({
      id: postId,
    });

    prismaMock.postRead.upsert.mockRejectedValue(error);

    await expect(
      articleService.updateReadingProgress(
        userId,
        postId,
        progress,
      ),
    ).rejects.toThrow(error);
  });
});
});