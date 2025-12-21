import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeacherMobileNav({ user, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { href: '/teacher/dashboard', label: 'My Courses' },
        { href: '/teacher/request-course', label: 'Request Course' },
        { href: '/teacher/students', label: 'Students' },
        { href: '/teacher/live-classes', label: 'Live Classes' },
        { href: '/teacher/profile', label: 'Profile' },
    ];

    const isActive = (href) => pathname === href;

    return (
        <>
            {/* Mobile Header */}
            <div className="bg-white shadow-sm md:hidden">
                <div className="px-4 py-3 flex justify-between items-center">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        AS ACADEMY
                    </h1>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                            {isOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-gray-900">Teacher Panel</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>

                        <nav className="p-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 rounded-lg mb-2 transition-colors ${isActive(link.href)
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onLogout();
                                }}
                                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Header & Navigation */}
            <div className="hidden md:block">
                <div className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AS ACADEMY - Teacher
                            </h1>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700">Welcome, {user?.name}</span>
                                <button
                                    onClick={onLogout}
                                    className="text-red-600 hover:text-red-700 font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`border-b-2 py-4 px-1 transition-colors ${isActive(link.href)
                                        ? 'border-blue-600 text-blue-600 font-medium'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
}
