'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auditAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';

function AuditLogsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: '', userId: '' });

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            const response = await auditAPI.getLogs(filter);
            setLogs(response.data.data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const getActionColor = (action) => {
        if (action.includes('create')) return 'bg-green-100 text-green-800';
        if (action.includes('update')) return 'bg-blue-100 text-blue-800';
        if (action.includes('delete')) return 'bg-red-100 text-red-800';
        if (action.includes('login')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

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
                            <span className="text-gray-700">Admin: {user?.name}</span>
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
                        <Link href="/admin/users" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Users
                        </Link>
                        <Link href="/admin/courses" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Courses
                        </Link>
                        <Link href="/admin/payments" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Payments
                        </Link>
                        <Link href="/admin/audit" className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium">
                            Audit Logs
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <select
                            value={filter.action}
                            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Actions</option>
                            <option value="user_login">User Login</option>
                            <option value="user_logout">User Logout</option>
                            <option value="course_create">Course Create</option>
                            <option value="course_update">Course Update</option>
                            <option value="payment_create">Payment Create</option>
                            <option value="enrollment_create">Enrollment Create</option>
                        </select>
                        <input
                            type="text"
                            placeholder="User ID..."
                            value={filter.userId}
                            onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setFilter({ action: '', userId: '' })}
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-900">System Audit Logs</h2>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{log.users?.name || 'System'}</div>
                                                <div className="text-sm text-gray-500">{log.users?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.resource_type}
                                                {log.resource_id && <div className="text-xs text-gray-500">ID: {log.resource_id}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {log.ip_address || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {log.details ? JSON.stringify(log.details) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No audit logs found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuditLogsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogsContent />
        </ProtectedRoute>
    );
}
