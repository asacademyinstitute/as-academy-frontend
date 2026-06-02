'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';

function TeacherLiveClassesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);
    const [liveClassLink, setLiveClassLink] = useState('');

    useEffect(() => {
        if (user) {
            fetchCourses();
        }
    }, [user]);

    const fetchCourses = async () => {
        try {
            const response = await coursesAPI.getAll({ teacherId: user.id });
            setCourses(response.data.data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLink = async (courseId) => {
        try {
            await coursesAPI.update(courseId, { live_class_link: liveClassLink });
            alert('Live class link updated successfully!');
            setEditingCourse(null);
            setLiveClassLink('');
            fetchCourses();
        } catch (error) {
            alert('Failed to update live class link');
        }
    };

    const startEditing = (course) => {
        setEditingCourse(course.id);
        setLiveClassLink(course.live_class_link || '');
    };

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Class Management</h2>
                    <p className="text-gray-600">Manage live class links for your courses</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : courses.length > 0 ? (
                    <div className="space-y-4">
                        {courses.map((course) => (
                            <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                                    </div>
                                    {editingCourse !== course.id && (
                                        <button
                                            onClick={() => startEditing(course)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            {course.live_class_link ? 'Update Link' : 'Add Link'}
                                        </button>
                                    )}
                                </div>

                                {editingCourse === course.id ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Live Class Link (Zoom, Google Meet, etc.)
                                            </label>
                                            <input
                                                type="url"
                                                value={liveClassLink}
                                                onChange={(e) => setLiveClassLink(e.target.value)}
                                                placeholder="https://zoom.us/j/123456789"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleUpdateLink(course.id)}
                                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                            >
                                                Save Link
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCourse(null);
                                                    setLiveClassLink('');
                                                }}
                                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {course.live_class_link ? (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-blue-800 font-medium mb-1">Current Live Class Link:</div>
                                                        <a
                                                            href={course.live_class_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-700 underline break-all"
                                                        >
                                                            {course.live_class_link}
                                                        </a>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(course.live_class_link);
                                                            alert('Link copied to clipboard!');
                                                        }}
                                                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                                                    >
                                                        Copy Link
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                                <p className="text-gray-500">No live class link set for this course</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500">No courses assigned yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TeacherLiveClassesPage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLiveClassesContent />
        </ProtectedRoute>
    );
}
