import { userSelect, UserService } from 'src/modules/user/user.service';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { PasswordService } from 'src/commons/services/argon.service';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { UserAlreadyExistException } from 'src/modules/user/exceptions/user-already-exist.exception';
import { Role } from 'src/commons/roles/role.enum';
import { UserUpdateDto } from 'src/modules/user/dto/update-user.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

describe('UserService', () => {
  describe('profile', () => {
    it('selects private profile fields without passwords or relations', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'me@test.com',
      });
      await expect(userService.profile(1)).resolves.toEqual({
        id: 1,
        email: 'me@test.com',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          ...userSelect,
          nom: true,
          prenom: true,
          email: true,
          updated_at: true,
        },
      });
    });

    it('rejects a missing account', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(userService.profile(1)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });
  });
  let userService: UserService;

  const prismaMock = {
    $transaction: jest.fn(),
    verificationTokens: { deleteMany: jest.fn() },
    like: { upsert: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn() },
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

  const createPublicUserMock = (overrides = {}) => {
    const user = createUserMock(overrides);
    return {
      id: user.id,
      pseudo: user.pseudo,
      role: user.role,
      created_at: user.created_at,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock));

    userService = new UserService(
      prismaMock as unknown as PrismaService,
      passwordServiceMock as unknown as PasswordService,
    );
  });

  describe('index', () => {
    it('should return all users', async () => {
      const users = [
        createPublicUserMock({ id: 1 }),
        createPublicUserMock({
          id: 2,
          email: 'test2@test.com',
          pseudo: 'testuser2',
        }),
      ];

      prismaMock.user.findMany.mockResolvedValue(users);

      const response = await userService.index();

      expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: userSelect,
      });
      expect(response).toEqual(users);
    });
  });

  describe('show', () => {
    it('should return one user by id', async () => {
      const user = createPublicUserMock({ id: 1 });

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
      const user = createPublicUserMock({ email: 'test@test.com' });

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
      const createdUser = createPublicUserMock({
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

      expect(passwordServiceMock.hashPassword).toHaveBeenCalledWith(
        dto.password,
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          pseudo: dto.pseudo,
          role: Role.User,
          password: hashedPassword,
        }),
        select: {
          ...userSelect,
        },
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
      };

      const hashedPassword = 'hashed-password';
      const createdUser = createPublicUserMock({
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
        },
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

      const existingUser = createPublicUserMock({ id: 1 });
      const updatedUser = { ...createPublicUserMock({ id: 1 }), posts: [] };

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
        },
      });

      expect(response).toEqual(updatedUser);
    });

    it('should hash password before update if password is provided', async () => {
      const where = { id: 1 };
      const dto = {
        password: 'new-password',
      } as UserUpdateDto;

      const existingUser = createPublicUserMock({ id: 1 });
      const updatedUser = { ...createPublicUserMock({ id: 1 }), posts: [] };

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
        },
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
      const existingUser = createPublicUserMock({ id: 1 });

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

  describe('likes', () => {
    const payload = { user_id: 10, post_id: 42 };
    it('should add a like idempotently using the user and post ids', async () => {
      prismaMock.like.upsert.mockResolvedValue({ userId: 10, postId: 42 });
      await expect(userService.addLike(payload)).resolves.toBeUndefined();
      expect(prismaMock.like.upsert).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 10, postId: 42 } },
        create: { userId: 10, postId: 42 },
        update: {},
      });
    });
    it('should remove likes matching the supplied user and post', async () => {
      prismaMock.like.deleteMany.mockResolvedValue({ count: 1 });
      await expect(userService.unlikePost(payload)).resolves.toBeUndefined();
      expect(prismaMock.like.deleteMany).toHaveBeenCalledWith({
        where: { userId: 10, postId: 42 },
      });
    });
    it.each([0, 1])(
      'should resolve when deleting %i matching likes',
      async (count) => {
        prismaMock.like.deleteMany.mockResolvedValue({ count });
        await expect(userService.unlikePost(payload)).resolves.toBeUndefined();
      },
    );
    it.each([
      [null, false],
      [{ userId: 10, postId: 42 }, true],
    ])(
      'should report whether a matching like exists: %p',
      async (like, expected) => {
        prismaMock.like.findUnique.mockResolvedValue(like);
        await expect(userService.checkIfUserLikedPost(payload)).resolves.toBe(
          expected,
        );
        expect(prismaMock.like.findUnique).toHaveBeenCalledWith({
          where: { userId_postId: { userId: 10, postId: 42 } },
        });
      },
    );
    it.each(['addLike', 'unlikePost', 'checkIfUserLikedPost'] as const)(
      'should propagate a Prisma error from %s',
      async (method) => {
        const error = new Error('Like query failed');
        const mock =
          method === 'addLike'
            ? prismaMock.like.upsert
            : method === 'unlikePost'
              ? prismaMock.like.deleteMany
              : prismaMock.like.findUnique;
        mock.mockRejectedValue(error);
        await expect(userService[method](payload)).rejects.toBe(error);
      },
    );
  });

  describe('dependency failures', () => {
    it('should propagate a listing error', async () => {
      const error = new Error('List failed');
      prismaMock.user.findMany.mockRejectedValue(error);
      await expect(userService.index()).rejects.toBe(error);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: userSelect,
      });
    });
    it('should stop creation when password hashing fails', async () => {
      const error = new Error('Hash failed');
      prismaMock.user.findFirst.mockResolvedValue(null);
      passwordServiceMock.hashPassword.mockRejectedValue(error);
      await expect(userService.create(createUserDtoMock())).rejects.toBe(error);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
    it('should stop updating when password hashing fails', async () => {
      const error = new Error('Hash failed');
      prismaMock.user.findUnique.mockResolvedValue(createPublicUserMock());
      passwordServiceMock.hashPassword.mockRejectedValue(error);
      await expect(
        userService.update({ id: 1 }, { password: 'new-password' }),
      ).rejects.toBe(error);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
    it('should propagate an error from deletion', async () => {
      const error = new Error('Delete failed');
      prismaMock.user.findUnique.mockResolvedValue(createPublicUserMock());
      prismaMock.user.delete.mockRejectedValue(error);
      await expect(userService.destroy({ id: 1 })).rejects.toBe(error);
    });
  });
});
