'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function AdminDashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, usersRes] = await Promise.all([
                coursesAPI.getAll({}),
                userAPI.getAll({ limit: 10 }),
            ]);

            setCourses(coursesRes.data.data.courses || []);

            // Calculate basic stats
            setStats({
                totalCourses: coursesRes.data.data.total || 0,
                totalUsers: usersRes.data.data.total || 0,
                activeStudents: usersRes.data.data.users?.filter(u => u.role === 'student').length || 0,
                teachers: usersRes.data.data.users?.filter(u => u.role === 'teacher').length || 0,
            });
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

    return (
        <div className="min-h-screen bg-background">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">Total Courses</div>
                            <div className="text-3xl font-bold text-blue-600">{stats.totalCourses}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">Total Users</div>
                            <div className="text-3xl font-bold text-green-600">{stats.totalUsers}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">Active Students</div>
                            <div className="text-3xl font-bold text-purple-600">{stats.activeStudents}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">Teachers</div>
                            <div className="text-3xl font-bold text-yellow-600">{stats.teachers}</div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link
                            href="/admin/users/create"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center"
                        >
                            + Add User
                        </Link>
                        <Link
                            href="/admin/courses/create"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center"
                        >
                            + Add Course
                        </Link>
                        <Link
                            href="/admin/enrollments/create"
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 text-center"
                        >
                            + Enroll Student
                        </Link>
                    </div>
                </div>

                {/* Recent Courses */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Courses</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {courses.slice(0, 5).map((course) => (
                                        <tr key={course.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">₹{course.price}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${course.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/admin/courses/${course.id}`}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
