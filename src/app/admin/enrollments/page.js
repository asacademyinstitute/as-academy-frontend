'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { enrollmentAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';

function AdminEnrollmentsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const response = await enrollmentAPI.getAll();
            setEnrollments(response.data.data || []);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleExtend = async (enrollmentId) => {
        const days = prompt('Enter number of days to extend:');
        if (!days || isNaN(days) || parseInt(days) < 1) {
            alert('Please enter a valid number of days');
            return;
        }

        try {
            await enrollmentAPI.extend(enrollmentId, parseInt(days));
            alert('Enrollment extended successfully!');
            fetchEnrollments();
        } catch (error) {
            console.error('Error extending enrollment:', error);
            alert('Failed to extend enrollment');
        }
    };

    const handleCancel = async (enrollmentId) => {
        if (!confirm('Are you sure you want to cancel this enrollment?')) return;

        try {
            await enrollmentAPI.cancel(enrollmentId);
            alert('Enrollment cancelled successfully!');
            fetchEnrollments();
        } catch (error) {
            console.error('Error cancelling enrollment:', error);
            alert('Failed to cancel enrollment');
        }
    };

    const handleDelete = async (enrollmentId) => {
        if (!confirm('Are you sure you want to permanently delete this enrollment? This action cannot be undone.')) return;

        try {
            await enrollmentAPI.delete(enrollmentId);
            alert('Enrollment deleted successfully!');
            fetchEnrollments();
        } catch (error) {
            console.error('Error deleting enrollment:', error);
            alert('Failed to delete enrollment');
        }
    };

    const filteredEnrollments = enrollments.filter(enrollment => {
        const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
        const matchesSearch =
            enrollment.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Enrollments</h1>
                    <Link
                        href="/admin/enrollments/create"
                        className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-medium"
                    >
                        + Enroll Student
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search by student name, email, or course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Enrollments Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                            All Enrollments ({filteredEnrollments.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredEnrollments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredEnrollments.map((enrollment) => (
                                        <tr key={enrollment.id} className="hover:bg-gray-50">
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{enrollment.users?.name}</div>
                                                <div className="text-sm text-gray-500">{enrollment.users?.email}</div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">{enrollment.courses?.title}</div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(enrollment.enrolled_at)}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(enrollment.valid_until)}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${enrollment.payment_type === 'online'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {enrollment.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${enrollment.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : enrollment.status === 'expired'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {enrollment.status}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    {enrollment.status === 'active' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleExtend(enrollment.id)}
                                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                Extend
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel(enrollment.id)}
                                                                className="text-yellow-600 hover:text-yellow-700 font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(enrollment.id)}
                                                        className="text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No enrollments found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminEnrollmentsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminEnrollmentsContent />
        </ProtectedRoute>
    );
}
