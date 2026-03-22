import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma, User, Post as Articles } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private readonly _prisma: PrismaService) {}

  async index(published?: boolean): Promise<Articles[]> {
  return await this._prisma.post.findMany({
    where: published === undefined
      ? {}
      : {
          published_at: published ? { not: null } : null
        }
  });
}
  async indexWhere(where: Prisma.PostWhereInput) {
    try {
      return await this._prisma.post.findMany({ where });
    } catch (error) {
      throw error;
    }
  }

  async indexOneWhere(where: Prisma.PostWhereUniqueInput): Promise<Articles | null> {
    try {
      return await this._prisma.post.findUnique({ where });
    } catch (error) {
      throw error;
    }
  }

  async show(
    uniqueProperties: Prisma.PostWhereUniqueInput,
  ): Promise<Articles> {
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

  async store(createdData: CreatePostDto, author: User): Promise<Articles> {
    //TODO faire un test de markdown

    try {
      return await this._prisma.post.create({
        data: {
          title: createdData.title,
          content: createdData.content,
          description: createdData.description,
          published_at: createdData.published_at,
          author: {
            connect: { id: author.id }
          }
        },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async destroy(where: Prisma.PostWhereUniqueInput): Promise<void> {
    try {
      const user = await this.show(where);

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      await this._prisma.post.delete({ where });
    } catch (error) {
      throw error;
    }
  }
}
