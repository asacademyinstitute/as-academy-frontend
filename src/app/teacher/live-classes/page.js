'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

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

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY - Teacher
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <Link href="/teacher/dashboard" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            My Courses
                        </Link>
                        <Link href="/teacher/students" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Students
                        </Link>
                        <Link href="/teacher/live-classes" className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium">
                            Live Classes
                        </Link>
                        <Link href="/teacher/profile" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Profile
                        </Link>
                    </nav>
                </div>
            </div>

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
