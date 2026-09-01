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
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [coursesRes, statsRes] = await Promise.all([
                coursesAPI.getByTeacher(user.id),
                userAPI.getStats(user.id),
            ]);
            setCourses(coursesRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter courses based on search term
    const filteredCourses = courses.filter(course => {
        const matchesSearch = !searchTerm ||
            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.category?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });


    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const navItems = [
        { label: 'My Courses', href: '/teacher/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Students', href: '/teacher/students', icon: <Users className="w-5 h-5" /> },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video className="w-5 h-5" /> },
        { label: 'Profile', href: '/teacher/profile', icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950 pb-24 md:pb-0">
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
                            <div className="text-2xl md:text-3xl font-bold text-primary">{stats.totalCourses || 0}</div>
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
                            className="bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-primary/90 transition-all shadow-medium touch-target text-sm md:text-base flex items-center justify-center"
                        >
                            Request New Course
                        </Link>
                    </div>

                    {/* Search Input */}
                    {courses.length > 0 && (
                        <div className="mb-6 max-w-md">
                            <input
                                type="text"
                                placeholder="Search courses by title, description, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredCourses.map((course) => (
                                <div key={course.id} className="border border-border rounded-lg overflow-hidden hover:shadow-medium transition-all hover-lift bg-card dark:bg-gray-900">
                                    <div className="relative w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                        {(course.thumbnail_url || course.thumbnail) ? (
                                            <img
                                                src={course.thumbnail_url || course.thumbnail}
                                                alt={course.title}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="text-white text-4xl">📚</span>
                                        )}
                                        <div className="absolute top-2 left-2 flex gap-1 z-10">
                                            {course.category && (
                                                <span className="bg-white/95 dark:bg-gray-900/95 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                    {course.category}
                                                </span>
                                            )}
                                            {course.semester && (
                                                <span className="bg-white/95 dark:bg-gray-900/95 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                    {course.semester}
                                                </span>
                                            )}
                                        </div>
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
                    ) : courses.length > 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-2">No courses found matching "{searchTerm}"</p>
                            <p className="text-xs text-muted-foreground/70">Try adjusting your search terms</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">No courses assigned yet</p>
                            <p className="text-sm text-muted-foreground/70">Request a course to get started</p>
                        </div>
                    )}
                </div>
            </div>


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
