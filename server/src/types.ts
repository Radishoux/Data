import type { IUser } from './models/User.js';

export type HonoEnv = {
  Variables: {
    userId: string;
    user: IUser;
  };
};
