import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { CreatePostDto } from './dto/create.post.dto';
import { Prisma, User, Post as Article, Post } from '@prisma/client';
import { PaginationDto } from '../pagination/pagination.dto';
import { UpdatePostDto } from './dto/update.post.dto';
import { Role } from 'src/commons/roles/role.enum';
import { PublishedPostDto } from './dto/published-post.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly _prisma: PrismaService) {}

  async countAll(): Promise<number> {
  return await this._prisma.post.count();
}
  

  async index(paginationDto?: PaginationDto): Promise<Article[]> {
  return await this._prisma.post.findMany({
    
    take: paginationDto.limit,
    skip: (paginationDto.page * paginationDto.limit) - paginationDto.limit,
    where: paginationDto.published === false
      ? {}
      : {
          published_at: paginationDto.published ? { not: null } : null
        },
        
  });
}
  async indexWhere(where: Prisma.PostWhereInput) {
    try {
      return await this._prisma.post.findMany({ where });
    } catch (error) {
      throw error;
    }
  }

  async indexOneWhere(where: Prisma.PostWhereUniqueInput): Promise<Article | null> {
    try {
      return await this._prisma.post.findUnique({ where });
    } catch (error) {
      throw error;
    }
  }

  async show(
    uniqueProperties: Prisma.PostWhereUniqueInput,
  ): Promise<Article> {
    try {
      const post = await this._prisma.post.findUnique({
        where: uniqueProperties,
      });
      if (!post) throw new NotFoundException();
      return post;
    } catch (error) {
      throw error;
    }
  }

  async store(createdData: CreatePostDto, author: User): Promise<Article> {
    //TODO faire un test de markdown

    try {
      return await this._prisma.post.create({
        data: {
          title: createdData.title,
          content: createdData.content,
          description: createdData.description,
          published_at: null,
          author: {
            connect: { id: author.id }
          }
        },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async update (where: Prisma.PostWhereUniqueInput, updatePostDto: UpdatePostDto | PublishedPostDto, role: string): Promise<Article | null> {
    try {
      console.log(updatePostDto)
      const post = await this.show(where);
      if (!post) {
        throw new NotFoundException('Post Not Found');
      }

      if (where.authorId !== post.authorId && role != 'admin') {
        throw new UnauthorizedException("You do not have the necessary authorization")
      }

     return await this._prisma.post.update({
        where: {
          id: post.id
        },
        data: updatePostDto
      })

    } catch (error) {
      throw error;
    } 
  }

  async destroy(where: Prisma.PostWhereUniqueInput): Promise<void> {
    try {
      const post = await this.show(where);

      if (!post) {
        throw new NotFoundException('Post Not Found');
      }
      await this._prisma.post.delete({ where });
    } catch (error) {
      throw error;
    }
  }

  async isPublished(post: Post): Promise<boolean> {
    console.log(post.published_at !== null)
    return post.published_at !== null;
  }
}
