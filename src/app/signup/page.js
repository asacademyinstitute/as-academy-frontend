'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';

export default function SignupPage() {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        enrollment_number: '',
        college_name: '',
        semester: '',
        password: '',
        confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        email: '',
        phone: '',
        enrollment_number: '',
        password: '',
        confirmPassword: '',
        general: ''
    });

    useEffect(() => {
        if (error) {
            const lowerMsg = error.toLowerCase();
            const newErrors = { name: '', email: '', phone: '', enrollment_number: '', password: '', confirmPassword: '', general: '' };
            if (lowerMsg.includes('email')) {
                newErrors.email = error;
            } else if (lowerMsg.includes('phone')) {
                newErrors.phone = error;
            } else if (lowerMsg.includes('enrollment')) {
                newErrors.enrollment_number = error;
            } else if (lowerMsg.includes('name')) {
                newErrors.name = error;
            } else if (lowerMsg.includes('password') && !lowerMsg.includes('confirm')) {
                newErrors.password = error;
            } else if (lowerMsg.includes('confirm')) {
                newErrors.confirmPassword = error;
            } else {
                newErrors.general = error;
            }
            setFieldErrors(newErrors);
        } else {
            setFieldErrors({ name: '', email: '', phone: '', enrollment_number: '', password: '', confirmPassword: '', general: '' });
        }
    }, [error]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setFieldErrors(prev => ({
            ...prev,
            [name]: '',
            confirmPassword: name === 'password' || name === 'confirmPassword' ? '' : prev.confirmPassword,
            general: ''
        }));
        clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        const { confirmPassword, ...userData } = formData;
        const result = await register(userData);

        if (result.success) {
            router.push('/student/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center container-padding py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
            >
                <div className="bg-card dark:bg-gray-900 rounded-2xl shadow-premium p-6 md:p-8">
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                            AS ACADEMY
                        </h1>
                        <h2 className="text-xl md:text-2xl font-semibold text-foreground">Create Account</h2>
                        <p className="text-muted-foreground mt-2 text-sm md:text-base">Start your learning journey today</p>
                    </div>

                    {fieldErrors.general && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                            {fieldErrors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                    placeholder="John Doe"
                                />
                                {fieldErrors.name && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address *
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
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    pattern="[0-9]{10}"
                                    className={`w-full px-4 py-3 border ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                    placeholder="9876543210"
                                />
                                {fieldErrors.phone && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="enrollment_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Enrollment Number *
                                </label>
                                <input
                                    type="text"
                                    id="enrollment_number"
                                    name="enrollment_number"
                                    value={formData.enrollment_number}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border ${fieldErrors.enrollment_number ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                    placeholder="e.g. 2101234567"
                                />
                                {fieldErrors.enrollment_number && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.enrollment_number}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="college_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    College Name
                                </label>
                                <input
                                    type="text"
                                    id="college_name"
                                    name="college_name"
                                    value={formData.college_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground min-h-[44px]"
                                    placeholder="Your College"
                                />
                            </div>

                            <div>
                                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Semester
                                </label>
                                <input
                                    type="text"
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground min-h-[44px]"
                                    placeholder="e.g., 5th Semester"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                    placeholder="••••••••"
                                />
                                {fieldErrors.password ? (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.password}</p>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min 8 characters, include uppercase, lowercase, number & special char</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-transparent' : 'border-input focus:ring-ring focus:border-transparent'} rounded-lg focus:ring-2 transition-all bg-background text-foreground min-h-[44px]`}
                                    placeholder="••••••••"
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-3 md:py-4 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-medium touch-target"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-650 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                                Sign in
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
