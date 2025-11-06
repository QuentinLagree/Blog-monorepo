type createTokenServiceMockType = {
  generate: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
  assertVerificationTokenIsValid: jest.Mock;
};

export const createTokenServiceMock = (): createTokenServiceMockType => {
  return {
    generate: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    assertVerificationTokenIsValid: jest.fn(),
  };
};
