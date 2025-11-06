import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserDto } from './dto/user.dto';
import {
  UserAlreadyExistWithEmail,
  UserAlreadyExistWithPseudo,
} from '../../commons/exceptions/userAlreadyExist.error';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserUpdateDto } from './dto/update-user.dto';
import { PasswordService } from 'src/commons/services/password.service';

@Injectable()
export class UserService {
  constructor(
    private readonly _prisma: PrismaService,
  private readonly _passwordManager: PasswordService) {
    
  }

  

  async index(): Promise<User[]> {
    return await this._prisma.user.findMany();
  }

  async show(uniqueProperties: Prisma.UserWhereUniqueInput): Promise<User> {
    try {
      const user = await this._prisma.user.findUnique({
        where: uniqueProperties,
      });
      if (!user) throw new NotFoundException();
      return user;
    } catch (error) {
      throw error;
    }
  }

  async create(data: UserDto & { posts?: any[] }): Promise<User> {
    const { email, pseudo, posts, password, ...userData } = data;
    try {
      // Vérifie si un utilisateur avec cet email existe déjà
      const user = await this._prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { pseudo: pseudo }],
        },
      });
      if (!user) throw new NotFoundException();

      // Si aucun NotFoundException n'est levée → l'utilisateur existe déjà
      if (email === user.email) throw new UserAlreadyExistWithEmail();
      if (pseudo === user.pseudo) throw new UserAlreadyExistWithPseudo();
      return user;
    } catch (error) {
      // Si show() lève NotFoundException → on peut créer l’utilisateur
      if (error instanceof NotFoundException) {
        // Hash le mot de passe avant de l’enregistrer
        let hashed_password = await this._passwordManager.hashPassword(data.password);
        const newUser = await this._prisma.user.create({
          data: {
            ...userData,
            email, // Ajout de l'email requis par UserCreateInput
            pseudo,
            role: data.role,
            password: hashed_password,
            posts: posts && posts.length > 0 ? { create: posts } : undefined,
          },
          include: { posts: true }, // Inclure les posts dans le retour
        });
        return newUser;
      }

      throw error;
    }
  }
  async update(
    where: Prisma.UserWhereUniqueInput,
    data: UserUpdateDto,
  ): Promise<User> {
    try {
      const { ...userData } = data;
      const user = await this.show(where);

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      const updatedUser = await this._prisma.user.update({
        where,
        data: {
          ...userData,
          posts: undefined,
        },
        include: { posts: true },
      });
      return updatedUser;
    } catch (error) {
      // Tu peux logguer ici si besoin : console.error(error);
      throw error;
    }
  }

  async destroy(where: Prisma.UserWhereUniqueInput): Promise<void> {
    try {
      const user = await this.show(where);

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      await this._prisma.user.delete({ where });
    } catch (error) {
      throw error;
    }
  }
}
