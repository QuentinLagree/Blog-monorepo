import { TestingModule, Test } from '@nestjs/testing';
import { NotFoundException, ValidationError } from '@nestjs/common';
import { User } from '@prisma/client';
import { compare, hashSync } from 'bcrypt';
import { CreatePrismaServiceMock, PrismaUserServiceMockType } from 'test/mocks/services/database/create.prisma.service.mocks';
import { UserService } from 'src/modules/user/user.service';
import { UserAlreadyExistWithEmail } from 'src/commons/exceptions/userAlreadyExist.error';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { createUserMock, createNewUserMock, createInvalidDto } from 'test/mocks/create.user.mocks';

const FATAL_ERROR = 'Database Down';

describe('UserService', () => {
  let service: UserService;
  let _prisma: PrismaUserServiceMockType;

  // Initialisation avant chaque test
  beforeEach(async () => {
    _prisma = CreatePrismaServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: _prisma }],
    }).compile();

    service = app.get<UserService>(UserService);
  });

  describe('UserService - providers are defined', () => {
    it('UserService should be defined', () => {
      expect(service).toBeDefined();
    });

    it('Prisma Service should be defined', () => {
      expect(_prisma).toBeDefined();
    });
  });

  describe('UserService - index()', () => {
    beforeEach(() => {
      _prisma.user.findMany.mockReset();
    });
    it('should return an array of user', async () => {
      const users: Partial<User>[] = [
        createUserMock(),
        createUserMock({ id: 2 }),
      ];
      _prisma.user.findMany.mockResolvedValue(users);

      const result: Promise<User[]> = service.index();

      await expect(result).resolves.toEqual(users);
      expect(_prisma.user.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findMany()).resolves.toEqual(users);
      expect(_prisma.user.findMany).toHaveBeenCalledWith();
    });

    it('should return an empty list of users', async () => {
      _prisma.user.findMany.mockResolvedValue([]);

      const result: Promise<User[]> = service.index();

      await expect(result).resolves.toEqual([]);
      expect(_prisma.user.findMany).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findMany()).resolves.toEqual([]);
      expect(_prisma.user.findMany).toHaveBeenCalledWith();
    });
  });

  describe('UserService - show()', () => {
    beforeEach(() => {
      _prisma.user.findUnique.mockReset();
    });
    it('should return a user when found', async () => {
      const user: Partial<User> = createUserMock({ id: 42 });
      _prisma.user.findUnique.mockResolvedValue(user);

      const result: Promise<User> = service.show({ id: 42 });

      await expect(result).resolves.toEqual(user);
      expect(_prisma.user.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findUnique()).resolves.toEqual(user);
      expect(_prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('sould return an error message when ID is undefined', async () => {
      _prisma.user.findUnique.mockResolvedValue(undefined);
      await expect(service.show(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(_prisma.user.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findUnique()).resolves.toBe(undefined);
      expect(_prisma.user.findUnique).toHaveBeenCalledWith({
        where: undefined,
      });
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      _prisma.user.findUnique.mockResolvedValue(undefined);
      await expect(service.show(1.5 as any)).rejects.toThrow(NotFoundException);
      expect(_prisma.user.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findUnique()).resolves.toBe(undefined);
      expect(_prisma.user.findUnique).toHaveBeenCalledWith({ where: 1.5 });
    });

    it('should throw NotFoundExcpetion when a user is not found', async () => {
      _prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.show({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
      expect(_prisma.user.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findUnique()).resolves.toBe(null);
      expect(_prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should return a Fatal Error (database down)', async () => {
      _prisma.user.findUnique.mockRejectedValue(new Error(FATAL_ERROR));

      await expect(service.show({ id: 1 })).rejects.toThrow(FATAL_ERROR);
      expect(_prisma.user.findUnique).toHaveBeenCalledTimes(1);
      await expect(_prisma.user.findUnique()).rejects.toThrow(
        Error(FATAL_ERROR),
      );
    });
  });

  describe('UserService - create()', () => {
    it('should create a new user', async () => {
      const dto: UserDto = createNewUserMock({
        password: 'securepass',
      });

      // Hash le mot de passe comme le service le ferait
      const hashedPassword = hashSync(dto.password, 10);
      const newUser: Partial<User> = createUserMock({
        ...dto,
        id: 2,
        password: hashedPassword,
      });

      _prisma.user.findFirst.mockResolvedValue(null);
      _prisma.user.create.mockResolvedValue(newUser);

      const result: Promise<User> = service.create(dto);

      await expect(result).resolves.toEqual(newUser);
      expect(_prisma.user.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ email: dto.email }, { pseudo: dto.pseudo }] },
      });
      expect(_prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          password: expect.any(String), // le mot de passe sera hashé
          posts: undefined,
        },
        include: { posts: true },
      });
    });

    it('should throw a BadRequestException if user already exists', async () => {
      const dto: User = createUserMock({ id: 1 });
      _prisma.user.findFirst.mockResolvedValue(dto);

      const result: Promise<User> = service.create(dto as UserDto);

      await expect(result).rejects.toThrow(UserAlreadyExistWithEmail);
      expect(_prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw error if DTO is invalid', async () => {
      const invalidDto: UserDto = createInvalidDto();

      const errors: ValidationError[] = await dtoIsValid(invalidDto);

      expect(errors.length).not.toBe(0);

      await expect(service.create(invalidDto)).resolves.toBeUndefined();
    });

    it('should throw fatal error when database down', async () => {
      const dto: UserDto = createUserMock();
      const newUser: Partial<User> = createUserMock({ ...dto, id: 2 });
      _prisma.user.findUnique.mockResolvedValue(null);
      _prisma.user.create.mockResolvedValue(newUser);
      _prisma.user.create.mockRejectedValue(new Error('Database down'));

      await expect(service.create(dto)).rejects.toThrow('Database down');
    });
  });

  describe('UserService - update()', () => {
    beforeEach(() => {
      _prisma.user.update.mockReset();
    });
    it('should update a user successfully', async () => {
      const existingUser: Partial<User> = createUserMock({ id: 1 });
      const updatedUser: Partial<User> = createUserMock({
        id: 1,
        nom: 'Updated Name',
      });

      _prisma.user.findUnique.mockResolvedValue(existingUser);
      _prisma.user.update.mockResolvedValue(updatedUser);

      const result: Promise<User> = service.update(
        { id: 1 },
        { nom: 'Updated Name' },
      );

      await expect(result).resolves.toEqual(updatedUser);
      expect(_prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(_prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nom: 'Updated Name', posts: undefined },
        include: { posts: true },
      });
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      await expect(
        service.update(1.5 as any, { nom: 'NomdeFamille' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      _prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update({ id: 999 }, { nom: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if DTO is invalid', async () => {
      const invalidDto: UserDto = createInvalidDto();

      const errors: ValidationError[] = await dtoIsValid(invalidDto);

      expect(errors.length).not.toBe(0);

      await expect(
        service.update(invalidDto as User, { nom: 'NomdeFamille' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if database down', async () => {
      _prisma.user.update.mockRejectedValue(new Error('Database Down'));

      await expect(
        service.update({ id: 1 }, { nom: 'NomDeFamille' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('UserService - destroy()', () => {
    it('should delete a user', async () => {
      const userToDelete = createUserMock({ id: 1 });
      _prisma.user.findUnique.mockResolvedValue(userToDelete);
      _prisma.user.delete.mockResolvedValue(undefined);

      await expect(service.destroy({ id: 1 })).resolves.toBeUndefined();

      expect(_prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(_prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if user not found', async () => {
      _prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.destroy({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      await expect(service.destroy(1.5 as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if database down', async () => {
      _prisma.user.delete.mockRejectedValue(new Error('Database Down'));

      await expect(service.destroy({ id: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
