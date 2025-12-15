import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://as-academy-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Try to refresh token
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                // Save new access token
                localStorage.setItem('accessToken', data.data.accessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

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
    resetDevice: (userId) => api.post(`/auth/admin/reset-device/${userId}`),
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
    createOrder: (courseId) => api.post('/payments/create-order', { courseId }),
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
};

export const lectureAPI = {
    getByChapter: (chapterId) => api.get(`/lectures/chapter/${chapterId}`),
    getById: (id) => api.get(`/lectures/${id}`),
    create: (data) => api.post('/lectures', data),
    update: (id, data) => api.put(`/lectures/${id}`, data),
    delete: (id) => api.delete(`/lectures/${id}`),
    getProgress: (id) => api.get(`/lectures/${id}/progress`),
    updateProgress: (id, data) => api.post(`/lectures/${id}/progress`, data),
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

export const settingsAPI = {
    getAll: () => api.get('/settings'),
    getByKey: (key) => api.get(`/settings/${key}`),
    update: (key, value) => api.put(`/settings/${key}`, { value }),
};

