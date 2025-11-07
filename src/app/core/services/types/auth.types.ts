export type LoginDto = {
  email: string;
  password: string;
};

export type LoginRes = {
  access_token: string;
  refresh_token?: string;
  user?: { id: string; email: string; name?: string; roles?: string[] };
};

export type ValidateTokenRes = {
  valid: boolean;
  user: {
    email: string;
    roles: string[];
  };
};

export type UserProfile = {
  email: string;
  name?: string;
  roles?: string[];
};
