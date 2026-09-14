import axios from 'axios';
import { useUserDetailStore } from '@/store/store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Sessions live in an httpOnly cookie set by the API. `withCredentials` sends it;
// `X-Requested-With` satisfies the API's CSRF guard on state-changing requests.
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            useUserDetailStore.getState().clearUserDetail();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
                window.location.assign('/auth/login');
            }
        }
        return Promise.reject(error);
    }
);
