import { api } from '@/http/api';

// Logs in an admin with email and password. The API sets an httpOnly session cookie.
export const login = async (data: { email: string; password: string }) => api.post('auth/login', data);

// Returns the current session's user, or 401 when not logged in.
export const me = async () => api.get('auth/me');

// Clears the session cookie on the API.
export const logout = async () => api.post('auth/logout');
