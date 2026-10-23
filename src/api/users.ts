import { request } from './client';
import type { ProfileInput, PublicUser, User } from './types';

/** 403 means the user is logged in but has not created a profile yet. */
export const getMe = () => request<User>('/users/me');

/** Creates the profile on first call, updates it afterwards. The role cannot change later. */
export const saveProfile = (body: ProfileInput) => request<User>('/users/me', { method: 'PUT', body });

export const setPushToken = (token: string) =>
  request<void>('/users/me/push-token', { method: 'PUT', body: { token } });

export const getPublicProfile = (userId: string) => request<PublicUser>(`/users/${userId}`);
