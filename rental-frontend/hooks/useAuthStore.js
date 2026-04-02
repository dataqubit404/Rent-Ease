import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  init: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rental_token');
      const user = localStorage.getItem('rental_user');
      if (token && user) {
        set({ token, user: JSON.parse(user), isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('rental_token', data.token);
    localStorage.setItem('rental_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  register: async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('rental_token', data.token);
    localStorage.setItem('rental_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  logout: () => {
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData };
    localStorage.setItem('rental_user', JSON.stringify(updated));
    set({ user: updated });
  },
}));

export default useAuthStore;
