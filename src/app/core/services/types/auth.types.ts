export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginRes {
  access_token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
  };
}

export interface ValidateTokenRes {
  valid: boolean;
  user: {
    email: string;
    roles: string[];
  };
}

export interface UserProfile {
  email: string;
  name?: string;
  roles: string[];
}
