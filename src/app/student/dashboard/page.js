'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { enrollmentAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Award, User, ShoppingBag } from 'lucide-react';

function StudentDashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [enrollments, setEnrollments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [enrollmentsRes, statsRes] = await Promise.all([
                enrollmentAPI.getStudentEnrollments(user.id),
                userAPI.getStats(user.id),
            ]);
            setEnrollments(enrollmentsRes.data.data);
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
        { label: 'My Courses', href: '/student/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Certificates', href: '/student/certificates', icon: <Award className="w-5 h-5" /> },
        { label: 'Profile', href: '/student/profile', icon: <User className="w-5 h-5" /> },
        { label: 'Browse Courses', href: '/courses', icon: <ShoppingBag className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/student/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto container-padding py-6 md:py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Enrolled Courses</div>
                            <div className="text-2xl md:text-3xl font-bold text-primary">{stats.enrolledCourses}</div>
                        </div>
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Completed Lectures</div>
                            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-500">{stats.completedLectures}</div>
                        </div>
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Quiz Attempts</div>
                            <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-500">{stats.quizAttempts}</div>
                        </div>
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-4 md:p-6 border border-border">
                            <div className="text-xs md:text-sm text-muted-foreground mb-1">Certificates</div>
                            <div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-500">{stats.certificates}</div>
                        </div>
                    </div>
                )}

                {/* Live Classes Section */}
                {enrollments.some(e => e.courses.live_class_link) && (
                    <div className="mb-6 md:mb-8">
                        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">📹 Scheduled Live Classes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {enrollments
                                .filter(enrollment => enrollment.courses.live_class_link)
                                .map((enrollment) => (
                                    <div
                                        key={enrollment.id}
                                        className="gradient-blue-purple rounded-lg shadow-medium p-4 md:p-6 text-white"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold mb-2">
                                                    {enrollment.courses.title}
                                                </h3>
                                                {enrollment.courses.live_class_title && (
                                                    <p className="text-purple-100 mb-2">
                                                        {enrollment.courses.live_class_title}
                                                    </p>
                                                )}
                                                {enrollment.courses.live_class_scheduled_at && (
                                                    <div className="flex items-center text-sm text-purple-100 mb-4">
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        {new Date(enrollment.courses.live_class_scheduled_at).toLocaleString('en-IN', {
                                                            dateStyle: 'full',
                                                            timeStyle: 'short'
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                                                    <div className="text-2xl">🎓</div>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={enrollment.courses.live_class_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all shadow-md touch-target"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                            </svg>
                                            Join Live Class
                                        </a>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Courses */}
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">My Courses</h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : enrollments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {enrollments.map((enrollment) => (
                                <Link
                                    key={enrollment.id}
                                    href={`/student/courses/${enrollment.course_id}`}
                                    className="bg-card dark:bg-gray-900 rounded-lg shadow-soft hover:shadow-medium transition-all hover-lift border border-border"
                                >
                                    {/* Course Thumbnail */}
                                    <div className="h-40 rounded-t-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                                        {enrollment.courses.thumbnail_url != null && enrollment.courses.thumbnail_url !== '' ? (
                                            <img
                                                src={enrollment.courses.thumbnail_url}
                                                alt={enrollment.courses.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<span class="flex items-center justify-center h-full text-white text-5xl">📚</span>';
                                                }}
                                            />
                                        ) : (
                                            <span className="flex items-center justify-center h-full text-white text-5xl">📚</span>
                                        )}
                                    </div>
                                    <div className="p-4 md:p-6">
                                        <h3 className="font-semibold text-foreground mb-2 text-base md:text-lg">
                                            {enrollment.courses.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {enrollment.courses.description}
                                        </p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`px-2 py-1 rounded ${enrollment.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {enrollment.status}
                                            </span>
                                            <span className="text-muted-foreground text-xs md:text-sm">
                                                Valid until: {formatDate(enrollment.valid_until)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card dark:bg-gray-900 rounded-lg shadow-soft p-8 md:p-12 text-center border border-border">
                            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
                            <Link
                                href="/courses"
                                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-medium touch-target"
                            >
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function StudentDashboard() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardContent />
        </ProtectedRoute>
    );
}
