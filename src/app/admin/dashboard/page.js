'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';

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
            const [coursesRes, usersRes, studentsRes, teachersRes] = await Promise.all([
                coursesAPI.getAll(),
                userAPI.getAll(),
                userAPI.getAll({ role: 'student' }),
                userAPI.getAll({ role: 'teacher' })
            ]);

            const coursesData = coursesRes.data?.data;
            const usersData = usersRes.data?.data;
            const studentsData = studentsRes.data?.data;
            const teachersData = teachersRes.data?.data;

            // Support both pagination, { total: N } and array-based responses
            const totalCourses = coursesData?.pagination?.total
                ?? coursesData?.total
                ?? coursesData?.courses?.length
                ?? 0;

            const totalUsers = usersData?.pagination?.total
                ?? usersData?.total
                ?? usersData?.users?.length
                ?? 0;

            const activeStudents = studentsData?.pagination?.total
                ?? studentsData?.total
                ?? studentsData?.users?.length
                ?? 0;

            const teachers = teachersData?.pagination?.total
                ?? teachersData?.total
                ?? teachersData?.users?.length
                ?? 0;

            setCourses(coursesData?.courses || []);
            setStats({ totalCourses, totalUsers, activeStudents, teachers });
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Courses</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCourses}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Users</div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalUsers}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Students</div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeStudents}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teachers</div>
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.teachers}</div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link
                            href="/admin/users/create"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center transition-colors"
                        >
                            + Add User
                        </Link>
                        <Link
                            href="/admin/courses/create"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center transition-colors"
                        >
                            + Add Course
                        </Link>
                        <Link
                            href="/admin/enrollments/create"
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 text-center transition-colors"
                        >
                            + Enroll Student
                        </Link>
                    </div>
                </div>

                {/* Recent Courses */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Courses</h2>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {courses.slice(0, 5).map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">₹{course.price}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${course.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/admin/courses/${course.id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
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
