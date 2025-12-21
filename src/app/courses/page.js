'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { coursesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function CoursesPage() {
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

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'All' ||
            course.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            course.description?.toLowerCase().includes(selectedCategory.toLowerCase());

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-gray-700 hover:text-blue-600">
                                Login
                            </Link>
                            <Link href="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

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
                                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden">
                                        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white text-6xl">📚</span>
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
