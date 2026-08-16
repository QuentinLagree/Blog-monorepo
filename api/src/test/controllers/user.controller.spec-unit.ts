import { UserController } from "src/modules/user/user.controller";
import { makeMessage } from "src/commons/logger/logger.helper";
import { createUserCreateDto, createUserMock } from "../mocks/create.user.mocks";
import { UserNotFoundException } from "src/modules/user/exceptions/user-not-found.exception";
import { UserAlreadyExistException } from "src/modules/user/exceptions/user-already-exist.exception";
import { UserUpdateDto } from "src/modules/user/dto/update-user.dto";
import { userServiceMock } from "../mocks/mocks";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { UserService } from "src/modules/user/user.service";

describe('UserController', () => {
    let userController: UserController;

    beforeEach(() => {
        jest.clearAllMocks();

        userController = new UserController(
            userServiceMock as unknown as UserService,
        );

    });

    describe('index', () => {
        it('should return an empty array', async () => {
            userServiceMock.index.mockResolvedValue([]);

            const response = await userController.index();

            expect(response).toEqual(
                makeMessage(
                    'List of all users is empty.',
                    'La liste des utilisateurs est vide',
                    null,
                ),
            );

            expect(userServiceMock.index).toHaveBeenCalledTimes(1);
        });

        it('should return an user array', async () => {
            let result = createUserMock()
            userServiceMock.index.mockResolvedValue(result);
            const response = await userController.index();

            expect(response).toEqual(
                makeMessage(
                    'List of all users',
                    'Liste de tous les utilisateurs',
                    result,
                )
            )
        })
    });

    describe('show', () => {
        it('should return a success if user is found', async () => {
            const result = createUserMock();

            userServiceMock.show.mockResolvedValue(result);

            const response = await userController.show(1);

            expect(userServiceMock.show).toHaveBeenCalledWith({ id: 1 });

            expect(response).toEqual(
                makeMessage(
                    `User found with ID: ${result.id}!`,
                    `L'utilisateur ${result.id} a bien été trouvé.`,
                    result,
                ),
            );
        });

        it('should throw UserNotFoundException if user is not found', async () => {
            const id = 1;

            userServiceMock.show.mockRejectedValue(
                new UserNotFoundException(id),
            );

            await expect(userController.show(id)).rejects.toThrow(UserNotFoundException);

            expect(userServiceMock.show).toHaveBeenCalledWith({ id });
        });
    });

    describe('store', () => {
        it('should return a success if user is created', async () => {
            let new_user = createUserMock({ id: 1 })
            let dto = createUserCreateDto();

            userServiceMock.create.mockResolvedValue(new_user);

            const response = await userController.store(dto as CreateUserDto);

            expect(response).toEqual(
                makeMessage(
                    'User created !',
                    "L'utilisateur est bien enregistré !",
                    new_user,
                )
            )
            expect(userServiceMock.create).toHaveBeenCalledWith(dto);
        })

        it('should throw UserAlreadyExistException if email or pseudo are already used', async () => {
            let dto = createUserCreateDto({ email: 'existing@gmail.com' });

            userServiceMock.create.mockRejectedValue(
                new UserAlreadyExistException('email'),
            );

            await expect(userController.store(dto as CreateUserDto)).rejects.toThrow(UserAlreadyExistException);

            expect(userServiceMock.create).toHaveBeenCalledWith(dto);
        })
    })

    describe('update', () => {
        it('should return a success if user is updated', async () => {
            const id = 1;
            const dto = createUserMock({
                prenom: 'Jean',
            });

            const updatedUser = createUserMock({
                id,
                prenom: 'Jean',
            });

            userServiceMock.update.mockResolvedValue(updatedUser);

            const response = await userController.update(id, dto as UserUpdateDto);

            expect(userServiceMock.update).toHaveBeenCalledWith(
                { id },
                dto,
            );

            expect(response).toEqual(
                makeMessage(
                    'User updated !',
                    'La modification de vos informations est bien sauvegardée !',
                    updatedUser,
                ),
            );
        });

        it('should throw UserNotFoundException if user is not found', async () => {
            const id = 1;
            const dto = createUserMock({
                prenom: 'Jean',
            });

            userServiceMock.update.mockRejectedValue(
                new UserNotFoundException(id),
            );

            await expect(
                userController.update(id, dto as UserUpdateDto),
            ).rejects.toThrow(UserNotFoundException);

            expect(userServiceMock.update).toHaveBeenCalledWith(
                { id },
                dto,
            );
        });
    });

    describe('destroy', () => {
        it('should return a success message if user is deleted', async () => {
            let id = 1;
            userServiceMock.destroy.mockResolvedValue(undefined);
            const response = await userController.destroy(id);

            expect(response).toEqual(
                makeMessage(
                    'User deleted !',
                    'La suppression de votre compte utilisateur est un succès !',
                    null,
                )
            )

            expect(userServiceMock.destroy).toHaveBeenCalledWith({id});
        })

        it('should throw UserNotFoundException if user is not found', async () => {
            const id = 1;

            userServiceMock.destroy.mockRejectedValue(
                new UserNotFoundException(id),
            );

            await expect(
                userController.destroy(id),
            ).rejects.toThrow(UserNotFoundException);

            expect(userServiceMock.destroy).toHaveBeenCalledWith(
                { id }
            );
        });
    })
});

