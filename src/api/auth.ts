import { request } from './client';
import type { Role } from './types';

export interface AuthTokenOut {
  access_token: string;
  token_type: string;
  user_id: string;
  email?: string | null;
  role?: Role | null;
  full_name?: string | null;
}

export interface EmailLoginIn {
  email: string;
  password: string;
}

export interface SignupIn {
  email: string;
  password: string;
  role: Role;
  full_name: string;
  city?: string | null;
  phone?: string | null;
}

export interface DevLoginIn {
  role: Role;
  full_name?: string;
  city?: string;
  phone?: string;
}

/** Login via the backend auth endpoint */
export const loginWithApi = (body: EmailLoginIn) =>
  request<AuthTokenOut>('/auth/login', { method: 'POST', body });

/** Register via the backend auth endpoint: creates Supabase account + database profile in one step */
export const signupWithApi = (body: SignupIn) =>
  request<AuthTokenOut>('/auth/signup', { method: 'POST', body });

/** 1-click dev login via the backend */
export const devLoginWithApi = (body: DevLoginIn) =>
  request<AuthTokenOut>('/auth/dev-login', { method: 'POST', body });
