import { SessionOptions } from "iron-session";

export interface SessionData {
  whmcsClientId: number;
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  whmcsClientId: 0,
  email: "",
  name: "",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "proxiesnow_session",
  ttl: 60 * 60 * 24, // 24 hours
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
