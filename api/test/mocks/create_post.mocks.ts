import { Post } from '@prisma/client';
import { createUserMock } from './create.user.mocks';

export const createPostMock = (overrides: Partial<Post> = {}) => ({
  id: 1,
  authorId: 1,
  title: 'Titre de la publication',
  content: 'Contenue de la publication',
  published: false,
  created_at: new Date(),
  updated_at: new Date(),
  author: createUserMock(),
  ...overrides,
});
