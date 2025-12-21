'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';

function TeacherDashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [coursesRes, statsRes] = await Promise.all([
                coursesAPI.getAll({ teacherId: user.id }),
                userAPI.getStats(user.id),
            ]);
            setCourses(coursesRes.data.data.courses || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const navItems = [
        { label: 'My Courses', href: '/teacher/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Request Course', href: '/teacher/request-course', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Students', href: '/teacher/students', icon: <Users className="w-5 h-5" /> },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video className="w-5 h-5" /> },
        { label: 'Profile', href: '/teacher/profile', icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto container-padding py-6 md:py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">My Courses</div>
                            <div className="text-2xl md:text-3xl font-bold text-primary">{courses.length}</div>
                        </div>
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Students</div>
                            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-500">{stats.totalStudents || 0}</div>
                        </div>
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Content</div>
                            <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-500">{stats.totalLectures || 0}</div>
                        </div>
                    </div>
                )}

                {/* Courses */}
                <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">My Courses</h2>
                        <Link
                            href="/teacher/request-course"
                            className="bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-primary/90 transition-all shadow-medium touch-target text-sm md:text-base text-center"
                        >
                            Request New Course
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : courses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="border border-border rounded-lg overflow-hidden hover:shadow-medium transition-all hover-lift bg-card dark:bg-gray-900">
                                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white text-4xl">📚</span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-foreground mb-2 text-base md:text-lg">{course.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 text-xs rounded ${course.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {course.status}
                                            </span>
                                            <Link
                                                href={`/teacher/courses/${course.id}`}
                                                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                            >
                                                Manage →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">No courses assigned yet</p>
                            <p className="text-sm text-muted-foreground/70">Request a course to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 safe-bottom">
                    <div className="bg-card dark:bg-gray-900 rounded-lg shadow-premium max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request New Course</h2>
                            <form onSubmit={handleRequestSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Course Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={requestData.title}
                                        onChange={handleRequestChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Advanced Web Development"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={requestData.description}
                                        onChange={handleRequestChange}
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe what this course will cover..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={requestData.category}
                                            onChange={handleRequestChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Programming, Design"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Level *
                                        </label>
                                        <select
                                            name="level"
                                            value={requestData.level}
                                            onChange={handleRequestChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestModal(false)}
                                        disabled={submitting}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TeacherDashboard() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboardContent />
        </ProtectedRoute>
    );
}
