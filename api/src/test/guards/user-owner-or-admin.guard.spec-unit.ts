import { UserService } from 'src/modules/user/user.service';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserOwnerOrAdminGuard } from 'src/commons/guards/user-owner-or-admin.guard';
import { Role } from 'src/commons/roles/role.enum';
import { UserNotHaveAuthorisation } from 'src/modules/user/exceptions/user-not-have-authorization';
import { UserSessionInvalidException } from 'src/modules/user/exceptions/user-session-invalid-expired.exception';

describe('UserOwnerOrAdminGuard', () => {
  let guard: UserOwnerOrAdminGuard;

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

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});

    guard = new UserOwnerOrAdminGuard({
      show: jest.fn().mockResolvedValue({ role: Role.Admin }),
    } as unknown as UserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true if connected user is owner', async () => {
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

    expect(response).toBe(true);
  });

  it('should return true if connected user is admin', async () => {
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

    expect(response).toBe(true);
  });

  it('should throw UserSessionInvalidException if session user is missing', async () => {
    const context = createExecutionContextMock({}, { id: '1' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UserSessionInvalidException,
    );
  });

  it('should throw BadRequestException if param id is invalid', async () => {
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
      BadRequestException,
    );
  });

  it('should throw UserNotHaveAuthorisation if user is not owner and not admin', async () => {
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
  });
});
