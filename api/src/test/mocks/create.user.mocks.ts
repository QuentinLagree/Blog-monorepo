import { User } from '@prisma/client';
import { Role } from 'src/commons/roles/role.enum';

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

export const createUserCreateDto = (overrides: Partial<User> = {}) => {
  return {
    nom: 'john',
    prenom: 'doe',
    pseudo: 'johndoe',
    email: "johndoe@gmail.com",
    password: '',
    role: Role.User,
    ...overrides
  }
};