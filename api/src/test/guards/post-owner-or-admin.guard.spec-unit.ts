import { UserService } from 'src/modules/user/user.service';
import { ExecutionContext } from '@nestjs/common';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { Role } from 'src/commons/roles/role.enum';
import { PostNotFoundException } from 'src/modules/post/exceptions/post-not-found.exception';
import { ArticleService } from 'src/modules/post/posts.service';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { UserSessionInvalidException } from 'src/modules/user/exceptions/user-session-invalid-expired.exception';

describe('PostOwnerOrAdminGuard', () => {
  let guard: PostOwnerOrAdminGuard;

  const articleServiceMock = {
    indexOneWhere: jest.fn(),
  };

  const createExecutionContextMock = (
    session: Record<string, any>,
    params: Record<string, any>,
  ) => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          session,
          params,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  const createPostMock = (override = {}) => ({
    id: 1,
    title: 'Post test',
    content: 'Content test',
    authorId: 1,
    published_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...override,
  });

  beforeEach(() => {
    jest.resetAllMocks();

    guard = new PostOwnerOrAdminGuard(
      articleServiceMock as unknown as ArticleService,
      {
        show: jest.fn().mockResolvedValue({ role: Role.Admin }),
      } as unknown as UserService,
    );
  });

  it('should return true if connected user is post author', async () => {
    const post = createPostMock({
      id: 1,
      authorId: 1,
    });

    articleServiceMock.indexOneWhere.mockResolvedValue(post);

    const context = createExecutionContextMock(
      {
        user: {
          id: 1,
          role: Role.User,
        },
      },
      {
        id: '1',
      },
    );

    const response = await guard.canActivate(context);

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });

    expect(response).toBe(true);
  });

  it('should return true if connected user is admin', async () => {
    const post = createPostMock({
      id: 1,
      authorId: 1,
    });

    articleServiceMock.indexOneWhere.mockResolvedValue(post);

    const context = createExecutionContextMock(
      {
        user: {
          id: 99,
          role: Role.Admin,
        },
      },
      {
        id: '1',
      },
    );

    const response = await guard.canActivate(context);

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });

    expect(response).toBe(true);
  });

  it('should throw UserSessionInvalidException if session user is missing', async () => {
    const context = createExecutionContextMock({}, { id: '1' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UserSessionInvalidException,
    );

    expect(articleServiceMock.indexOneWhere).not.toHaveBeenCalled();
  });

  it('should throw PostNotFoundException if post id is invalid', async () => {
    const context = createExecutionContextMock(
      {
        user: {
          id: 1,
          role: Role.User,
        },
      },
      {
        id: 'abc',
      },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      PostNotFoundException,
    );

    expect(articleServiceMock.indexOneWhere).not.toHaveBeenCalled();
  });

  it('should throw PostNotFoundException if post does not exist', async () => {
    articleServiceMock.indexOneWhere.mockResolvedValue(null);

    const context = createExecutionContextMock(
      {
        user: {
          id: 1,
          role: Role.User,
        },
      },
      {
        id: '1',
      },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      PostNotFoundException,
    );

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });
  });

  it('should throw UserNotHaveAuthorisation if user is not author and not admin', async () => {
    guard = new PostOwnerOrAdminGuard(
      articleServiceMock as unknown as ArticleService,
      {
        show: jest.fn().mockResolvedValue({ role: Role.User }),
      } as unknown as UserService,
    );
    const post = createPostMock({
      id: 1,
      authorId: 1,
    });

    articleServiceMock.indexOneWhere.mockResolvedValue(post);

    const context = createExecutionContextMock(
      {
        user: {
          id: 2,
          role: Role.User,
        },
      },
      {
        id: '1',
      },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UserNotHaveAuthorisation,
    );

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });
  });

  it('should propagate an article lookup failure', async () => {
    const error = new Error('Article lookup failed');
    articleServiceMock.indexOneWhere.mockRejectedValue(error);
    const context = createExecutionContextMock(
      { user: { id: 10, role: Role.User } },
      { id: '42' },
    );
    await expect(guard.canActivate(context)).rejects.toBe(error);
  });

  it('should refuse an administrator cookie after the role is revoked in the database', async () => {
    articleServiceMock.indexOneWhere.mockResolvedValue(
      createPostMock({ authorId: 1 }),
    );
    const users = { show: jest.fn().mockResolvedValue({ role: Role.User }) };
    guard = new PostOwnerOrAdminGuard(
      articleServiceMock as unknown as ArticleService,
      users as unknown as UserService,
    );
    await expect(
      guard.canActivate(
        createExecutionContextMock(
          { user: { id: 99, role: Role.Admin } },
          { id: '1' },
        ),
      ),
    ).rejects.toThrow(UserNotHaveAuthorisation);
    expect(users.show).toHaveBeenCalledWith({ id: 99 });
  });
});
