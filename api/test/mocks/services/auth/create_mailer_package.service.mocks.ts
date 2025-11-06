export type MailerPackageServiceMockType = {
  sendMail: jest.Mock;
};

export const CreatePackageMailerService = (): MailerPackageServiceMockType => {
  return {
    sendMail: jest.fn(),
  };
};
