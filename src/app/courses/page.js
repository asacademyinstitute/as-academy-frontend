'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { coursesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

const CATEGORIES = ['All', 'Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

// Map short semester name to full stored value and vice versa
const SEM_MAP = {
    'Sem 1': 'Semester 1', 'Sem 2': 'Semester 2', 'Sem 3': 'Semester 3', 'Sem 4': 'Semester 4',
    'Sem 5': 'Semester 5', 'Sem 6': 'Semester 6', 'Sem 7': 'Semester 7', 'Sem 8': 'Semester 8',
};

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSemester, setSelectedSemester] = useState('All');
    const { isAuthenticated, user } = useAuthStore();

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin/dashboard';
        if (user.role === 'teacher') return '/teacher/dashboard';
        return '/student/dashboard';
    };

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const response = await coursesAPI.getAll({ status: 'active' });
            setCourses(response.data?.data?.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title?.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            selectedCategory === 'All' ||
            (course.category || '').toLowerCase() === selectedCategory.toLowerCase();

        const fullSem = SEM_MAP[selectedSemester] || selectedSemester;
        const matchesSemester =
            selectedSemester === 'All' ||
            (course.semester || '').toLowerCase() === fullSem.toLowerCase();

        return matchesSearch && matchesCategory && matchesSemester;
    });

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('All');
        setSelectedSemester('All');
    };

    const hasActiveFilters = search || selectedCategory !== 'All' || selectedSemester !== 'All';

    return (
        <div className="min-h-screen" style={{ background: '#f1f5f9' }}>

            {/* ── Top Nav ── */}
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        AS ACADEMY
                    </Link>
                    <div className="flex items-center gap-3">
                        {isAuthenticated && user ? (
                            <>
                                <Link href={getDashboardPath()}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                                    Dashboard
                                </Link>
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Login</Link>
                                <Link href="/signup" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Hero Search ── */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 py-10 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Explore Courses</h1>
                    <p className="text-blue-100 text-sm mb-6">Find the perfect course for your academic journey</p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                        <input
                            type="text"
                            placeholder="Search courses by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white pl-11 pr-10 py-3 rounded-xl text-gray-800 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none">
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white border-b shadow-sm sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">

                    {/* Category row */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap mr-1">Category:</span>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedCategory === cat
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                }`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Semester row */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap mr-1">Semester:</span>
                        {SEMESTERS.map(sem => (
                            <button key={sem} onClick={() => setSelectedSemester(sem)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedSemester === sem
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                }`}>
                                {sem}
                            </button>
                        ))}
                    </div>

                    {/* Result count + clear */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-sm pt-0.5">
                            <span className="text-gray-500 font-medium">{filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''} found</span>
                            <span className="text-gray-300">·</span>
                            <button onClick={resetFilters} className="text-red-500 hover:text-red-600 font-medium hover:underline">
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Course Grid ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-7xl mb-4">😕</div>
                        <p className="text-gray-700 text-xl font-semibold mb-1">No courses found</p>
                        <p className="text-gray-400 text-sm mb-6">Try a different search term or filter</p>
                        <button onClick={resetFilters}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition">
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {!hasActiveFilters && (
                            <p className="text-sm text-gray-500 mb-5">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredCourses.map((course, index) => (
                                    <motion.div key={course.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04 }}>
                                        <Link href={`/courses/${course.id}`}>
                                            <div className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
                                                {/* Thumbnail */}
                                                <div className="relative h-44 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                                    {(course.thumbnail_url || course.thumbnail) ? (
                                                        <img src={course.thumbnail_url || course.thumbnail}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        <span className="text-6xl">📚</span>
                                                    )}
                                                    {/* Badges */}
                                                    <div className="absolute top-3 left-3 flex gap-1.5">
                                                        {course.category && (
                                                            <span className="bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                                {course.category}
                                                            </span>
                                                        )}
                                                        {course.semester && (
                                                            <span className="bg-white/90 backdrop-blur text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                                {course.semester}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-5">
                                                    <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl font-extrabold text-blue-600">
                                                            {formatCurrency(course.price)}
                                                        </span>
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                                            {course.validity_days || course.duration} days
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
