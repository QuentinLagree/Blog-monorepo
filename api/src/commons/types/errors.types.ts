// import { Message } from "../utils/logger.utils";

type ErrorCategories = 'login';
type ErrorType = 'notFound';

type Message = {
  log: string;
  message: string;
  data: any;
};

export const Messages: Record<ErrorCategories, Record<ErrorType, Message>> = {
  login: {
    notFound: {
      log: 'User logged failed',
      message: "L'email ou le mot de passe est incorrect",
      data: null,
    },
  },
};
