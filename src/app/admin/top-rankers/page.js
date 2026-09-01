'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMobileNav from '@/components/AdminMobileNav';
import { topRankersAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { showToast } from '@/components/ui/toast';
import { customConfirm } from '@/components/ui/custom-modal';

export default function TopRankersPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [rankers, setRankers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRanker, setEditingRanker] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState({}); // Store signed URLs for photos
    const [showOnHomepage, setShowOnHomepage] = useState(false);
    const [togglingVisibility, setTogglingVisibility] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        photo_url: '',
        percentage: '',
        rank: '',
        exam_name: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    useEffect(() => {
        fetchRankers();
        fetchVisibilitySetting();
    }, []);

    const fetchRankers = async () => {
        try {
            const response = await topRankersAPI.getAll();
            const rankersData = response.data.data || [];
            setRankers(rankersData);

            // Fetch signed URLs for all photos
            const urls = {};
            for (const ranker of rankersData) {
                if (ranker.photo_url) {
                    try {
                        // Use streaming API to get signed URL
                        const urlResponse = await streamingAPI.getSignedUrl(ranker.photo_url);
                        urls[ranker.id] = urlResponse.data.url;
                    } catch (err) {
                        console.error(`Failed to get signed URL for ${ranker.photo_url}:`, err);
                        urls[ranker.id] = '/default-avatar.png';
                    }
                }
            }
            setPhotoUrls(urls);
        } catch (error) {
            console.error('Error fetching rankers:', error);
            showToast('Failed to fetch top rankers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchVisibilitySetting = async () => {
        try {
            const response = await topRankersAPI.getVisibility();
            setShowOnHomepage(response.data.data.enabled);
        } catch (error) {
            console.error('Error fetching visibility setting:', error);
        }
    };

    const handleToggleVisibility = async () => {
        setTogglingVisibility(true);
        try {
            const newValue = !showOnHomepage;
            await topRankersAPI.setVisibility(newValue);
            setShowOnHomepage(newValue);
            showToast(`Top Rankers section will now be ${newValue ? 'shown' : 'hidden'} on homepage`, 'success');
        } catch (error) {
            console.error('Error toggling visibility:', error);
            showToast('Failed to update visibility setting', 'error');
        } finally {
            setTogglingVisibility(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'warning');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'warning');
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const uploadPhoto = async () => {
        if (!photoFile) return formData.photo_url;

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', photoFile);
            uploadFormData.append('folder', 'top-rankers');

            const response = await streamingAPI.uploadFile(uploadFormData);
            console.log('Upload response:', response.data);

            // Backend returns: { success: true, data: { fileUrl, fileName, ... } }
            const fileUrl = response.data.data?.fileUrl || response.data.fileUrl;

            if (!fileUrl) {
                throw new Error('No file URL returned from upload');
            }

            return fileUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw new Error('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast('Please enter student name', 'warning');
            return;
        }

        if (!photoFile && !editingRanker) {
            showToast('Please select a photo', 'warning');
            return;
        }

        const percentage = parseFloat(formData.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            showToast('Percentage must be between 0 and 100', 'warning');
            return;
        }

        const rank = parseInt(formData.rank);
        if (isNaN(rank) || rank < 1) {
            showToast('Rank must be a positive number', 'warning');
            return;
        }

        try {
            // Upload photo if new file selected
            let photo_url = formData.photo_url;
            if (photoFile) {
                photo_url = await uploadPhoto();
            }

            const data = {
                name: formData.name.trim(),
                photo_url,
                percentage,
                rank,
                exam_name: formData.exam_name.trim() || null
            };

            if (editingRanker) {
                await topRankersAPI.update(editingRanker.id, data);
                showToast('Top ranker updated successfully!', 'success');
            } else {
                await topRankersAPI.create(data);
                showToast('Top ranker added successfully!', 'success');
            }

            resetForm();
            fetchRankers();
        } catch (error) {
            console.error('Error saving ranker:', error);
            showToast(error.response?.data?.message || 'Failed to save top ranker', 'error');
        }
    };

    const handleEdit = (ranker) => {
        setEditingRanker(ranker);
        setFormData({
            name: ranker.name,
            photo_url: ranker.photo_url,
            percentage: ranker.percentage.toString(),
            rank: ranker.rank.toString(),
            exam_name: ranker.exam_name || ''
        });
        // Set existing photo preview from signed URLs
        setPhotoPreview(photoUrls[ranker.id] || '/default-avatar.png');
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await customConfirm('Are you sure you want to delete this top ranker? This will also delete the photo from storage.');
        if (!confirmed) {
            return;
        }

        try {
            await topRankersAPI.delete(id);
            showToast('Top ranker deleted successfully!', 'success');
            fetchRankers();
        } catch (error) {
            console.error('Error deleting ranker:', error);
            showToast('Failed to delete top ranker', 'error');
        }
    };

    const handleToggle = async (id) => {
        try {
            await topRankersAPI.toggle(id);
            fetchRankers();
        } catch (error) {
            console.error('Error toggling ranker:', error);
            showToast('Failed to toggle ranker status', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            photo_url: '',
            percentage: '',
            rank: '',
            exam_name: ''
        });
        setPhotoFile(null);
        setPhotoPreview('');
        setEditingRanker(null);
        setShowModal(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <AdminMobileNav user={user} onLogout={handleLogout} />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top Rankers Management</h1>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleToggleVisibility}
                            disabled={togglingVisibility}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${showOnHomepage
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-600 text-white hover:bg-gray-700'
                                }`}
                        >
                            {togglingVisibility ? 'Updating...' : (
                                showOnHomepage ? '✓ Visible on Homepage' : '✗ Hidden on Homepage'
                            )}
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            + Add Top Ranker
                        </button>
                    </div>
                </div>

                {/* Rankers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Photo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Exam
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {rankers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No top rankers added yet. Click "Add Top Ranker" to get started.
                                    </td>
                                </tr>
                            ) : (
                                rankers.map((ranker) => (
                                    <tr key={ranker.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{ranker.rank}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-100 dark:border-gray-700">
                                                <img
                                                    src={photoUrls[ranker.id] || '/default-avatar.png'}
                                                    alt={ranker.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => e.target.src = '/default-avatar.png'}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{ranker.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">{ranker.percentage}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{ranker.exam_name || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggle(ranker.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${ranker.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {ranker.is_active ? '✓ Show on Homepage' : '✗ Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(ranker)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ranker.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                                    {editingRanker ? 'Edit Top Ranker' : 'Add Top Ranker'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Photo Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Student Photo *
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            {photoPreview && (
                                                <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/40 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Max size: 5MB. Formats: JPG, PNG</p>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Student Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                            placeholder="Enter student name"
                                            required
                                        />
                                    </div>

                                    {/* Percentage */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Percentage *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.percentage}
                                            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                            placeholder="Enter percentage (0-100)"
                                            required
                                        />
                                    </div>

                                    {/* Rank */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Rank *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.rank}
                                            onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                            placeholder="Enter rank"
                                            required
                                        />
                                    </div>

                                    {/* Exam Name / Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Exam / Subject / Course (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.exam_name}
                                            onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                            placeholder="e.g., Mathematics (95/100) or JEE Mains"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex justify-end space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {uploading ? 'Uploading...' : editingRanker ? 'Update' : 'Add'} Ranker
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
