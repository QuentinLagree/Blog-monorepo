import { TestingModule, Test } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {
  createInvalidDto,
  createNewUserMock,
  createUserMock,
} from '../../usecases/mocks/create.user.mocks';
import { makeMessage, Message } from '../../usecases/utils/logger.utils';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { createUserServiceMock } from '../../usecases/mocks/services/auth/create.user.service.mocks';
import { User } from '@prisma/client';
import { ValidationError } from 'class-validator';
import { UserAlreadyExistWithEmail } from '../../commons/utils/exceptions/userAlreadyExist.error';
import { ID } from 'src/commons/types/id.types';
import { expectHttpExceptionWithMessage } from 'test/helpers/HTTPExceptionErrorHandleTest.utils';
import { UserDto } from './dto/user.dto';
import { dtoIsValid } from 'src/commons/helpers/dto/dto-validations.helper';
import { UserUpdateDto } from './dto/update-user.dto';

const FATAL_ERROR = 'Database Down';
let hasValidIDMock: jest.SpyInstance;
describe('UserController Tests', () => {
  let controller: UserController;
  let service: { [K in keyof UserService]: jest.Mock };

  beforeEach(async () => {
    service = createUserServiceMock();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();

    controller = app.get<UserController>(UserController);
  });

  describe('UserController - providers are defined', () => {
    it('controller should be defined ', () => {
      expect(controller).toBeDefined();
    });
    it('userService should be defined ', () => {
      expect(service).toBeDefined();
    });
  });

  describe('UserController - index()', () => {
    beforeEach(() => {
      service.index.mockReset();
    });
    afterEach(() => jest.restoreAllMocks());
    it('Should return an array of user', async () => {
      const users = [createUserMock(), createUserMock({ id: 2 })];
      service.index.mockResolvedValue(users);

      const result: Promise<Message> = controller.index();

      expect(service.index).toHaveBeenCalled();
      await expect(result).resolves.toEqual({
        message: 'Liste de tous les utilisateurs',
        data: users,
      });
    });
    it('Should return an empty list of users', async () => {
      service.index.mockResolvedValue([]);

      const result: Promise<Message> = controller.index();

      expect(service.index).toHaveBeenCalled();

      await expect(result).resolves.toEqual({
        message: 'La liste des utilisateurs est vide',
        data: null,
      });
    });

    it('Should throw a Fatal Error wiith message (ex: crash server or prisma)', async () => {
      const error = new Error(FATAL_ERROR);
      service.index.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.index(),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error, // <-- ici, pas "e"
          { level: 'Fatal' },
        ),
      );
    });
  });

  describe('UserController - show()', () => {
    beforeEach(() => {
      service.show.mockReset();
      hasValidIDMock = jest.spyOn(ID, 'hasValid');
      hasValidIDMock.mockReset();
      hasValidIDMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());

    it('Should return a user when found with id', async () => {
      const id = 42;
      const user: Partial<User> = createUserMock({ id });
      service.show.mockResolvedValue(user);

      const result: Promise<Message> = controller.show(id);

      expect(service.show).toHaveBeenCalledTimes(1);
      expect(service.show).toHaveBeenCalledWith({ id });

      await expect(result).resolves.toEqual({
        message: `L'utilisateur 42 a bien été trouvé.`,
        data: user,
      });
    });
    it('sould throw an error with message when ID is undefined', async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.show(undefined as any),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : 'undefined' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(undefined);
      expect(hasValid).toHaveLastReturnedWith(false);
    });

    it("Should return an Error when id isn't valid (decimal number)", async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.show(1.5),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : '1.5' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
        service.show,
      );

      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(1.5);
      expect(hasValid).toHaveLastReturnedWith(false);
    });

    it('Should return a user with unknow id from database', async () => {
      service.show.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.show(999),
        HttpStatus.NOT_FOUND,
        makeMessage(
          `User Not Found with id 999`,
          `L'utilisateur 999 n'a pas été trouvé.`,
          null,
        ),
        service.show,
        1,
      );

      expect(service.show).toHaveBeenCalledTimes(1);
      expect(service.show).toHaveBeenCalledWith({ id: 999 });
      await expect(service.show).rejects.toThrow(NotFoundException);
    });

    it('sould return a Fatal Error (ex: crash server or prisma)', async () => {
      const error = new Error(FATAL_ERROR);
      service.show.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.show(1),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error, // <-- ici, pas "e"
          { level: 'Fatal' },
        ),
        service.show,
        1,
      );
    });
  });

  describe('UserController - store()', () => {
    beforeEach(() => {
      service.create.mockReset();
    });
    afterEach(() => jest.restoreAllMocks());

    it('sould create a new user with valid properties', async () => {
      const dto: UserDto = createNewUserMock();

      const newUser: Partial<User> = createUserMock({ ...dto, id: 2 });

      service.create.mockResolvedValue(newUser);

      const result: Promise<Message> = controller.store(dto);

      await expect(result).resolves.toEqual({
        message: "L'utilisateur est bien enregistré !",
        data: newUser,
      });

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should return error message if user already exists with email', async () => {
      const newDto: UserDto = createNewUserMock({
        pseudo: 'NotSamePseudo',
      });

      service.create.mockRejectedValue(new UserAlreadyExistWithEmail());

      await expectHttpExceptionWithMessage(
        () => controller.store(newDto),
        HttpStatus.CONFLICT,
        makeMessage(
          'User created failed',
          'Ce compte existe déjà, connectez-vous.',
          null,
        ),
        service.create,
        1,
      );
    });

    it('should throw error if DTO is invalid', async () => {
      const invalidDto: UserDto = createInvalidDto();

      const errors: ValidationError[] = await dtoIsValid(invalidDto);

      expect(errors.length).not.toBe(0);

      await expectHttpExceptionWithMessage(
        () => controller.store(invalidDto),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User created failed !',
          'Les données sont incorrectes !',
          errors,
        ),
        service.create,
      );
    });
    it('should throw fatal error when an undefined error', async () => {
      const dto: UserDto = createNewUserMock();
      const error = new Error(FATAL_ERROR);
      service.create.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.store(dto),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error, // <-- ici, pas "e"
          { level: 'Fatal' },
        ),
        service.create,
        1,
      );

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('UserController - update()', () => {
    beforeEach(() => {
      service.update.mockReset();
      hasValidIDMock = jest.spyOn(ID, 'hasValid');
      hasValidIDMock.mockReset();
      hasValidIDMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());

    it('should update user with success message', async () => {
      const updatedUser: UserUpdateDto = createUserMock({
        id: 1,
        nom: 'UpdatedName',
      });

      service.update.mockResolvedValue(updatedUser);

      const result: Promise<Message> = controller.update(1, {
        nom: 'UpdatedName',
      });

      await expect(result).resolves.toEqual({
        message: 'La modification de vos informations est bien sauvegardé !',
        data: updatedUser,
      });
      expect(service.update).toHaveBeenCalledTimes(1);

      expect(service.update).toHaveBeenCalledWith(
        { id: 1 },
        { nom: 'UpdatedName' },
      );
    });

    it("Should return an Error when id isn't valid (decimal number)", async () => {
      const hasValidId = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.update(1.5, { nom: 'NomdeFamille' }),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : 1.5 is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
        service.update,
      );
      expect(hasValidId).toHaveBeenCalledTimes(1);
      expect(hasValidId).toHaveReturnedWith(false);
    });

    it('should return a message when user is not found', async () => {
      const updateData: UserUpdateDto = {
        nom: 'Updated Name',
      };

      const id: number = 999;

      service.update.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.update(id, updateData),
        HttpStatus.NOT_FOUND,
        makeMessage('User updated failed', `Ce compte n'existe pas.`, null),
        service.update,
        1,
      );
      await expect(service.update).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith({ id }, updateData);
    });

    it('should throw error if DTO is invalid', async () => {
      const invalidUpdateDto: UserUpdateDto = {
        prenom: '',
      };

      const errors: ValidationError[] = await dtoIsValid(
        invalidUpdateDto,
        UserUpdateDto,
      );
      expect(errors.length).not.toBe(0);

      await expectHttpExceptionWithMessage(
        () => controller.update(1, invalidUpdateDto),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          'User created failed !',
          'Les données sont incorrectes !',
          errors,
        ),
        service.update,
      );
      expect(service.update).toHaveBeenCalledTimes(0);
    });

    it('should throw error if database down', async () => {
      const invalidUpdateDto: Partial<UserUpdateDto> = {
        prenom: 'PrenomValide',
      };

      const error = new Error(FATAL_ERROR);
      service.update.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.update(1, invalidUpdateDto as UserDto),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
        service.update,
        1,
      );
      await expect(service.update).rejects.toThrow(Error(FATAL_ERROR));
    });
  });

  describe('UserController - destroy()', () => {
    beforeEach(() => {
      service.destroy.mockReset();
      hasValidIDMock = jest.spyOn(ID, 'hasValid');
      hasValidIDMock.mockReset();
      hasValidIDMock.mockReturnValue(true);
    });
    afterEach(() => jest.restoreAllMocks());

    it('should delete user with success message', async () => {
      service.destroy.mockResolvedValue(null);

      const result: Promise<Message> = controller.destroy(1);

      hasValidIDMock;

      await expect(result).resolves.toEqual({
        message: 'La suppression de votre compte utilisateur est un succée !',
        data: null,
      });

      expect(service.destroy).toHaveBeenCalledTimes(1);
      expect(service.destroy).toHaveBeenCalledWith({ id: 1 });
      expect(service.destroy).toHaveReturned();
    });

    it('should return a message when user is not found', async () => {
      const id: number = 999;

      service.destroy.mockRejectedValue(new NotFoundException());

      await expectHttpExceptionWithMessage(
        () => controller.destroy(id),
        HttpStatus.NOT_FOUND,
        makeMessage('User deleted failed', `Ce compte n'existe pas.`, null),
        service.destroy,
        1,
      );
      await expect(service.destroy).rejects.toThrow(NotFoundException);

      expect(service.destroy).toHaveBeenCalledWith({ id: 999 });
    });

    it("sould return an Error when id isn't valid (decimal number)", async () => {
      let hasValid = hasValidIDMock.mockReturnValue(false);

      await expectHttpExceptionWithMessage(
        () => controller.destroy(1.5),
        HttpStatus.BAD_REQUEST,
        makeMessage(
          `Error Param ID : 'undefined' is invalid.`,
          "L'id doit être un nombre entier.",
          null,
        ),
      );
      expect(hasValid).toHaveBeenCalledTimes(1);
      expect(hasValid).toHaveBeenCalledWith(1.5);
      expect(hasValid).toHaveLastReturnedWith(false);
    });

    it('should throw error if database down', async () => {
      const error = new Error(FATAL_ERROR);
      service.destroy.mockRejectedValue(error);

      await expectHttpExceptionWithMessage(
        () => controller.destroy(1),
        HttpStatus.INTERNAL_SERVER_ERROR,
        makeMessage(
          'Fatal Error',
          "Une erreur est survenue, essayer de contacter l'administrateur ou réessayer ultérieurement.",
          error,
          { level: 'Fatal' },
        ),
        service.destroy,
        1,
      );
      await expect(service.destroy).rejects.toThrow(Error(FATAL_ERROR));
    });
  });
});
