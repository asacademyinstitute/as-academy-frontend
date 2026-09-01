'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { courseRequestAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { uploadThumbnail } from '@/lib/supabase';
import { customConfirm, customPrompt } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

const CATEGORIES = ['Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

function AdminCourseRequestsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [thumbnailMode, setThumbnailMode] = useState('upload'); // 'upload' | 'url'
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            const url = await uploadThumbnail(file);
            setEditData(prev => ({ ...prev, thumbnail_url: url }));
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (requestId) => {
        const confirmed = await customConfirm('Approve this course request? A new course will be created automatically.', 'Approve Request');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const response = await courseRequestAPI.approve(requestId);
            if (response.data.success) {
                showToast(`Course request approved! Course "${response.data.data.course.title}" has been created.`, 'success');
                fetchRequests();
            }
        } catch (error) {
            console.error('❌ [ADMIN] Error approving request:', error);
            showToast(error.response?.data?.message || 'Failed to approve request', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        const adminNotes = await customPrompt('Enter rejection reason (optional):', '', 'Reject Course Request');
        if (adminNotes === null) return; // Prompt cancelled

        setActionLoading(true);
        try {
            const response = await courseRequestAPI.reject(requestId, adminNotes);
            if (response.data.success) {
                showToast('Course request rejected', 'success');
                fetchRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast(error.response?.data?.message || 'Error rejecting request', 'error');
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
            thumbnail_url: request.thumbnail_url,
            category: request.category || '',
            semester: request.semester || '',
            level: request.level || 'beginner'
        });
        setShowEditModal(true);
    };

    const handleEdit = async () => {
        setActionLoading(true);
        try {
            const response = await courseRequestAPI.update(selectedRequest.id, editData);
            if (response.data.success) {
                showToast('Course request updated', 'success');
                setShowEditModal(false);
                fetchRequests();
            }
        } catch (error) {
            console.error('Error updating request:', error);
            showToast(error.response?.data?.message || 'Error updating request', 'error');
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Requests</div>
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingRequests.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved</div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{approvedRequests.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejected</div>
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">{rejectedRequests.length}</div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Requests</h2>
                    </div>

                    {error && (
                        <div className="px-6 py-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
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
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Course Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Validity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.users?.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{request.users?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.title}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{request.description}</div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {request.category && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                                                                {request.category}
                                                            </span>
                                                        )}
                                                        {request.semester && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400">
                                                                {request.semester}
                                                            </span>
                                                        )}
                                                        {request.level && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                                                                {request.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                    ₹{request.price}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                    {request.validity_days} days
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                        request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                                        }`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-655 text-gray-600 dark:text-gray-400">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(request)}
                                                                disabled={actionLoading}
                                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 cursor-pointer font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(request.id)}
                                                                disabled={actionLoading}
                                                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 cursor-pointer font-medium"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request.id)}
                                                                disabled={actionLoading}
                                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 cursor-pointer font-medium"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.status !== 'pending' && (
                                                        <span className="text-gray-450 text-gray-400 dark:text-gray-500">No actions</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                {requests.map((request) => (
                                    <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{request.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {request.category && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                                                            {request.category}
                                                        </span>
                                                    )}
                                                    {request.semester && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400">
                                                            {request.semester}
                                                        </span>
                                                    )}
                                                    {request.level && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                                                            {request.level}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ml-2 ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg p-3 mb-3">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Teacher</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{request.users?.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-450">{request.users?.email}</div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price</div>
                                                <div className="text-sm font-bold text-green-600 dark:text-green-400">₹{request.price}</div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Validity</div>
                                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{request.validity_days}d</div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg p-3 text-center">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date</div>
                                                <div className="text-xs font-medium text-gray-900 dark:text-gray-300">
                                                    {new Date(request.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        {request.status === 'pending' ? (
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    onClick={() => openEditModal(request)}
                                                    disabled={actionLoading}
                                                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    ✏️ Edit Request
                                                </button>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-2">No actions available</div>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Course Request</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={editData.price}
                                        onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validity (days)</label>
                                    <input
                                        type="number"
                                        value={editData.validity_days}
                                        onChange={(e) => setEditData({ ...editData, validity_days: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={editData.category}
                                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    >
                                        <option value="" className="dark:bg-gray-900">Select Category</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat} className="dark:bg-gray-900">{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                                    <select
                                        value={editData.semester}
                                        onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    >
                                        <option value="" className="dark:bg-gray-900">Select Semester</option>
                                        {SEMESTERS.map(sem => (
                                            <option key={sem} value={sem} className="dark:bg-gray-900">{sem}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                                    <select
                                        value={editData.level}
                                        onChange={(e) => setEditData({ ...editData, level: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    >
                                        <option value="beginner" className="dark:bg-gray-900">Beginner</option>
                                        <option value="intermediate" className="dark:bg-gray-900">Intermediate</option>
                                        <option value="advanced" className="dark:bg-gray-900">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Thumbnail</label>
                                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-900 p-0.5 rounded-lg text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('upload')}
                                            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${thumbnailMode === 'upload' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('url')}
                                            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${thumbnailMode === 'url' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                        >
                                            Image URL
                                        </button>
                                    </div>
                                </div>

                                {thumbnailMode === 'upload' ? (
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900 text-center relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                                {uploading ? (
                                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                {uploading ? 'Uploading image...' : 'Click or drag image to upload'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                PNG, JPG, JPEG up to 5MB (Recommended: 1280x720)
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="url"
                                            value={editData.thumbnail_url || ''}
                                            onChange={(e) => setEditData({ ...editData, thumbnail_url: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <span>📐</span>
                                            <span>Recommended: <strong>1280 × 720 px</strong> (16:9)</span>
                                        </p>
                                    </div>
                                )}

                                {editData.thumbnail_url && (
                                    <div className="mt-2 relative group border border-gray-250 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 p-2">
                                        <img
                                            src={editData.thumbnail_url}
                                            alt="Thumbnail preview"
                                            className="h-32 w-full object-contain bg-gray-100 dark:bg-gray-950 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setEditData(prev => ({ ...prev, thumbnail_url: '' }))}
                                            className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 duration-200 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer font-semibold"
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
