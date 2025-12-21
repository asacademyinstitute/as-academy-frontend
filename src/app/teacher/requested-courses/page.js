'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeacherMobileNav from '@/components/TeacherMobileNav';
import { courseRequestAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function TeacherRequestedCoursesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await courseRequestAPI.getMy();
            setRequests(res.data.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <TeacherMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">My Requested Courses</h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : requests.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested On</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{request.title}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-2">{request.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {request.level}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {request.admin_notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {requests.map((request) => (
                                    <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-base font-semibold text-gray-900 flex-1">{request.title}</h3>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ml-2 ${getStatusBadge(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{request.description}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">Category:</span>
                                                <span className="ml-1 font-medium text-gray-900">{request.category}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Level:</span>
                                                <span className="ml-1 font-medium text-gray-900">{request.level}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500 mb-2">
                                            Requested: {new Date(request.created_at).toLocaleDateString()}
                                        </div>

                                        {request.admin_notes && (
                                            <div className="bg-gray-50 rounded p-2 mt-2">
                                                <div className="text-xs text-gray-500 mb-1">Admin Notes:</div>
                                                <div className="text-sm text-gray-700">{request.admin_notes}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-4">No course requests yet</p>
                            <p className="text-sm text-gray-500">Request a course from the dashboard to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TeacherRequestedCoursesPage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherRequestedCoursesContent />
        </ProtectedRoute>
    );
}
