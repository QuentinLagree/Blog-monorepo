import {
  Injectable
} from '@nestjs/common';
import { Post as Article, Post, Prisma } from '@prisma/client';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { Role } from 'src/commons/roles/role.enum';
import { PaginationDto } from '../pagination/pagination.dto';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import { UserNotHaveAuthorisation } from '../user/exceptions/user-not-have-authorisation.exception';
import { userSelect, userSelectPayload } from '../user/user.service';
import { CreatePostDto } from './dto/create.post.dto';
import { PublishedPostDto } from './dto/published-post.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { PostNotFoundException } from './exceptions/post-not-found.exception';
import { StatusLikeDto } from './dto/status-like.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly _prisma: PrismaService) { }

  async countAll(): Promise<number> {
    return this._prisma.post.count();
  }

  async countByPublishedStatus(published: boolean = false): Promise<number> {
    return this._prisma.post.count({
      where: {
        published_at: (published) ? { not: null } : null
      }
    });
  }


  async index(paginationDto: PaginationDto): Promise<Article[]> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;

    return this._prisma.post.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where:
        paginationDto.published === undefined
          ? {}
          : {
            published_at: paginationDto.published ? { not: null } : null,
          },
    });
  }

  async indexWhere(where: Prisma.PostWhereInput) {
    return this._prisma.post.findMany({ where });
  }

  async indexOneWhere(where: Prisma.PostWhereUniqueInput): Promise<Article | null> {
    return this._prisma.post.findUnique({ where });
  }

  async show(
    uniqueProperties: Prisma.PostWhereUniqueInput,
  ): Promise<Article> {
    const post = await this._prisma.post.findUnique({
      where: uniqueProperties,
    });
    if (!post) throw new PostNotFoundException(uniqueProperties.id ??
      'unknown');
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

  async update(where: Prisma.PostWhereUniqueInput, updatePostDto: UpdatePostDto | PublishedPostDto, userId: number): Promise<Article> {
    const post = await this.show(where);

    const user = await this._prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        role: true
      }
    })
    if (!user) {
      throw new UserNotFoundException(userId)
    }

    const isAdmin = user.role === Role.Admin;
    const isAuthor = userId === post.authorId;

    if (!isAdmin && !isAuthor) {
      throw new UserNotHaveAuthorisation();
    }

    return this._prisma.post.update({
      where: {
        id: post.id
      },
      data: updatePostDto
    })

  }

  async destroy(where: Prisma.PostWhereUniqueInput): Promise<void> {
    await this.show(where);

    await this._prisma.post.delete({ where });
  }

  isPublished(post: Post): boolean {
    return post.published_at !== null;
  }

  async getLikeStatus(
  userId: number,
  postId: number,
): Promise<StatusLikeDto> {
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
}
