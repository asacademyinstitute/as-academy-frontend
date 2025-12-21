'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        clearError();
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

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground min-h-[44px]"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground min-h-[44px]"
                                placeholder="••••••••"
                            />
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
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
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
