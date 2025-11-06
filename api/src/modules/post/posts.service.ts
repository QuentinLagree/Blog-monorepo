import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly _prisma: PrismaService) {}

  async index(published: boolean = false): Promise<Post[]> {
    return await this._prisma.post.findMany({
      where: published ? { published: true } : {},
    });
  }

  async indexWhere(where: Prisma.PostWhereInput) {
    try {
      return await this._prisma.post.findMany({ where });
    } catch (error) {
      throw error;
    }
  }

  async show(
    uniqueProperties: Prisma.PostWhereUniqueInput,
    published: Boolean = false,
  ): Promise<Post> {
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

  async store(createdData: CreatePostDto, author: User): Promise<Post> {
    //TODO faire un test de markdown

    try {
      return await this._prisma.post.create({
        data: {
          title: createdData.title,
          content: createdData.content,
          description: createdData.description,
          published: createdData.published,
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
