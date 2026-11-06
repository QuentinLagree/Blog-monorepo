import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
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
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});

    guard = new UserOwnerOrAdminGuard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true if connected user is owner', () => {
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

    const response = guard.canActivate(context);

    expect(response).toBe(true);
  });

  it('should return true if connected user is admin', () => {
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

    const response = guard.canActivate(context);

    expect(response).toBe(true);
  });

  it('should throw UserSessionInvalidException if session user is missing', () => {
    const context = createExecutionContextMock({}, { id: '1' });

    expect(() => guard.canActivate(context)).toThrow(UserSessionInvalidException);
  });

  it('should throw ForbiddenException if param id is invalid', () => {
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

    expect(() => guard.canActivate(context)).toThrow(UserNotHaveAuthorisation);
  });

  it('should throw UserNotHaveAuthorisation if user is not owner and not admin', () => {
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

    expect(() => guard.canActivate(context)).toThrow(UserNotHaveAuthorisation);
  });
});