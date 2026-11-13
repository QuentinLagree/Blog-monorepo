import type { Session } from '@fastify/secure-session';
import { MeController } from 'src/modules/me/me.controller';
import { UserService } from 'src/modules/user/user.service';
import { ArticleService } from 'src/modules/post/posts.service';

describe('MeController', () => {
  const users = { profile: jest.fn(), update: jest.fn(), destroy: jest.fn() };
  const posts = { indexWhere: jest.fn() };
  const sessionMock = { set: jest.fn(), delete: jest.fn() };
  const session = sessionMock as unknown as Session;
  const user = { id: 42, email: 'me@test.com', role: 'user' };
  const profile = { ...user, pseudo: 'myself' };
  let controller: MeController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new MeController(
      users as unknown as UserService,
      posts as unknown as ArticleService,
    );
    users.profile.mockResolvedValue(profile);
  });

  it('returns session data without its credential version', async () => {
    const response = await controller.status({
      ...user,
      credentialVersion: 'private',
    });
    expect(response.data).toEqual({ loggedIn: true, user });
  });

  it('loads only the current profile', async () => {
    expect((await controller.profile(user)).data).toEqual(profile);
    expect(users.profile).toHaveBeenCalledWith(42);
  });

  it('loads only the current user articles, including an empty list', async () => {
    posts.indexWhere.mockResolvedValue([]);
    expect((await controller.index(user)).data).toEqual([]);
    expect(posts.indexWhere).toHaveBeenCalledWith({ authorId: 42 });
  });

  it('allows only profile fields when updating the current account', async () => {
    const payload = { pseudo: 'new', role: 'admin', id: 99, posts: [] };
    await controller.update(user, payload, session);
    expect(users.update).toHaveBeenCalledWith(
      { id: 42 },
      {
        nom: undefined,
        prenom: undefined,
        pseudo: 'new',
        email: undefined,
        password: undefined,
      },
    );
    expect(sessionMock.delete).not.toHaveBeenCalled();
  });

  it('updates the email in the current session after a successful update', async () => {
    users.profile.mockResolvedValue({ ...profile, email: 'new@test.com' });
    await controller.update(user, { email: 'new@test.com' }, session);
    expect(sessionMock.set).toHaveBeenCalledWith('user', {
      ...user,
      email: 'new@test.com',
    });
  });

  it('clears the current session after a password change', async () => {
    await controller.update(user, { password: 'new-password' }, session);
    expect(sessionMock.set).toHaveBeenCalledWith('user', null);
    expect(sessionMock.delete).toHaveBeenCalledTimes(1);
  });

  it('does not clear a session when updating fails', async () => {
    users.update.mockRejectedValue(new Error('Update failed'));
    await expect(
      controller.update(user, { password: 'new-password' }, session),
    ).rejects.toThrow('Update failed');
    expect(sessionMock.delete).not.toHaveBeenCalled();
  });

  it('deletes only the current account and clears the session', async () => {
    await controller.destroy(user, session);
    expect(users.destroy).toHaveBeenCalledWith({ id: 42 });
    expect(sessionMock.set).toHaveBeenCalledWith('user', null);
    expect(sessionMock.delete).toHaveBeenCalledTimes(1);
  });

  it('preserves the session if deleting the account fails', async () => {
    users.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(controller.destroy(user, session)).rejects.toThrow(
      'Delete failed',
    );
    expect(sessionMock.delete).not.toHaveBeenCalled();
  });
});
