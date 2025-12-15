import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

// Generate device fingerprint for device tracking
const generateDeviceId = () => {
    // Check if device_id already exists in localStorage
    let deviceId = localStorage.getItem('device_id');

    if (!deviceId) {
        // Create fingerprint from browser characteristics
        const userAgent = navigator.userAgent || '';
        const screenResolution = `${screen.width}x${screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const language = navigator.language || '';
        const platform = navigator.platform || '';

        // Combine characteristics and create hash
        const fingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}-${platform}`;

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        deviceId = Math.abs(hash).toString(16);
        localStorage.setItem('device_id', deviceId);
    }

    return deviceId;
};

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

                    // Generate device ID for device tracking
                    const deviceId = generateDeviceId();

                    const response = await api.post('/auth/login', {
                        email,
                        password,
                        deviceId
                    });
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
