import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuardSession } from 'src/commons/guards/AuthGuardsSession.guard';
import { UnauthorizedSessionInactive } from 'src/modules/auth/exceptions/unautorisation-session-inactive.exception';

describe('AuthGuardSession', () => {
  const createExecutionContextMock = (
    session: Record<string, any>,
    responseMock = {},
  ) => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          session,
        }),
        getResponse: jest.fn().mockReturnValue(responseMock),
      }),
    } as unknown as ExecutionContext;
  };

  it('should return true if session contains user', () => {
    const GuardClass = AuthGuardSession();
    const guard = new GuardClass();

    const context = createExecutionContextMock({
      user: {
        id: 1,
        email: 'test@test.com',
      },
    });

    const response = guard.canActivate(context);

    expect(response).toBe(true);
  });

  it('should throw UnauthorizedSessionInactive if session does not contain user', () => {
    const GuardClass = AuthGuardSession();
    const guard = new GuardClass();

    const context = createExecutionContextMock({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedSessionInactive);
  });

  it('should throw UnauthorizedSessionInactive with custom output message', () => {
    const GuardClass = AuthGuardSession(undefined, {
      log: 'Session expired',
      message: 'Votre session a expiré.',
      data: null,
      meta: undefined,
    } as any);

    const guard = new GuardClass();

    const context = createExecutionContextMock({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedSessionInactive);
  });

  it('should redirect and return false if urlRedirect is provided and session is missing', () => {
    const urlRedirectMock = {
      value: jest.fn().mockReturnValue('/auth/login'),
    };

    const responseMock = {
      redirect: jest.fn(),
    };

    const GuardClass = AuthGuardSession(urlRedirectMock as any);
    const guard = new GuardClass();

    const context = createExecutionContextMock({}, responseMock);

    const response = guard.canActivate(context);

    expect(response).toBe(false);
    expect(urlRedirectMock.value).toHaveBeenCalledTimes(1);
    expect(responseMock.redirect).toHaveBeenCalledWith('/auth/login');
  });
});