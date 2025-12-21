'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminMobileNav({ user, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/courses', label: 'Courses', icon: '📚' },
        { href: '/admin/enrollments', label: 'Enrollments', icon: '🎓' },
        { href: '/admin/payments', label: 'Payments', icon: '💳' },
        { href: '/admin/course-requests', label: 'Course Requests', icon: '📝' },
        { href: '/admin/security', label: 'Security', icon: '🔒' },
        { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
    ];

    const isActive = (href) => pathname === href;

    return (
        <>
            {/* Mobile Header */}
            <div className="bg-white shadow-sm sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Hamburger Menu Button - Mobile Only */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="w-6 h-6 text-gray-700"
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
                        <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY
                        </h1>

                        {/* User Info - Desktop */}
                        <div className="hidden md:flex items-center space-x-4">
                            <span className="text-sm text-gray-700">Admin: {user?.name}</span>
                            <button
                                onClick={onLogout}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Logout Button - Mobile */}
                        <button
                            onClick={onLogout}
                            className="md:hidden text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:block border-t">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8 overflow-x-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Drawer Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Close menu"
                            >
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-white/90 text-sm">
                            <div className="font-medium">{user?.name}</div>
                            <div className="text-white/70 text-xs mt-1">{user?.email}</div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-base">{item.label}</span>
                                {isActive(item.href) && (
                                    <span className="ml-auto">
                                        <svg
                                            className="w-5 h-5 text-blue-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
}
