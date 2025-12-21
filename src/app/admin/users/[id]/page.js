'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';

function AdminUserDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, logout } = useAuthStore();
    const [user, setUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, [params.id]);

    const fetchUserData = async () => {
        try {
            const [userRes, enrollmentsRes] = await Promise.all([
                userAPI.getById(params.id),
                enrollmentAPI.getStudentEnrollments(params.id).catch(() => ({ data: { data: [] } }))
            ]);

            setUser(userRes.data.data);
            setEnrollments(enrollmentsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('Failed to load user data');
            router.push('/admin/users');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        try {
            await userAPI.updateStatus(user.id, newStatus);
            setUser({ ...user, status: newStatus });
            alert(`User ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`);
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    const handleResetDevice = async () => {
        if (!confirm('Reset device for this user? This will allow them to login on a new device.')) return;
        try {
            await userAPI.resetDevice(user.id);
            alert('Device reset successfully');
        } catch (error) {
            alert('Failed to reset device');
        }
    };

    const handleBlockFromCourse = async (enrollmentId, courseTitle) => {
        if (!confirm(`Block student from "${courseTitle}"? This will cancel their enrollment but keep the record.`)) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            alert('Student blocked from course successfully');
            fetchUserData(); // Refresh enrollments
        } catch (error) {
            alert('Failed to block student from course');
        }
    };

    const handleRemoveEnrollment = async (enrollmentId, courseTitle) => {
        if (!confirm(`Permanently remove enrollment from "${courseTitle}"? This action cannot be undone!`)) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            alert('Enrollment removed successfully');
            fetchUserData(); // Refresh enrollments
        } catch (error) {
            alert('Failed to remove enrollment');
        }
    };

    const handleUnblockFromCourse = async (enrollmentId, courseTitle) => {
        if (!confirm(`Unblock student from "${courseTitle}"? This will restore their access.`)) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            alert('Student unblocked from course successfully');
            fetchUserData(); // Refresh enrollments
        } catch (error) {
            alert('Failed to unblock student from course');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">User not found</p>
                    <Link href="/admin/users" className="text-blue-600 hover:text-blue-700">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY - Admin
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Admin: {currentUser?.name}</span>
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
                        <Link href="/admin/dashboard" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Dashboard
                        </Link>
                        <Link href="/admin/users" className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium">
                            Users
                        </Link>
                        <Link href="/admin/courses" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Courses
                        </Link>
                        <Link href="/admin/payments" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Payments
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/admin/users" className="text-blue-600 hover:text-blue-700">
                        ← Back to Users
                    </Link>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                            <p className="text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleStatusToggle}
                                className={`px-4 py-2 rounded-lg font-medium ${user.status === 'active'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {user.status === 'active' ? 'Block User' : 'Unblock User'}
                            </button>
                            {user.role === 'student' && (
                                <button
                                    onClick={handleResetDevice}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    Reset Device
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">User Details</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-600">Phone:</span>
                                    <span className="ml-2 text-sm text-gray-900">{user.phone || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Role:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Joined:</span>
                                    <span className="ml-2 text-sm text-gray-900">{formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {user.role === 'student' && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Student Info</h3>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-600">College:</span>
                                        <span className="ml-2 text-sm text-gray-900">{user.college_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Semester:</span>
                                        <span className="ml-2 text-sm text-gray-900">{user.semester || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enrollments (for students) */}
                {user.role === 'student' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Enrolled Courses</h3>
                        {enrollments.length > 0 ? (
                            <div className="space-y-4">
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{enrollment.courses.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Enrolled: {formatDate(enrollment.enrolled_at)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Valid until: {formatDate(enrollment.valid_until)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                                                enrollment.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {enrollment.status}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2 mt-3 pt-3 border-t">
                                            {enrollment.status === 'active' && (
                                                <button
                                                    onClick={() => handleBlockFromCourse(enrollment.id, enrollment.courses.title)}
                                                    className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                                >
                                                    Block from Course
                                                </button>
                                            )}
                                            {enrollment.status === 'cancelled' && (
                                                <button
                                                    onClick={() => handleUnblockFromCourse(enrollment.id, enrollment.courses.title)}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                >
                                                    Unblock from Course
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.courses.title)}
                                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Remove Enrollment
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No enrollments yet</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminUserDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserDetailContent />
        </ProtectedRoute>
    );
}
