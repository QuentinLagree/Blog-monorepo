import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/commons/guards/role.guard';
import { Role } from 'src/commons/roles/role.enum';
import { UserService } from 'src/modules/user/user.service';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;

  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  const userServiceMock = {
    show: jest.fn(),
  };

  const createExecutionContextMock = (session: Record<string, any>) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          session,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    rolesGuard = new RolesGuard(
      reflectorMock as unknown as Reflector,
      userServiceMock as unknown as UserService,
    );
  });

  it('should return true if no roles are required', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);

    const context = createExecutionContextMock({});

    const response = await rolesGuard.canActivate(context);

    expect(response).toBe(true);
    expect(userServiceMock.show).not.toHaveBeenCalled();
  });

  it('should return true if required roles list is empty', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([]);

    const context = createExecutionContextMock({});

    const response = await rolesGuard.canActivate(context);

    expect(response).toBe(true);
    expect(userServiceMock.show).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if session does not contain user', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.Admin]);

    const context = createExecutionContextMock({});

    await expect(rolesGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(userServiceMock.show).not.toHaveBeenCalled();
  });

  it('should return true if db user has required role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.Admin]);

    const sessionUser = {
      id: 1,
      role: Role.Admin,
    };

    const dbUser = {
      id: 1,
      role: Role.Admin,
    };

    userServiceMock.show.mockResolvedValue(dbUser);

    const context = createExecutionContextMock({
      user: sessionUser,
    });

    const response = await rolesGuard.canActivate(context);

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: sessionUser.id,
    });

    expect(response).toBe(true);
  });

  it('should throw ForbiddenException if user role is insufficient', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.Admin]);

    const sessionUser = {
      id: 1,
      role: Role.User,
    };

    const dbUser = {
      id: 1,
      role: Role.User,
    };

    userServiceMock.show.mockResolvedValue(dbUser);

    const context = createExecutionContextMock({
      user: sessionUser,
    });

    await expect(rolesGuard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );

    expect(userServiceMock.show).toHaveBeenCalledWith({
      id: sessionUser.id,
    });
  });

  it('should throw if userService.show throws', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.Admin]);

    const sessionUser = {
      id: 1,
      role: Role.Admin,
    };

    const error = new Error('User not found');

    userServiceMock.show.mockRejectedValue(error);

    const context = createExecutionContextMock({
      user: sessionUser,
    });

    await expect(rolesGuard.canActivate(context)).rejects.toThrow(error);
  });
});