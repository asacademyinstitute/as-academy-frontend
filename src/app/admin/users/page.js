'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { formatDate } from '@/lib/utils';
import { customConfirm, customPrompt } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

function AdminUsersContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', status: '', search: '' });

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            const response = await userAPI.getAll(filter);
            setUsers(response.data.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (userId, currentStatus, userName) => {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        const action = newStatus === 'blocked' ? 'Block' : 'Unblock';
        const confirmed = await customConfirm(
            `Are you sure you want to ${action.toLowerCase()} "${userName}"?`,
            action + ' User'
        );
        if (!confirmed) return;
        try {
            await userAPI.updateStatus(userId, newStatus);
            showToast(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`, 'success');
            fetchUsers();
        } catch (error) {
            showToast('Failed to update user status', 'error');
        }
    };

    const handleResetDevice = async (userId, userName) => {
        const confirmed = await customConfirm(
            `Reset device for "${userName}"? This will allow them to login on a new device.`,
            'Reset Device'
        );
        if (!confirmed) return;
        try {
            await userAPI.resetDevice(userId);
            showToast('Device reset successfully', 'success');
        } catch (error) {
            showToast('Failed to reset device', 'error');
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = await customPrompt('Enter new password for this user (min 6 characters):', 'Reset Password');
        if (!newPassword) return;
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters long', 'warning');
            return;
        }
        try {
            await userAPI.update(userId, { password: newPassword });
            showToast('Password reset successfully', 'success');
        } catch (error) {
            showToast('Failed to reset password: ' + (error.response?.data?.message || error.message), 'error');
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
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <select
                            value={filter.role}
                            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <Link
                            href="/admin/users/create"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-center transition-colors"
                        >
                            + Add User
                        </Link>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' :
                                                        u.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' :
                                                            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                                    }`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(u.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                <button
                                                    onClick={() => handleStatusToggle(u.id, u.status, u.name)}
                                                    className={`font-medium transition-colors ${u.status === 'active' ? 'text-red-600 dark:text-red-400 hover:text-red-700' : 'text-green-600 dark:text-green-400 hover:text-green-700'}`}
                                                >
                                                    {u.status === 'active' ? 'Block' : 'Unblock'}
                                                </button>
                                                {u.role === 'student' && (
                                                    <button
                                                        onClick={() => handleResetDevice(u.id, u.name)}
                                                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium transition-colors"
                                                    >
                                                        Reset Device
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleResetPassword(u.id)}
                                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium transition-colors"
                                                >
                                                    Reset Password
                                                </button>
                                                <Link
                                                    href={`/admin/users/${u.id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    View
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

export default function AdminUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}
