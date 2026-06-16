import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';
import { authApi } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login({ username, password });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
        return true;
      } else {
        set({
          error: response.error || '登录失败',
          loading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: '网络错误，请稍后重试',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
        });
      } else {
        localStorage.removeItem('token');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      }
    } catch {
      localStorage.removeItem('token');
      set({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  },

  hasPermission: (requiredRoles: UserRole[]) => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return false;
    return requiredRoles.includes(user.role);
  },

  updatePassword: async (oldPassword: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.updatePassword({ oldPassword, newPassword });
      if (response.success) {
        set({ loading: false });
        return true;
      } else {
        set({ error: response.error || '修改密码失败', loading: false });
        return false;
      }
    } catch (error) {
      set({ error: '网络错误，请稍后重试', loading: false });
      return false;
    }
  },
}));
