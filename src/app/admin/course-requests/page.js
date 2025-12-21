'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { courseRequestAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function AdminCourseRequestsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔍 [ADMIN] Fetching course requests...');
            const response = await courseRequestAPI.getAll();
            console.log('📬 [ADMIN] Course requests response:', response.data);
            setRequests(response.data.data || []);
            console.log('✅ [ADMIN] Total requests loaded:', response.data.data?.length || 0);
        } catch (error) {
            console.error('❌ [ADMIN] Error fetching requests:', error);
            setError(error.response?.data?.message || 'Failed to load course requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!confirm('Approve this course request? A new course will be created automatically.')) return;

        setActionLoading(true);
        try {
            const response = await courseRequestAPI.approve(requestId);
            if (response.data.success) {
                alert(`Course request approved! Course "${response.data.data.course.title}" has been created.`);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert(error.response?.data?.message || 'Error approving request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        const adminNotes = prompt('Enter rejection reason (optional):');

        setActionLoading(true);
        try {
            const response = await courseRequestAPI.reject(requestId, adminNotes);
            if (response.data.success) {
                alert('Course request rejected');
                fetchRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(error.response?.data?.message || 'Error rejecting request');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (request) => {
        setSelectedRequest(request);
        setEditData({
            title: request.title,
            description: request.description,
            price: request.price,
            validity_days: request.validity_days,
            thumbnail_url: request.thumbnail_url
        });
        setShowEditModal(true);
    };

    const handleEdit = async () => {
        setActionLoading(true);
        try {
            const response = await courseRequestAPI.update(selectedRequest.id, editData);
            if (response.data.success) {
                alert('Course request updated');
                setShowEditModal(false);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert(error.response?.data?.message || 'Error updating request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-1">Pending Requests</div>
                        <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-1">Approved</div>
                        <div className="text-3xl font-bold text-green-600">{approvedRequests.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 mb-1">Rejected</div>
                        <div className="text-3xl font-bold text-red-600">{rejectedRequests.length}</div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Requests</h2>
                    </div>

                    {error && (
                        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.users?.name}</div>
                                                    <div className="text-sm text-gray-500">{request.users?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{request.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    ₹{request.price}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {request.validity_days} days
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(request)}
                                                                disabled={actionLoading}
                                                                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(request.id)}
                                                                disabled={actionLoading}
                                                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request.id)}
                                                                disabled={actionLoading}
                                                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.status !== 'pending' && (
                                                        <span className="text-gray-400">No actions</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {requests.map((request) => (
                                    <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ml-2 ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <div className="text-xs text-gray-600 mb-1">Teacher</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{request.users?.name}</div>
                                            <div className="text-xs text-gray-500">{request.users?.email}</div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 mb-1">Price</div>
                                                <div className="text-sm font-bold text-green-600">₹{request.price}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 mb-1">Validity</div>
                                                <div className="text-sm font-bold text-blue-600">{request.validity_days}d</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 mb-1">Date</div>
                                                <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                    {new Date(request.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        {request.status === 'pending' ? (
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    onClick={() => openEditModal(request)}
                                                    disabled={actionLoading}
                                                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    ✏️ Edit Request
                                                </button>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-sm text-gray-400 py-2">No actions available</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Edit Course Request</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={editData.price}
                                        onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days)</label>
                                    <input
                                        type="number"
                                        value={editData.validity_days}
                                        onChange={(e) => setEditData({ ...editData, validity_days: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                                <input
                                    type="url"
                                    value={editData.thumbnail_url}
                                    onChange={(e) => setEditData({ ...editData, thumbnail_url: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                {editData.thumbnail_url && (
                                    <img src={editData.thumbnail_url} alt="Preview" className="mt-2 h-32 object-cover rounded" />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminCourseRequestsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminCourseRequestsContent />
        </ProtectedRoute>
    );
}
