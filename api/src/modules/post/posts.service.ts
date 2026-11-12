import { Injectable } from '@nestjs/common';
import { Post as Article, Post, Prisma } from '@prisma/client';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { Role } from 'src/commons/roles/role.enum';
import { PaginationDto } from '../pagination/pagination.dto';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from '../user/exceptions/user-not-have-authorization';
import { userSelect, userSelectPayload } from '../user/user.service';
import { CreatePostDto } from './dto/create.post.dto';
import { PublishedPostDto } from './dto/published-post.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { PostNotFoundException } from './exceptions/post-not-found.exception';
import { StatusLikeDto } from './dto/status-like.dto';
import { MetaPaginationDto } from '../pagination/meta.pagination.dto';
import { StatusReadingDto } from '../user-activities/dto/status-reading.dto';
import { PostSummaryDto } from './dto/post-summary.dto';

import { UserSession } from 'src/commons/types/session-user.type';

export type userSelectItem = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;
const postLikeCount = {
  _count: {
    select: {
      likes: true,
    },
  },
} satisfies Prisma.PostInclude;

@Injectable()
export class ArticleService {
  constructor(private readonly _prisma: PrismaService) {}

  private async readScope(user?: UserSession): Promise<Prisma.PostWhereInput> {
    if (!user) return { published_at: { not: null } };
    const current = await this._prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!current) return { published_at: { not: null } };
    if (current.role === Role.Admin) return {};
    return { OR: [{ published_at: { not: null } }, { authorId: user.id }] };
  }

  async indexForReader(
    pagination: PaginationDto,
    user?: UserSession,
  ): Promise<[PostSummaryDto[], MetaPaginationDto]> {
    if (pagination.published === false && !user)
      throw new UserNotHaveAuthorisation();
    return this.index(
      { ...pagination, published: pagination.published ?? true },
      user?.id,
      await this.readScope(user),
    );
  }

  async showForReader(
    where: Prisma.PostWhereUniqueInput,
    user?: UserSession,
  ): Promise<Article> {
    const post = await this._prisma.post.findFirst({
      where: { AND: [where, await this.readScope(user)] },
    });
    if (!post) throw new PostNotFoundException(where.id);
    return post;
  }

  async count(published?: boolean): Promise<number> {
    const where: Prisma.PostWhereInput = {};

    if (published !== undefined) {
      where.published_at = published ? { not: null } : null;
    }
    return this._prisma.post.count({
      where,
    });
  }

  async index(
    paginationDto: PaginationDto,
    userId?: number,
    access?: Prisma.PostWhereInput,
  ): Promise<[PostSummaryDto[], MetaPaginationDto]> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;

    const where: Prisma.PostWhereInput = {};

    if (paginationDto.published !== undefined) {
      where.published_at = paginationDto.published ? { not: null } : null;
    }

    if (paginationDto.reading === false && userId) {
      where.postReads = {
        none: {
          completed: true,
          userId,
        },
      };
    }

    const scopedWhere = access ? { AND: [where, access] } : where;
    const [posts, total] = await this._prisma.$transaction([
      this._prisma.post.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],

        where: scopedWhere,

        include: {
          author: {
            select: {
              id: true,
              pseudo: true,
            },
          },
          ...postLikeCount,
        },

        omit: {
          content: true,
          created_at: true,
        },
      }),

      this._prisma.post.count({
        where: scopedWhere,
      }),
    ]);

    return [
      posts.map(({ _count, ...post }) => ({
        ...post,
        like: {
          count: _count.likes,
        },
      })),
      {
        currentPage: page,
        limit,
        totalArticle: total,
      },
    ];
  }

  async indexWhere(where: Prisma.PostWhereInput): Promise<PostSummaryDto[]> {
    const posts = await this._prisma.post.findMany({
      where,
      include: {
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
      },
      omit: {
        content: true,
        created_at: true,
      },
    });

    return posts.map(({ _count, ...post }) => ({
      ...post,
      like: { count: _count.likes },
    }));
  }

  async indexOneWhere(
    where: Prisma.PostWhereUniqueInput,
  ): Promise<Article | null> {
    return await this._prisma.post.findUnique({ where });
  }

  async show(uniqueProperties: Prisma.PostWhereUniqueInput): Promise<Article> {
    const post = await this._prisma.post.findUnique({
      where: uniqueProperties,
    });
    if (!post) throw new PostNotFoundException(uniqueProperties.id);
    return post;
  }

  async store(
    createdData: CreatePostDto,
    author: userSelectPayload,
  ): Promise<Article> {
    return this._prisma.post.create({
      data: {
        title: createdData.title,
        content: createdData.content,
        description: createdData.description,
        published_at: null,
        author: {
          connect: {
            id: author.id,
          },
        },
      },
      include: {
        author: {
          select: userSelect,
        },
      },
    });
  }

  async update(
    where: Prisma.PostWhereUniqueInput,
    updatePostDto: UpdatePostDto | PublishedPostDto,
    userId: number,
  ): Promise<Article> {
    const post = await this.show(where);

    const user = await this._prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const isAdmin = user.role === Role.Admin;
    const isAuthor = userId === post.authorId;

    if (!isAdmin && !isAuthor) {
      throw new UserNotHaveAuthorisation();
    }

    return this._prisma.post.update({
      where: {
        id: post.id,
      },
      data: updatePostDto,
    });
  }

  async destroy(where: Prisma.PostWhereUniqueInput): Promise<void> {
    await this.show(where);

    await this._prisma.post.delete({ where });
  }

  isPublished(post: Post): boolean {
    return post.published_at !== null;
  }

  async getLikeCount(postId: number): Promise<StatusLikeDto> {
    return {
      liked: false,
      likesCount: await this._prisma.like.count({
        where: {
          postId,
        },
      }),
    };
  }

  async getLikeStatus(userId: number, postId: number): Promise<StatusLikeDto> {
    const [like, likesCount] = await this._prisma.$transaction([
      this._prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      }),

      this._prisma.like.count({
        where: {
          postId,
        },
      }),
    ]);

    return {
      liked: like !== null,
      likesCount,
    };
  }

  async getReadingStatus(
    userId: number,
    postId: number,
  ): Promise<StatusReadingDto> {
    await this.show({
      id: postId,
    });

    const postRead = await this._prisma.postRead.findUnique({
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

    if (!postRead) {
      return {
        hasStarted: false,
        completed: false,
        progress: 0,
      };
    }

    return {
      hasStarted: true,
      completed: postRead.completed,
      progress: postRead.progress,
    };
  }

  async updateReadingProgress(
    userId: number,
    postId: number,
    progressParam: number,
  ): Promise<StatusReadingDto> {
    const post = await this._prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const { progress, completed } = await this._prisma.postRead.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
        progress: progressParam,
        completed: progressParam >= 95,
      },
      update: {
        progress: progressParam,
        completed: progressParam >= 95,
      },
      select: {
        progress: true,
        completed: true,
      },
    });

    return {
      progress,
      completed,
      hasStarted: true,
    };
  }
}
