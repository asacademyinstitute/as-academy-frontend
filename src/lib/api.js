import axios from 'axios';

// API Base URL - must be set at runtime
// For local development, use .env.local with NEXT_PUBLIC_API_URL
// For production, set in Vercel environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : undefined;

// Only throw error at runtime (not during build)
if (typeof window !== 'undefined' && !API_BASE_URL) {
    console.error('âŒ NEXT_PUBLIC_API_URL is not defined. API calls will fail.');
}


// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token and device ID
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        const deviceId = localStorage.getItem('device_fingerprint_id');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device ID to all requests
        if (deviceId) {
            config.headers['X-Device-ID'] = deviceId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh and SPECIFIC device session errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest.url || '';

        // ============================================
        // CRITICAL: Handle DEVICE_SESSION_INVALID
        // ============================================
        // Auto-logout ONLY when backend explicitly returns this code
        // This happens when device validation fails on protected APIs
        if (error.response?.data?.code === 'DEVICE_SESSION_INVALID') {
            // NEVER auto-logout on auth routes (prevent loop)
            const isAuthRoute =
                requestUrl.includes('/auth/login') ||
                requestUrl.includes('/auth/register') ||
                requestUrl.includes('/auth/signup') ||
                requestUrl.includes('/auth/refresh');

            if (!isAuthRoute) {
                console.error('ðŸš« DEVICE_SESSION_INVALID - forcing logout');
                console.error('Request URL:', requestUrl);

                // Complete cleanup - clear ALL storage
                localStorage.clear();
                sessionStorage.clear();

                // Redirect to login ONCE
                window.location.href = '/login?error=device_reset';
                return Promise.reject(error);
            }
        }

        // ============================================
        // Handle 401 - Token Refresh
        // ============================================
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const deviceId = localStorage.getItem('device_fingerprint_id');

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Try to refresh token (include device ID)
                // Use the base URL with /api prefix
                const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
                    refreshToken,
                }, {
                    headers: {
                        'X-Device-ID': deviceId
                    }
                });

                // Save new access token
                localStorage.setItem('accessToken', data.data.accessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                console.error('ðŸš« Token refresh failed - forcing logout');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login?error=session_expired';
                return Promise.reject(refreshError);
            }
        }

        // All other errors pass through normally
        return Promise.reject(error);
    }
);

export default api;

// API methods
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
};

export const coursesAPI = {
    getAll: (params) => api.get('/courses', { params }),
    getById: (id) => api.get(`/courses/${id}`),
    create: (data) => api.post('/courses', data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`),
    getStats: (id) => api.get(`/courses/${id}/stats`),
};

export const enrollmentAPI = {
    getStudentEnrollments: (studentId) => api.get(`/enrollments/student/${studentId}`),
    getCourseEnrollments: (courseId) => api.get(`/enrollments/course/${courseId}`),
    getByCourse: (courseId) => api.get(`/enrollments/course/${courseId}`), // Alias for getCourseEnrollments
    checkAccess: (courseId) => api.get(`/enrollments/check/${courseId}`),
    getCourseProgress: (courseId) => api.get(`/enrollments/course/${courseId}/progress`),
    extendEnrollment: (enrollmentId, days) => api.post(`/enrollments/${enrollmentId}/extend`, { additionalDays: days }),
    cancelEnrollment: (enrollmentId) => api.post(`/enrollments/${enrollmentId}/cancel`),
    deleteEnrollment: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),
    unblockEnrollment: (enrollmentId) => api.post(`/enrollments/${enrollmentId}/unblock`),
    adminEnroll: (data) => api.post('/enrollments/admin-enroll', data),
};

export const paymentAPI = {
    createOrder: (courseId, couponCode = null) => api.post('/payments/create-order', { courseId, couponCode }),
    verifyPayment: (data) => api.post('/payments/verify', data),
    offlineEnroll: (data) => api.post('/payments/offline-enroll', data),
    getHistory: (params) => api.get('/payments/history', { params }),
    getStats: () => api.get('/payments/stats'),
};

export const streamingAPI = {
    getVideoUrl: (lectureId) => api.get(`/streaming/video/${lectureId}`),
    getPdfUrl: (lectureId) => api.get(`/streaming/pdf/${lectureId}`),
    getPdfStream: (lectureId) => api.get(`/streaming/stream/pdf/${lectureId}`, { responseType: 'blob' }),
    getWatermark: () => api.get('/streaming/watermark'),
    uploadFile: (formData) => api.post('/streaming/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getAdminDownloadUrl: (lectureId) => api.get(`/streaming/admin/download/${lectureId}`),
    getSignedUrl: (fileKey) => api.post('/streaming/signed-url', { fileKey }),
};

export const lectureAPI = {
    getByChapter: (chapterId) => api.get(`/lectures/chapter/${chapterId}`),
    getById: (id) => api.get(`/lectures/${id}`),
    create: (data) => api.post('/lectures', data),
    update: (id, data) => api.put(`/lectures/${id}`, data),
    delete: (id) => api.delete(`/lectures/${id}`),
    getProgress: (id) => api.get(`/lectures/${id}/progress`),
    updateProgress: (id, data) => api.post(`/lectures/${id}/progress`, data),
    transfer: (data) => api.post('/lectures/transfer', data),
};

export const chapterAPI = {
    getByCourse: (courseId) => api.get(`/chapters/course/${courseId}`),
    getById: (id) => api.get(`/chapters/${id}`),
    create: (data) => api.post('/chapters', data),
    update: (id, data) => api.put(`/chapters/${id}`, data),
    delete: (id) => api.delete(`/chapters/${id}`),
    reorder: (courseId, orders) => api.post(`/chapters/course/${courseId}/reorder`, { chapterOrders: orders }),
};

export const quizAPI = {
    getByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
    getById: (id) => api.get(`/quizzes/${id}`),
    create: (data) => api.post('/quizzes', data),
    submit: (id, answers) => api.post(`/quizzes/${id}/submit`, { answers }),
    getAttempts: (studentId, quizId) => api.get(`/quizzes/student/${studentId}/attempts`, { params: { quizId } }),
    delete: (id) => api.delete(`/quizzes/${id}`),
};

export const certificateAPI = {
    generate: (courseId) => api.post('/certificates/generate', { courseId }),
    getStudentCertificates: (studentId) => api.get(`/certificates/student/${studentId}`),
    getDownloadUrl: (id) => api.get(`/certificates/${id}/download`),
    verify: (certificateNumber) => api.get(`/certificates/verify/${certificateNumber}`),
};

export const userAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
    getCourses: (id) => api.get(`/users/${id}/courses`),
    getStats: (id) => api.get(`/users/${id}/stats`),
    resetDevice: (id) => api.post(`/users/${id}/reset-device`),
    requestCourse: (data) => api.post('/users/request-course', data),
    getDevices: (id) => api.get(`/users/${id}/devices`),
};


export const aiAPI = {
    solveDoubt: (question, context) => api.post('/ai/solve-doubt', { question, context }),
    summarize: (content) => api.post('/ai/summarize', { content }),
    getStudyTips: (topic) => api.post('/ai/study-tips', { topic }),
};

export const auditAPI = {
    getLogs: (params) => api.get('/audit', { params }),
    getUserActivity: (userId, days) => api.get(`/audit/user/${userId}`, { params: { days } }),
};

// Device Management API
export const deviceAPI = {
    getActivity: (params) => api.get('/devices/activity', { params }),
    getSettings: () => api.get('/devices/settings'),
    updateSettings: (data) => api.put('/devices/settings', data),
    resetAll: () => api.post('/devices/reset-all'),
    forceLogout: (userId) => api.post(`/devices/${userId}/force-logout`),
    resetUserDevices: (userId) => api.post(`/devices/${userId}/reset`),
    blockDevice: (deviceId) => api.post(`/devices/${deviceId}/block`),
};

// Course Request API
export const courseRequestAPI = {
    create: (data) => api.post('/course-requests', data),
    getAll: (params) => api.get('/course-requests', { params }),
    getMy: () => api.get('/course-requests/my'),
    approve: (id) => api.put(`/course-requests/${id}/approve`),
    reject: (id, adminNotes) => api.put(`/course-requests/${id}/reject`, { adminNotes }),
    update: (id, data) => api.put(`/course-requests/${id}`, data),
    delete: (id) => api.delete(`/course-requests/${id}`),
};

// Advanced Payment Analytics API
export const paymentAnalyticsAPI = {
    getAdvanced: () => api.get('/payments/analytics/advanced'),
    getByMonth: () => api.get('/payments/analytics/by-month'),
    getByCourse: () => api.get('/payments/analytics/by-course'),
    getFiltered: (params) => api.get('/payments/filtered', { params }),
};

// Coupon API
export const couponAPI = {
    create: (data) => api.post('/coupons', data),
    getAll: (params) => api.get('/coupons', { params }),
    getOne: (id) => api.get(`/coupons/${id}`),
    update: (id, data) => api.put(`/coupons/${id}`, data),
    delete: (id) => api.delete(`/coupons/${id}`),
    toggle: (id) => api.patch(`/coupons/${id}/toggle`),
    validate: (code, courseId) => api.post('/coupons/validate', { code, courseId }),
    getStats: (id) => api.get(`/coupons/${id}/stats`),
};

// Top Rankers API
export const topRankersAPI = {
    getActive: () => api.get('/top-rankers'),
    getAll: () => api.get('/top-rankers/admin'),
    create: (data) => api.post('/top-rankers', data),
    update: (id, data) => api.put(`/top-rankers/${id}`, data),
    delete: (id) => api.delete(`/top-rankers/${id}`),
    toggle: (id) => api.post(`/top-rankers/${id}/toggle`),
};