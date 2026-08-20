import { userSelect, UserService } from 'src/modules/user/user.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { UserAlreadyExistException } from 'src/modules/user/exceptions/user-already-exist.exception';
import { Role } from 'src/commons/roles/role.enum';
import { UserUpdateDto } from 'src/modules/user/dto/update-user.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

describe('UserService', () => {
  let userService: UserService;

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const passwordServiceMock = {
    hashPassword: jest.fn(),
  };

  const createUserMock = (override = {}) => ({
    id: 1,
    email: 'test@test.com',
    pseudo: 'testuser',
    nom: 'Doe',
    prenom: 'John',
    role: Role.User,
    password: 'hashed-password',
    created_at: new Date(),
    updated_at: new Date(),
    posts: [],
    ...override,
  });

  const createUserDtoMock = (override = {}) => ({
    email: 'test@test.com',
    pseudo: 'testuser',
    nom: 'Doe',
    prenom: 'John',
    password: 'password',
    ...override,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    userService = new UserService(
      prismaMock as unknown as PrismaService,
      passwordServiceMock as unknown as PasswordService,
    );
  });

  describe('index', () => {
    it('should return all users', async () => {
      const users = [
        createUserMock({ id: 1 }),
        createUserMock({ id: 2, email: 'test2@test.com', pseudo: 'testuser2' }),
      ];

      prismaMock.user.findMany.mockResolvedValue(users);

      const response = await userService.index();

      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(response).toEqual(users);
    });
  });

  describe('show', () => {
    it('should return one user by id', async () => {
      const user = createUserMock({ id: 1 });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const response = await userService.show({ id: 1 });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );

      expect(response).toEqual(user);
    });

    it('should return one user by email', async () => {
      const user = createUserMock({ email: 'test@test.com' });

      prismaMock.user.findUnique.mockResolvedValue(user);

      const response = await userService.show({ email: 'test@test.com' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@test.com' },
        }),
      );

      expect(response).toEqual(user);
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.show({ id: 1 })).rejects.toThrow(
        UserNotFoundException,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = createUserDtoMock() as CreateUserDto;
      const hashedPassword = 'hashed-password';
      const createdUser = createUserMock({
        email: dto.email,
        pseudo: dto.pseudo,
        password: hashedPassword,
      });

      prismaMock.user.findFirst.mockResolvedValue(null);
      passwordServiceMock.hashPassword.mockResolvedValue(hashedPassword);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const response = await userService.create(dto);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: dto.email }, { pseudo: dto.pseudo }],
        },
        select: expect.any(Object),
      });

      expect(passwordServiceMock.hashPassword).toHaveBeenCalledWith(dto.password);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          pseudo: dto.pseudo,
          role: Role.User,
          password: hashedPassword,
        }),
        select: {
          ...userSelect,
          posts: true
        }
      });

      expect(response).toEqual(createdUser);
    });

    it('should throw UserAlreadyExistException if email already exists', async () => {
      const dto = createUserDtoMock({
        email: 'existing@test.com',
      }) as CreateUserDto;

      prismaMock.user.findFirst.mockResolvedValue(
        createUserMock({
          email: dto.email,
          pseudo: 'otherpseudo',
        }),
      );

      await expect(userService.create(dto)).rejects.toThrow(
        UserAlreadyExistException,
      );

      expect(passwordServiceMock.hashPassword).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistException if pseudo already exists', async () => {
      const dto = createUserDtoMock({
        pseudo: 'existingpseudo',
      }) as CreateUserDto;

      prismaMock.user.findFirst.mockResolvedValue(
        createUserMock({
          email: 'other@test.com',
          pseudo: dto.pseudo,
        }),
      );

      await expect(userService.create(dto)).rejects.toThrow(
        UserAlreadyExistException,
      );

      expect(passwordServiceMock.hashPassword).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should create a user with posts if posts are provided', async () => {
      const dto = {
        ...createUserDtoMock(),
        posts: [
          {
            title: 'Post 1',
            content: 'Content 1',
            description: 'Description 1',
          },
        ],
      } as any;

      const hashedPassword = 'hashed-password';
      const createdUser = createUserMock({
        posts: dto.posts,
      });

      prismaMock.user.findFirst.mockResolvedValue(null);
      passwordServiceMock.hashPassword.mockResolvedValue(hashedPassword);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const response = await userService.create(dto);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          posts: {
            create: dto.posts,
          },
        }),
        select: {
          ...userSelect,
          posts: true
        }
      });

      expect(response).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should update a user without password', async () => {
      const where = { id: 1 };
      const dto = {
        nom: 'Updated',
      } as UserUpdateDto;

      const existingUser = createUserMock({ id: 1 });
      const updatedUser = createUserMock({
        id: 1,
        nom: 'Updated',
      });

      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await userService.update(where, dto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
        }),
      );

      expect(passwordServiceMock.hashPassword).not.toHaveBeenCalled();

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where,
        data: {
          nom: 'Updated',
        },
        select: {
          ...userSelect,
          posts: true,
        }
      });

      expect(response).toEqual(updatedUser);
    });

    it('should hash password before update if password is provided', async () => {
      const where = { id: 1 };
      const dto = {
        password: 'new-password',
      } as UserUpdateDto;

      const existingUser = createUserMock({ id: 1 });
      const updatedUser = createUserMock({
        id: 1,
        password: 'new-hashed-password',
      });

      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      passwordServiceMock.hashPassword.mockResolvedValue('new-hashed-password');
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await userService.update(where, dto);

      expect(passwordServiceMock.hashPassword).toHaveBeenCalledWith(
        'new-password',
      );

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where,
        data: {
          password: 'new-hashed-password',
        },
        select: {
          ...userSelect,
          posts: true,
        }
      });

      expect(response).toEqual(updatedUser);
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      const where = { id: 1 };
      const dto = {
        nom: 'Updated',
      } as UserUpdateDto;

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.update(where, dto)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should delete a user', async () => {
      const where = { id: 1 };
      const existingUser = createUserMock({ id: 1 });

      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      prismaMock.user.delete.mockResolvedValue(existingUser);

      await userService.destroy(where);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
        }),
      );

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where,
      });
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      const where = { id: 1 };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.destroy(where)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });
  });
});