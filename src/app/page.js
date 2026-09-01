'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { ResponsiveNav } from '@/components/ui/navigation';
import { topRankersAPI } from '@/lib/api';

// ── Medal colors for top 3 ranks ─────────────────────────────────────────────
const MEDAL = {
    1: { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-400', emoji: '🥇', textColor: 'text-yellow-500' },
    2: { bg: 'from-gray-300 to-gray-400',   border: 'border-gray-300',   emoji: '🥈', textColor: 'text-gray-400'   },
    3: { bg: 'from-orange-400 to-amber-600', border: 'border-orange-400', emoji: '🥉', textColor: 'text-orange-500' },
};

function RankerCard({ ranker, index }) {
    const medal = MEDAL[ranker.rank] || null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            viewport={{ once: true }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center p-5 text-center group"
        >
            {/* Rank badge */}
            {medal ? (
                <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br ${medal.bg} flex items-center justify-center text-base shadow`}>
                    {medal.emoji}
                </div>
            ) : (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                    #{ranker.rank}
                </div>
            )}

            {/* Photo */}
            <div className={`w-20 h-20 rounded-full overflow-hidden border-4 mb-3 shadow transition-transform duration-300 group-hover:scale-105 ${medal ? medal.border : 'border-indigo-200 dark:border-indigo-700'}`}>
                {ranker.photo_url ? (
                    <img
                        src={ranker.photo_url}
                        alt={ranker.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ranker.name)}&background=6366f1&color=fff&size=80`;
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {ranker.name?.charAt(0)?.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Name */}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 leading-tight line-clamp-2">{ranker.name}</h3>

            {/* Exam name */}
            {ranker.exam_name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium line-clamp-1">{ranker.exam_name}</p>
            )}

            {/* Percentage */}
            <div className="w-full mt-auto pt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Score</span>
                    <span className={`text-base font-extrabold ${medal ? medal.textColor : 'text-indigo-500 dark:text-indigo-400'}`}>
                        {ranker.percentage}%
                    </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${ranker.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.07 + 0.3, ease: 'easeOut' }}
                        viewport={{ once: true }}
                        className={`h-full rounded-full bg-gradient-to-r ${medal ? medal.bg : 'from-indigo-500 to-purple-500'}`}
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const [rankers, setRankers] = useState([]);
    const [showRankers, setShowRankers] = useState(false);
    
    // Device & layout states
    const [isMobile, setIsMobile] = useState(false);
    const [isCheckingDevice, setIsCheckingDevice] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // 1. Detect device / screen size on mount
    useEffect(() => {
        const checkDevice = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const forceApp = urlParams.get('app') === 'true';

            // Check if running as standalone installed PWA (iOS/Android/Chrome)
            const isStandalone = typeof window !== 'undefined' && (
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                (document.referrer && document.referrer.includes('android-app://'))
            );

            // Only trigger splash screen & auto-login redirect if running in app mode
            setIsMobile(forceApp || isStandalone);
            setIsCheckingDevice(false);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // 2. Fetch top rankers visibility + data
    useEffect(() => {
        const loadRankers = async () => {
            try {
                const [visRes, rankRes] = await Promise.all([
                    topRankersAPI.getVisibility(),
                    topRankersAPI.getActive(),
                ]);
                const isVisible = visRes.data?.data?.enabled;
                const data = rankRes.data?.data || [];
                if (isVisible && data.length > 0) {
                    setRankers(data);
                    setShowRankers(true);
                }
            } catch (err) {
                console.error('Top rankers load error:', err);
            }
        };
        loadRankers();
    }, []);

    // 3. For Mobile/App: wait 1.8 seconds, then trigger exit transition
    useEffect(() => {
        if (isMobile && !isCheckingDevice && !isLoading) {
            const timer = setTimeout(() => {
                setIsExiting(true);
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [isMobile, isCheckingDevice, isLoading]);

    // 4. Handle redirection logic
    const handleRedirect = () => {
        if (isAuthenticated && user) {
            if (user.role === 'student') router.replace('/student/dashboard');
            else if (user.role === 'teacher') router.replace('/teacher/dashboard');
            else if (user.role === 'admin') router.replace('/admin/dashboard');
        } else {
            router.replace('/courses');
        }
    };

    // 5. For Mobile/App: redirect after exit animation completes
    useEffect(() => {
        if (isMobile && isExiting) {
            const redirectTimer = setTimeout(() => {
                handleRedirect();
            }, 600);
            return () => clearTimeout(redirectTimer);
        }
    }, [isMobile, isExiting]);

    // 6. For Desktop/Website: redirect immediately if already authenticated
    useEffect(() => {
        if (!isMobile && !isCheckingDevice && !isLoading && isAuthenticated && user) {
            handleRedirect();
        }
    }, [isMobile, isCheckingDevice, isLoading, isAuthenticated, user]);

    // Render quiet black background loader during initial device check to avoid screen flashing / hydration mismatch
    if (isCheckingDevice) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    // A. Render Splash Screen for Mobile/App Mode
    if (isMobile) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden relative select-none">
                {/* Background glowing elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse duration-[6s]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse duration-[4s]"></div>
                </div>

                <AnimatePresence>
                    {!isExiting && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center justify-center z-10 text-center px-4"
                        >
                            {/* Glowing Logo Icon */}
                            <motion.div
                                initial={{ rotate: -10, scale: 0.9 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="relative mb-6"
                            >
                                {/* Rotating outer ring */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                                    className="absolute -inset-4 rounded-full border border-dashed border-indigo-400/30"
                                />
                                
                                {/* Main logo block */}
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/20 relative">
                                    <svg className="w-12 h-12 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </motion.div>

                            {/* Title and subtitle */}
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-3xl md:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200"
                            >
                                AS ACADEMY
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                                className="text-xs md:text-sm text-indigo-200 font-medium tracking-widest mt-2 uppercase"
                            >
                                Learn Without Limits
                            </motion.p>

                            {/* Custom premium loader bar */}
                            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-10 relative">
                                <motion.div
                                    initial={{ left: '-100%' }}
                                    animate={{ left: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                    className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-purple-400 rounded-full"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // B. Render Marketing Homepage for Desktop Mode
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200 animate-fadeIn">
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
                        className="text-lg md:text-xl text-gray-650 dark:text-gray-350 mb-6 md:mb-8 max-w-2xl mx-auto px-4"
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

            {/* ── Top Rankers Section ────────────────────────────────── */}
            {showRankers && (
                <section className="max-w-7xl mx-auto container-padding section-spacing">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mb-10 md:mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold mb-4">
                            🏆 Hall of Fame
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Our Top Rankers
                        </h2>
                        <p className="text-gray-650 dark:text-gray-400 max-w-xl mx-auto">
                            Celebrating our highest achievers who set the benchmark for excellence
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                        {rankers.map((ranker, i) => (
                            <RankerCard key={ranker.id} ranker={ranker} index={i} />
                        ))}
                    </div>
                </section>
            )}

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
                        <p className="text-gray-650 dark:text-gray-450">Learn from industry professionals with years of experience</p>
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
                        <p className="text-gray-650 dark:text-gray-450">Earn recognized certificates upon course completion</p>
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
                        <p className="text-gray-650 dark:text-gray-450">Access courses anytime, anywhere, on any device</p>
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
                            <h3 className="text-xl font-bold mb-2 gradient-text">AS ACADEMY</h3>
                            <p className="text-xs text-indigo-400 font-semibold mb-2">Founded by M Saad Shaikh</p>
                            <p className="text-gray-400 mb-4">Empowering learners worldwide</p>
                            <div className="flex items-center gap-4">
                                <a 
                                    href="https://www.youtube.com/@ASAcademyIndia" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="YouTube"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                </a>
                                <a 
                                    href="https://www.instagram.com/asacademy_india/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-gray-400 hover:text-pink-500 transition-colors"
                                    title="Instagram"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                    </svg>
                                </a>
                                <a 
                                    href="https://chat.whatsapp.com/CiTVkm74pvY2uHIRJceliw" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-gray-400 hover:text-green-500 transition-colors"
                                    title="WhatsApp Community"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.452 4.82 1.453 5.399 0 9.793-4.393 9.796-9.797.002-2.618-1.013-5.08-2.859-6.928C16.558 2.03 14.09 1.013 11.472 1.013 6.074 1.013 1.68 5.406 1.677 10.81c-.001 1.702.446 3.363 1.297 4.793L1.874 20.15l4.773-1.254c1.455.795 2.822 1.258 4.004 1.258zM17.16 14.62c-.282-.142-1.672-.825-1.93-.92-.258-.096-.446-.142-.634.142-.188.283-.728.92-.892 1.107-.164.188-.328.213-.61.072-1.122-.56-1.888-1.03-2.639-2.324-.19-.328.19-.304.542-1.01.06-.12.03-.226-.015-.32-.045-.094-.446-1.077-.611-1.475-.16-.388-.324-.336-.446-.342-.115-.005-.246-.006-.377-.006-.13 0-.342.049-.52.247-.178.198-.68.665-.68 1.621s.696 1.88 1.79 2.03c.11.015 2.11 3.224 5.11 4.522.714.31 1.272.496 1.706.634.717.228 1.37.196 1.886.118.575-.086 1.672-.684 1.906-1.346.234-.662.234-1.23.164-1.346-.07-.116-.258-.207-.54-.349z"/>
                                    </svg>
                                </a>
                            </div>
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
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2026 AS Academy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
