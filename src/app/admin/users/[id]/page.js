'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { userAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { customConfirm } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

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
            showToast('Failed to load user data', 'error');
            router.push('/admin/users');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        const action = newStatus === 'blocked' ? 'Block' : 'Unblock';
        const confirmed = await customConfirm(`${action} "${user.name}"? ${newStatus === 'blocked' ? 'They will lose access to the platform.' : 'They will regain access.'}`, `${action} User`);
        if (!confirmed) return;
        try {
            await userAPI.updateStatus(user.id, newStatus);
            setUser({ ...user, status: newStatus });
            showToast(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`, 'success');
        } catch (error) {
            showToast('Failed to update user status', 'error');
        }
    };

    const handleResetDevice = async () => {
        const confirmed = await customConfirm('Reset device for this user? This will allow them to login on a new device.', 'Reset Device');
        if (!confirmed) return;
        try {
            await userAPI.resetDevice(user.id);
            showToast('Device reset successfully', 'success');
        } catch (error) {
            showToast('Failed to reset device', 'error');
        }
    };

    const handleBlockFromCourse = async (enrollmentId, courseTitle) => {
        const confirmed = await customConfirm(`Block student from "${courseTitle}"? This will cancel their enrollment but keep the record.`, 'Block from Course');
        if (!confirmed) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            showToast('Student blocked from course successfully', 'success');
            fetchUserData();
        } catch (error) {
            showToast('Failed to block student from course', 'error');
        }
    };

    const handleRemoveEnrollment = async (enrollmentId, courseTitle) => {
        const confirmed = await customConfirm(`Permanently remove enrollment from "${courseTitle}"? This action cannot be undone!`, 'Remove Enrollment');
        if (!confirmed) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            showToast('Enrollment removed successfully', 'success');
            fetchUserData();
        } catch (error) {
            showToast('Failed to remove enrollment', 'error');
        }
    };

    const handleUnblockFromCourse = async (enrollmentId, courseTitle) => {
        const confirmed = await customConfirm(`Unblock student from "${courseTitle}"? This will restore their access.`, 'Unblock from Course');
        if (!confirmed) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            showToast('Student unblocked from course successfully', 'success');
            fetchUserData();
        } catch (error) {
            showToast('Failed to unblock student from course', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">User not found</p>
                    <Link href="/admin/users" className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminMobileNav user={currentUser} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/admin/users" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                        ← Back to Users
                    </Link>
                </div>

                {/* User Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleStatusToggle}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${user.status === 'active'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {user.status === 'active' ? 'Block User' : 'Unblock User'}
                            </button>
                            {user.role === 'student' && (
                                <button
                                    onClick={handleResetDevice}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Reset Device
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User Details</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">{user.phone || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Role:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' :
                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' :
                                            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${user.status === 'active'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                        }`}>
                                        {user.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Joined:</span>
                                    <span className="ml-2 text-sm text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {user.role === 'student' && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Student Info</h3>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Enrollment No:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white font-medium">{user.enrollment_number || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">College:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{user.college_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Semester:</span>
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{user.semester || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enrollments (for students) */}
                {user.role === 'student' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Enrolled Courses</h3>
                        {enrollments.length > 0 ? (
                            <div className="space-y-4">
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{enrollment.courses.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    Enrolled: {formatDate(enrollment.enrolled_at)}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Valid until: {formatDate(enrollment.valid_until)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${enrollment.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                : enrollment.status === 'expired'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {enrollment.status}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            {enrollment.status === 'active' && (
                                                <button
                                                    onClick={() => handleBlockFromCourse(enrollment.id, enrollment.courses.title)}
                                                    className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                                                >
                                                    Block from Course
                                                </button>
                                            )}
                                            {enrollment.status === 'cancelled' && (
                                                <button
                                                    onClick={() => handleUnblockFromCourse(enrollment.id, enrollment.courses.title)}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Unblock from Course
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.courses.title)}
                                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Remove Enrollment
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No enrollments yet</p>
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
