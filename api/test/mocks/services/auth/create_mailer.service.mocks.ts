type MailerServiceMockType = {
  sendEmailToken: jest.Mock;
};

export const createMailerServiceMock = (): MailerServiceMockType => {
  return {
    sendEmailToken: jest.fn(),
  };
};
