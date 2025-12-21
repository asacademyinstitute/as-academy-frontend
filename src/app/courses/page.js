'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { coursesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Award, User, ShoppingBag } from 'lucide-react';

export default function CoursesPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Diploma', 'Degree', 'BCA', 'MCA', 'B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'];

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await coursesAPI.getAll({ status: 'active' });
            setCourses(response.data.data.courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'All' ||
            course.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            course.description?.toLowerCase().includes(selectedCategory.toLowerCase());

        return matchesSearch && matchesCategory;
    });

    const navItems = [
        { label: 'My Courses', href: '/student/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Certificates', href: '/student/certificates', icon: <Award className="w-5 h-5" /> },
        { label: 'Profile', href: '/student/profile', icon: <User className="w-5 h-5" /> },
        { label: 'Browse Courses', href: '/courses', icon: <ShoppingBag className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Conditional Header - Show DashboardNav for logged-in users, Login/Signup for guests */}
            {user ? (
                <DashboardNav
                    brand={{ name: 'AS ACADEMY', href: user.role === 'student' ? '/student/dashboard' : '/' }}
                    user={{ name: user?.name || '', email: user?.email }}
                    navItems={navItems}
                    onLogout={handleLogout}
                    actions={<ThemeToggle />}
                />
            ) : (
                <div className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                        <div className="flex justify-between items-center">
                            <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AS ACADEMY
                            </Link>
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <Link href="/login" className="text-sm md:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                                    Login
                                </Link>
                                <Link href="/signup" className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base font-medium transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Courses</h1>

                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
                    />

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-3">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/courses/${course.id}`}>
                                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden">
                                        {/* Course Thumbnail */}
                                        <div className="h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                            {course.thumbnail_url != null && course.thumbnail_url !== '' ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<span class="flex items-center justify-center h-full text-white text-6xl">📚</span>';
                                                    }}
                                                />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-white text-6xl">📚</span>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {formatCurrency(course.price)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {course.validity_days} days access
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No courses found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
