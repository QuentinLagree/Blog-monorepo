import { UserSession } from "src/modules/auth/dto/user-session.dto";

export type SessionType = {
  loggedIn: boolean;
  user?: UserSession;
};
