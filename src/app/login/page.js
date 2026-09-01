'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { customAlert } from '@/components/ui/custom-modal';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: '',
        general: ''
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const err = urlParams.get('error');
            if (err === 'device_session_invalid') {
                setFieldErrors(prev => ({
                    ...prev,
                    general: "Your session has been invalidated because this account has been logged in on another device. Please contact your admin or teacher to reset your device link."
                }));
            }
        }
    }, []);

    useEffect(() => {
        if (error) {
            const lowerMsg = error.toLowerCase();
            const newErrors = { email: '', password: '', general: '' };
            if (lowerMsg.includes('email')) {
                newErrors.email = error;
            } else if (lowerMsg.includes('password')) {
                newErrors.password = error;
            } else {
                newErrors.general = error;
            }
            setFieldErrors(newErrors);
        } else {
            setFieldErrors({ email: '', password: '', general: '' });
        }
    }, [error]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        clearError();
    };

    const handleForgotPassword = () => {
        customAlert('Please contact your teacher or administrator to reset your password.', 'Forgot Password');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(formData.email, formData.password);

        if (result.success) {
            const user = useAuthStore.getState().user;
            if (user.role === 'student') {
                router.push('/student/dashboard');
            } else if (user.role === 'teacher') {
                router.push('/teacher/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center container-padding py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="bg-card dark:bg-gray-900 rounded-2xl shadow-premium p-6 md:p-8">
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                            AS ACADEMY
                        </h1>
                        <h2 className="text-xl md:text-2xl font-semibold text-foreground">Welcome Back</h2>
                        <p className="text-muted-foreground mt-2 text-sm md:text-base">Sign in to continue learning</p>
                    </div>

                    {fieldErrors.general && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                            {fieldErrors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                placeholder="you@example.com"
                            />
                            {fieldErrors.email && (
                                <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                placeholder="••••••••"
                            />
                            {fieldErrors.password && (
                                <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.password}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-3 md:py-4 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-medium touch-target"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-650 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
