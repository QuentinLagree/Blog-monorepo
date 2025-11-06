export type MailerServiceMockType = {
  sendMail: jest.Mock;
};

export const CreateMailerServiceMock = (): MailerServiceMockType => {
  return {
    sendMail: jest.fn(),
  };
};
