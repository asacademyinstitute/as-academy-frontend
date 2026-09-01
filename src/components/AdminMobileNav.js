'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminMobileNav({ user, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/courses', label: 'Courses', icon: '📚' },
        { href: '/admin/payments', label: 'Payments', icon: '💳' },
        { href: '/admin/coupons', label: 'Coupons', icon: '🎫' },
        { href: '/admin/top-rankers', label: 'Top Rankers', icon: '🏆' },
        { href: '/admin/course-requests', label: 'Course Requests', icon: '📝' },
        { href: '/admin/security', label: 'Security', icon: '🔒' },
        { href: '/admin/seo', label: 'SEO Config', icon: '🔍' },
    ];

    const isActive = (href) => pathname === href;

    return (
        <>
            {/* Mobile Header */}
            <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Hamburger Menu Button - Mobile Only */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="w-6 h-6 text-gray-700 dark:text-gray-200"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMenuOpen ? (
                                    <path d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <Image
                                src="/icons/icon-192x192.png"
                                alt="AS Academy Logo"
                                width={32}
                                height={32}
                                className="rounded-lg object-contain"
                            />
                            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                                AS ACADEMY
                            </span>
                        </Link>

                        {/* Desktop: Theme Toggle + User Info */}
                        <div className="hidden md:flex items-center space-x-3">
                            <ThemeToggle />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Admin: {user?.name}</span>
                            <button
                                onClick={onLogout}
                                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile: Theme Toggle + Logout */}
                        <div className="md:hidden flex items-center gap-1">
                            <ThemeToggle />
                            <button
                                onClick={onLogout}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium px-2 py-2"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:block border-t border-gray-200 dark:border-gray-700">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8 overflow-x-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <div
                className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* Drawer */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Drawer Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Image
                                    src="/icons/icon-192x192.png"
                                    alt="AS Academy Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-lg border-2 border-white/30 object-contain bg-white"
                                />
                                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Close menu"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-white/90 text-sm">
                            <div className="font-medium">{user?.name}</div>
                            <div className="text-white/70 text-xs mt-0.5">{user?.email}</div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-base">{item.label}</span>
                                {isActive(item.href) && (
                                    <span className="ml-auto">
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </Link>
                        ))}

                        {/* Logout in drawer */}
                        <button
                            onClick={() => { setIsMenuOpen(false); onLogout(); }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                            <span className="text-xl">🚪</span>
                            <span className="text-base font-medium">Logout</span>
                        </button>
                    </nav>
                </div>
            </div>
        </>
    );
}
