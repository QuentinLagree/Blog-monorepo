type UserServiceMockType = {
  index: jest.Mock;
  show: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  destroy: jest.Mock;
};

export const createUserServiceMock = (): UserServiceMockType => {
  return {
    index: jest.fn(),
    show: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };
};
