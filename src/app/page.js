'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { ResponsiveNav } from '@/components/ui/navigation';


export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Redirect to appropriate dashboard
            if (user.role === 'student') {
                router.push('/student/dashboard');
            } else if (user.role === 'teacher') {
                router.push('/teacher/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            }
        }
    }, [isAuthenticated, user, router]);

    const navItems = [
        { label: 'Courses', href: '/courses' },
        { label: 'Login', href: '/login' },
    ];

    const navActions = (
        <>
            <ThemeToggle />
            <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all touch-target text-sm md:text-base"
            >
                Get Started
            </Link>
        </>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Navigation */}
            <ResponsiveNav
                brand={{ name: 'AS ACADEMY', href: '/' }}
                items={navItems}
                actions={navActions}
            />

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto container-padding section-spacing">
                <div className="text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6"
                    >
                        Learn Without Limits
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-4"
                    >
                        Access world-class courses, learn at your own pace, and achieve your goals with AS Academy
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4"
                    >
                        <Link
                            href="/courses"
                            className="bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-medium touch-target"
                        >
                            Explore Courses
                        </Link>
                        <Link
                            href="/signup"
                            className="bg-background dark:bg-gray-800 text-primary dark:text-blue-400 px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold border-2 border-primary dark:border-blue-400 hover:bg-accent transition-all touch-target"
                        >
                            Sign Up Free
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto container-padding section-spacing">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 dark:text-white">Why Choose AS Academy?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="bg-card dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all hover-lift"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Expert-Led Courses</h3>
                        <p className="text-gray-600 dark:text-gray-400">Learn from industry professionals with years of experience</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="bg-card dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all hover-lift"
                    >
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Certificates</h3>
                        <p className="text-gray-600 dark:text-gray-400">Earn recognized certificates upon course completion</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="bg-card dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all hover-lift"
                    >
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 dark:text-white">Learn at Your Pace</h3>
                        <p className="text-gray-600 dark:text-gray-400">Access courses anytime, anywhere, on any device</p>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="gradient-blue-purple py-12 md:py-16">
                <div className="max-w-4xl mx-auto text-center container-padding">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Ready to Start Learning?
                    </h2>
                    <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8">
                        Join thousands of students already learning on AS Academy
                    </p>
                    <Link
                        href="/signup"
                        className="inline-block bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-medium touch-target"
                    >
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 md:py-12 safe-bottom">
                <div className="max-w-7xl mx-auto container-padding">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 gradient-text">AS ACADEMY</h3>
                            <p className="text-gray-400">Empowering learners worldwide</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
                                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2026 AS Academy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
