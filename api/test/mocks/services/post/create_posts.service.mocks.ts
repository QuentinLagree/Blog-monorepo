type PostsServiceMockType = {
  index: jest.Mock;
  indexWhere: jest.Mock;
  show: jest.Mock;
  store: jest.Mock;
  update: jest.Mock;
  destroy: jest.Mock;
};

export const CreatePostsServiceMock = (): PostsServiceMockType => {
  return {
    index: jest.fn(),
    indexWhere: jest.fn(),
    show: jest.fn(),
    store: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };
};
