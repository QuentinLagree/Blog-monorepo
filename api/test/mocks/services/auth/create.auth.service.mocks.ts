type AuthServiceMockType = {
  login: jest.Mock;
  setToken: jest.Mock;
  deleteToken: jest.Mock;
  setUserSession: jest.Mock;
  isVerificationTokenValid: jest.Mock;
  generateToken: jest.Mock;
  sendEmailToken: jest.Mock;
  tokenIsExpired: jest.Mock;
  comparePassword: jest.Mock;
  throwAnNotSamePasswordExceptionIfNotSame: jest.Mock;
};

export const createAuthServiceMock = (): AuthServiceMockType => {
  return {
    login: jest.fn(),
    setToken: jest.fn(),
    deleteToken: jest.fn(),
    setUserSession: jest.fn(),
    isVerificationTokenValid: jest.fn(),
    generateToken: jest.fn(),
    sendEmailToken: jest.fn(),
    tokenIsExpired: jest.fn(),
    comparePassword: jest.fn(),
    throwAnNotSamePasswordExceptionIfNotSame: jest.fn(),
  };
};
