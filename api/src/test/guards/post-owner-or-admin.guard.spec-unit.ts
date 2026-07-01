import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PostOwnerOrAdminGuard } from 'src/commons/guards/post-owner-or-admin.guard';
import { Role } from 'src/commons/roles/role.enum';
import { ArticleService } from 'src/modules/post/posts.service';

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
    jest.clearAllMocks();

    guard = new PostOwnerOrAdminGuard(
      articleServiceMock as unknown as ArticleService,
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

  it('should throw UnauthorizedException if session user is missing', async () => {
    const context = createExecutionContextMock({}, { id: '1' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(articleServiceMock.indexOneWhere).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if post id is invalid', async () => {
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
      ForbiddenException,
    );

    expect(articleServiceMock.indexOneWhere).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if post does not exist', async () => {
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
      NotFoundException,
    );

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });
  });

  it('should throw ForbiddenException if user is not author and not admin', async () => {
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
      ForbiddenException,
    );

    expect(articleServiceMock.indexOneWhere).toHaveBeenCalledWith({
      id: 1,
    });
  });
});