import { UserSession } from "./session-user.type";

export type SessionType = {
  loggedIn: boolean;
  user?: UserSession;
};
