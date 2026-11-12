import { UserController } from 'src/modules/user/user.controller';
import { createUserCreateDto } from '../mocks/create.user.mocks';
import { UserNotFoundException } from 'src/modules/user/exceptions/user-not-found.exception';
import { UserAlreadyExistException } from 'src/modules/user/exceptions/user-already-exist.exception';
import { UserUpdateDto } from 'src/modules/user/dto/update-user.dto';
import { userServiceMock } from '../mocks/mocks';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserService } from 'src/modules/user/user.service';
import { ArticleService } from 'src/modules/post/posts.service';

describe('UserController', () => {
  let userController: UserController;
  const articleServiceMock = { indexWhere: jest.fn() };
  const createUserMock = (
    overrides: Partial<
      import('src/modules/user/user.service').userSelectPayload
    > = {},
  ) => ({
    id: 1,
    pseudo: 'testuser',
    role: 'user',
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();

    userController = new UserController(
      userServiceMock as unknown as UserService,
      articleServiceMock as unknown as ArticleService,
    );
  });

  describe('index', () => {
    it('should return an empty array', async () => {
      userServiceMock.index.mockResolvedValue([]);

      const response = await userController.index();

      expect(response).toEqual({
        message: 'La liste des utilisateurs est vide',
        data: [],
        meta: undefined,
      });

      expect(userServiceMock.index).toHaveBeenCalledTimes(1);
    });

    it('should return an user array', async () => {
      const result = [createUserMock()];
      userServiceMock.index.mockResolvedValue(result);
      const response = await userController.index();

      expect(response).toEqual({
        message: 'Liste de tous les utilisateurs',
        data: result,
        meta: undefined,
      });
    });
  });

  describe('show', () => {
    it('should return a success if user is found', async () => {
      const result = createUserMock();

      userServiceMock.show.mockResolvedValue(result);

      const response = await userController.show(1);

      expect(userServiceMock.show).toHaveBeenCalledWith({ id: 1 });

      expect(response).toEqual({
        message: `L'utilisateur ${result.id} a bien été trouvé.`,
        data: result,
        meta: undefined,
      });
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const id = 1;

      userServiceMock.show.mockRejectedValue(new UserNotFoundException(id));

      await expect(userController.show(id)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userServiceMock.show).toHaveBeenCalledWith({ id });
    });
  });

  describe('store', () => {
    it('should return a success if user is created', async () => {
      let new_user = createUserMock({ id: 1 });
      let dto = createUserCreateDto();

      userServiceMock.create.mockResolvedValue(new_user);

      const response = await userController.store(dto as CreateUserDto);

      expect(response).toEqual({
        message: "L'utilisateur est bien enregistré !",
        data: new_user,
        meta: undefined,
      });
      expect(userServiceMock.create).toHaveBeenCalledWith(dto);
    });

    it('should throw UserAlreadyExistException if email or pseudo are already used', async () => {
      let dto = createUserCreateDto({ email: 'existing@gmail.com' });

      userServiceMock.create.mockRejectedValue(
        new UserAlreadyExistException('email'),
      );

      await expect(userController.store(dto as CreateUserDto)).rejects.toThrow(
        UserAlreadyExistException,
      );

      expect(userServiceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should return a success if user is updated', async () => {
      const id = 1;
      const dto: UserUpdateDto = { prenom: 'Jean' };

      const updatedUser = createUserMock({ id });

      userServiceMock.update.mockResolvedValue(updatedUser);

      const response = await userController.update(id, dto as UserUpdateDto);

      expect(userServiceMock.update).toHaveBeenCalledWith({ id }, dto);

      expect(response).toEqual({
        message: 'La modification de vos informations est bien sauvegardée !',
        data: updatedUser,
        meta: undefined,
      });
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const id = 1;
      const dto: UserUpdateDto = { prenom: 'Jean' };

      userServiceMock.update.mockRejectedValue(new UserNotFoundException(id));

      await expect(
        userController.update(id, dto as UserUpdateDto),
      ).rejects.toThrow(UserNotFoundException);

      expect(userServiceMock.update).toHaveBeenCalledWith({ id }, dto);
    });
  });

  describe('destroy', () => {
    it('should return a success message if user is deleted', async () => {
      let id = 1;
      userServiceMock.destroy.mockResolvedValue(undefined);
      const response = await userController.destroy(id);

      expect(response).toEqual({
        message: 'La suppression de votre compte utilisateur est un succès !',
        data: null,
        meta: undefined,
      });

      expect(userServiceMock.destroy).toHaveBeenCalledWith({ id });
    });

    it('should throw UserNotFoundException if user is not found', async () => {
      const id = 1;

      userServiceMock.destroy.mockRejectedValue(new UserNotFoundException(id));

      await expect(userController.destroy(id)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(userServiceMock.destroy).toHaveBeenCalledWith({ id });
    });
  });

  describe.each([
    ['getAllDraftsOfUser', true],
    ['getAllPostsOfUser', false],
  ] as const)('%s', (method, draftsOnly) => {
    const id = 42;
    const user = createUserMock({ id, pseudo: 'testauthor' });
    const where = draftsOnly
      ? { authorId: id, published_at: null }
      : { authorId: id };

    it('should return an empty list when the user has no matching posts', async () => {
      userServiceMock.show.mockResolvedValue(user);
      articleServiceMock.indexWhere.mockResolvedValue([]);
      const response = await userController[method](id);
      expect(userServiceMock.show).toHaveBeenCalledWith({ id });
      expect(articleServiceMock.indexWhere).toHaveBeenCalledWith(where);
      expect(response.data).toEqual([]);
      expect(response.message).toContain(user.pseudo);
    });

    it('should return matching posts for the requested user', async () => {
      const posts = [
        { id: 75, authorId: id, title: 'Test', published_at: null },
      ];
      userServiceMock.show.mockResolvedValue(user);
      articleServiceMock.indexWhere.mockResolvedValue(posts);
      const response = await userController[method](id);
      expect(userServiceMock.show).toHaveBeenCalledWith({ id });
      expect(articleServiceMock.indexWhere).toHaveBeenCalledWith(where);
      expect(response.data).toEqual(posts);
      expect(response.message).toContain(user.pseudo);
    });

    it('should not search posts when the user cannot be found', async () => {
      const error = new UserNotFoundException(id);
      userServiceMock.show.mockRejectedValue(error);
      await expect(userController[method](id)).rejects.toBe(error);
      expect(articleServiceMock.indexWhere).not.toHaveBeenCalled();
    });

    it('should propagate a post lookup failure', async () => {
      const error = new Error('Post lookup failed');
      userServiceMock.show.mockResolvedValue(user);
      articleServiceMock.indexWhere.mockRejectedValue(error);
      await expect(userController[method](id)).rejects.toBe(error);
      expect(articleServiceMock.indexWhere).toHaveBeenCalledWith(where);
    });
  });
});
