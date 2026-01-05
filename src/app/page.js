'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { ResponsiveNav } from '@/components/ui/navigation';
import OrganizationSchema from '@/components/seo/OrganizationSchema';
import { topRankersAPI, streamingAPI } from '@/lib/api';



export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [topRankers, setTopRankers] = useState([]);
    const [rankerPhotos, setRankerPhotos] = useState({});
    const [loadingRankers, setLoadingRankers] = useState(true);
    const [showRankersSection, setShowRankersSection] = useState(false);

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

    // Fetch top rankers and visibility setting
    useEffect(() => {
        const fetchTopRankers = async () => {
            try {
                // Fetch visibility setting
                const visibilityResponse = await topRankersAPI.getVisibility();
                const isVisible = visibilityResponse.data.data.enabled;
                setShowRankersSection(isVisible);

                // Only fetch rankers if section is visible
                if (isVisible) {
                    const response = await topRankersAPI.getActive();
                    const rankers = response.data.data || [];
                    setTopRankers(rankers);

                    // Fetch photos for rankers
                    const photos = {};
                    for (const ranker of rankers) {
                        if (ranker.photo_url) {
                            try {
                                const urlResponse = await streamingAPI.getSignedUrl(ranker.photo_url);
                                photos[ranker.id] = urlResponse.data.url;
                            } catch (err) {
                                console.error(`Failed to get photo for ${ranker.name}:`, err);
                                photos[ranker.id] = '/default-avatar.png';
                            }
                        }
                    }
                    setRankerPhotos(photos);
                }
            } catch (error) {
                console.error('Error fetching top rankers:', error);
            } finally {
                setLoadingRankers(false);
            }
        };

        fetchTopRankers();
    }, []);

    const navItems = [
        { label: 'Courses', href: '/courses' },
        { label: 'Login', href: '/login' },
    ];

    const navActions = (
        <>

            <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all touch-target text-sm md:text-base"
            >
                Get Started
            </Link>
        </>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-50/30 to-pink-100/50 animate-gradient" />

            {/* Content */}
            <div className="relative z-10">
                {/* Navigation */}
                <ResponsiveNav
                    brand={{ name: 'AS ACADEMY', href: '/' }}
                    items={navItems}
                    actions={navActions}
                />

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto container-padding section-spacing pt-20 md:pt-28">
                    <div className="text-center relative">
                        {/* Floating decoration */}
                        <motion.div
                            className="absolute -top-20 -left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"
                            animate={{
                                y: [0, -20, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"
                            animate={{
                                y: [0, 20, 0],
                                scale: [1, 1.15, 1]
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold mb-4 md:mb-6 relative"
                        >
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                                Learn Without Limits
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 md:mb-10 max-w-3xl mx-auto px-4 font-body leading-relaxed"
                        >
                            Access world-class courses, learn at your own pace, and achieve your goals with{' '}
                            <span className="font-semibold text-blue-600">AS Academy</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href="/courses"
                                    className="btn-premium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold shadow-lg hover:shadow-2xl transition-all touch-target inline-flex items-center justify-center gap-2"
                                >
                                    Explore Courses
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href="/signup"
                                    className="bg-white text-blue-600 px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all touch-target shadow-md hover:shadow-lg"
                                >
                                    Sign Up Free
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="max-w-7xl mx-auto container-padding section-spacing">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-center mb-12 md:mb-16"
                    >
                        Why Choose{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS Academy?
                        </span>
                    </motion.h2>
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            initial: {},
                            animate: {
                                transition: {
                                    staggerChildren: 0.15
                                }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                    >
                        <motion.div
                            variants={{
                                initial: { opacity: 0, y: 40, scale: 0.9 },
                                animate: { opacity: 1, y: 0, scale: 1 }
                            }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white p-8 md:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all group cursor-pointer border border-gray-100"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
                            <p className="text-gray-600">Learn from industry professionals with years of experience</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="bg-card p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all hover-lift"
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Certificates</h3>
                            <p className="text-gray-600">Earn recognized certificates upon course completion</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="bg-card p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all hover-lift"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Learn at Your Pace</h3>
                            <p className="text-gray-600">Access courses anytime, anywhere, on any device</p>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Top Rankers Section */}
                {!loadingRankers && showRankersSection && topRankers.length > 0 && (
                    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🏆 Our Top Rankers
                            </h2>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Celebrating the outstanding achievements of our students
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {topRankers.map((ranker, index) => (
                                <motion.div
                                    key={ranker.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-2"
                                >
                                    {/* Rank Badge */}
                                    <div className="relative">
                                        <div className="absolute top-4 left-4 z-10">
                                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                                <span className="text-2xl">#{ranker.rank}</span>
                                            </div>
                                        </div>

                                        {/* Photo */}
                                        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={rankerPhotos[ranker.id] || '/default-avatar.png'}
                                                alt={ranker.name}
                                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => e.target.src = '/default-avatar.png'}
                                            />
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-6 text-center">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {ranker.name}
                                        </h3>

                                        {ranker.exam_name && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                {ranker.exam_name}
                                            </p>
                                        )}

                                        {/* Percentage Badge */}
                                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-lg">{ranker.percentage}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

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
                                    <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                                    <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Legal</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-8 pt-8">
                            {/* Social Media Icons */}
                            <div className="flex justify-center space-x-6 mb-6">
                                <a
                                    href="https://www.instagram.com/asacademy_india/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
                                    aria-label="Instagram"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.youtube.com/@ASAcademyIndia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
                                    aria-label="YouTube"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            </div>
                            <p className="text-center text-gray-400">&copy; 2026 AS Academy. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
