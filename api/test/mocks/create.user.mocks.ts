import { User } from '@prisma/client';
import {
  UserLoginCredentials,
  UserPasswordFields,
} from 'src/modules/user/dto/user.dto';
import { Role } from '../roles/role.enum';

export const createUserMock = (overrides: Partial<User> = {}) => ({
  id: 1,
  nom: 'Does',
  prenom: 'John',
  pseudo: 'johndoe',
  email: 'johndoe@gmail.com',
  password: '$2a$12$DmlYlfVAFw4C6L.x9qx4guuZI1Djps6.TIzlMFeVFWUWSyXH4RBpC', // mot de passe -> "password"
  role: Role.User,
  created_at: new Date(),
  updated_at: new Date(),
  posts: [],
  ...overrides,
});

export const createNewUserMock = (overrides: Partial<User> = {}) => ({
  id: 1,
  nom: 'John',
  prenom: 'Jonny',
  pseudo: 'Jonny',
  email: 'johnny@email.com',
  password: 'securepass', // mot de passe -> "password"
  role: Role.User,
  created_at: new Date(),
  updated_at: new Date(),
  posts: undefined,
  ...overrides,
});
export const createInvalidDto = (overrides: Partial<User> = {}) => ({
  id: 1,
  nom: '', // vide
  prenom: '',
  email: 'not-an-email', // email invalide
  password: '',
  pseudo: '',
  role: Role.User,
  created_at: new Date(),
  updated_at: new Date(),
  posts: [],
  ...overrides,
});

export const createUserLoginDto = (
  overrides: Partial<UserLoginCredentials> = {},
) => ({
  email: 'johndoe@email.com',
  password: 'password',
  ...overrides,
});

export const createUserInvalidLoginDto = (
  overrides: Partial<UserLoginCredentials> = {},
) => ({
  email: '',
  password: '',
  ...overrides,
});

export const createWrongUserLoginDto = (
  overrides: Partial<UserLoginCredentials> = {},
) => ({
  email: 'fake.email@gmail.com',
  password: 'notsamepassword',
  ...overrides,
});

export const createFieldsPasswordManagerDto = (
  overrides: Partial<UserPasswordFields> = {},
) => ({
  email: 'johndoe@email.com',
  old_password: 'password',
  password: 'newpassword',
  confirm_password: 'newpassword',
  ...overrides,
});

export const createWrongFieldsPasswordManagerDto = (
  overrides: Partial<UserPasswordFields> = {},
) => ({
  email: 'johnny@email.com',
  old_password: 'password',
  password: 'newpassword',
  confirm_password: 'newpassword',
  ...overrides,
});
