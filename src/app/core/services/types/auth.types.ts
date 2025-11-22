import { UserRole } from './common.types';

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
    roles?: UserRole[];
  };
}

export interface ValidateTokenRes {
  valid: boolean;
  user: {
    id: string;
    email: string;
    roles: UserRole[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
}
