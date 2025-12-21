import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,

            // Initialize auth state from localStorage
            initialize: () => {
                const token = localStorage.getItem('accessToken');
                const user = localStorage.getItem('user');

                if (token && user) {
                    set({
                        accessToken: token,
                        user: JSON.parse(user),
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    set({ isLoading: false });
                }
            },

            // Login
            login: async (email, password) => {
                try {
                    set({ error: null, isLoading: true });
                    const response = await api.post('/auth/login', { email, password });
                    const { user, accessToken, refreshToken } = response.data.data;

                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        error: null,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // Register
            register: async (userData) => {
                try {
                    set({ error: null, isLoading: true });
                    const response = await api.post('/auth/register', userData);
                    const { user, accessToken, refreshToken } = response.data.data;

                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        error: null,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Registration failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // Logout
            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');

                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        error: null,
                    });
                }
            },

            // Update user data
            updateUser: (userData) => {
                const updatedUser = { ...get().user, ...userData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                set({ user: updatedUser });
            },

            // Clear error
            clearError: () => set({ error: null }),

            // Set tokens (used by API interceptor)
            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refreshToken', refreshToken);
                }
                set({ accessToken, refreshToken });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Initialize on app load
if (typeof window !== 'undefined') {
    useAuthStore.getState().initialize();
}

export default useAuthStore;
