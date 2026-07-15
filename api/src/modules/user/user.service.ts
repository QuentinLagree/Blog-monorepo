import { HttpCode, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserDto } from './dto/user.dto';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserUpdateDto } from './dto/update-user.dto';
import { PasswordService } from 'src/commons/services/argon.service';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UserAlreadyExistException } from './exceptions/user-already-exist.exception';
import { Role } from 'src/commons/roles/role.enum';
import { PasswordNotMatchException } from '../auth/exceptions/password-not-same.exception';
import { LikedPostDto } from './dto/liked-post.dto';
import { ArticleService } from '../post/posts.service';
import { PostDoesntLikeOrUnlikeByAuthor } from './exceptions/post-doesnt-like-unlike-same-author.exception';
import { PostDoesntLikeOrUnlikeAlready } from './exceptions/post-doesnt-like-unlike-already.exception';

export const userSelect = {
  id: true,
  email: true,
  pseudo: true,
  nom: true,
  prenom: true,
  role: true,
  created_at: true,
  updated_at: true,
  posts: true,
} satisfies Prisma.UserSelect;

export type userSelectPayload = Prisma.UserGetPayload<{ select: typeof userSelect }>

@Injectable()
export class UserService {

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _passwordManager: PasswordService) {

  }
  async index(): Promise<userSelectPayload[]> {

    return this._prisma.user.findMany({
      select: userSelect
    });
  }
  async show(uniqueProperties: Prisma.UserWhereUniqueInput): Promise<userSelectPayload> {
    const user = await this._prisma.user.findUnique({
      where: uniqueProperties,
      select: userSelect
    });

    if (!user) throw new UserNotFoundException(uniqueProperties.id ??
      uniqueProperties.email ??
      uniqueProperties.pseudo ??
      'unknown');
    return user;
  }
  async create(data: UserDto & { posts?: Prisma.PostCreateWithoutAuthorInput[] }): Promise<Promise<userSelectPayload>> {
    const { email, pseudo, posts, password, ...userData } = data;

    const existingUser = await this._prisma.user.findFirst({
      where: {
        OR: [{ email }, { pseudo }],
      },
      select: userSelect
    });
    if (existingUser?.email === email) {
      throw new UserAlreadyExistException('email');
    }

    if (existingUser?.pseudo === pseudo) {
      throw new UserAlreadyExistException('pseudo');
    }

    const hashedPassword = await this._passwordManager.hashPassword(password);

    return this._prisma.user.create({
      data: {
        ...userData,
        email,
        pseudo,
        role: Role.User,
        password: hashedPassword,
        posts: posts && posts.length > 0 ? { create: posts } : undefined,
      },
      select: {
        ...userSelect,
        posts: true
      }
    });
  }

  async update(
    where: Prisma.UserWhereUniqueInput,
    data: UserUpdateDto,
  ): Promise<userSelectPayload> {
    const { posts, ...userData } = data as UserUpdateDto & { posts?: unknown };
    await this.show(where);



    if (userData.password) {
      userData.password = await this._passwordManager.hashPassword(userData.password);
    }

    return this._prisma.user.update({
      where,
      data: {
        ...userData,
      },
      select: {
        ...userSelect,
        posts: true
      }
    });
  }

  async addLike(payload: LikedPostDto): Promise<void> {
    await this._prisma.like.upsert({
      where: {
        userId_postId: {
          userId: payload.user_id,
          postId: payload.post_id,
        },
      },
      create: {
        userId: payload.user_id,
        postId: payload.post_id,
      },
      update: {},
    });
  }

  async unlikePost(payload: LikedPostDto): Promise<void> {
    await this._prisma.like.deleteMany({
      where: {
        userId: payload.user_id,
        postId: payload.post_id,
      },
    });
  }

  async checkIfUserLikedPost(
    payload: LikedPostDto,
  ): Promise<boolean> {
    const like = await this._prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: payload.user_id,
          postId: payload.post_id,
        },
      },
    });

    return like !== null;
  }

  async destroy(where: Prisma.UserWhereUniqueInput): Promise<void> {
    await this.show(where);
    await this._prisma.user.delete({ where });
  }
}
