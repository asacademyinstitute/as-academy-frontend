'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMobileNav from '@/components/AdminMobileNav';
import { topRankersAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

export default function TopRankersPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [rankers, setRankers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRanker, setEditingRanker] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState({}); // Store signed URLs for photos

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
            alert('Failed to fetch top rankers');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
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
            alert('Please enter student name');
            return;
        }

        if (!photoFile && !editingRanker) {
            alert('Please select a photo');
            return;
        }

        const percentage = parseFloat(formData.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            alert('Percentage must be between 0 and 100');
            return;
        }

        const rank = parseInt(formData.rank);
        if (isNaN(rank) || rank < 1) {
            alert('Rank must be a positive number');
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
                alert('Top ranker updated successfully!');
            } else {
                await topRankersAPI.create(data);
                alert('Top ranker added successfully!');
            }

            resetForm();
            fetchRankers();
        } catch (error) {
            console.error('Error saving ranker:', error);
            alert(error.response?.data?.message || 'Failed to save top ranker');
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
        if (!confirm('Are you sure you want to delete this top ranker? This will also delete the photo from storage.')) {
            return;
        }

        try {
            await topRankersAPI.delete(id);
            alert('Top ranker deleted successfully!');
            fetchRankers();
        } catch (error) {
            console.error('Error deleting ranker:', error);
            alert('Failed to delete top ranker');
        }
    };

    const handleToggle = async (id) => {
        try {
            await topRankersAPI.toggle(id);
            fetchRankers();
        } catch (error) {
            console.error('Error toggling ranker:', error);
            alert('Failed to toggle ranker status');
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
            <div className="min-h-screen bg-background">
                <AdminMobileNav user={user} onLogout={handleLogout} />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminMobileNav user={user} onLogout={handleLogout} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Top Rankers Management</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add Top Ranker
                    </button>
                </div>

                {/* Rankers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Photo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rankers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        No top rankers added yet. Click "Add Top Ranker" to get started.
                                    </td>
                                </tr>
                            ) : (
                                rankers.map((ranker) => (
                                    <tr key={ranker.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl font-bold text-blue-600">#{ranker.rank}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                                <img
                                                    src={photoUrls[ranker.id] || '/default-avatar.png'}
                                                    alt={ranker.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => e.target.src = '/default-avatar.png'}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{ranker.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-semibold text-green-600">{ranker.percentage}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{ranker.exam_name || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggle(ranker.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${ranker.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {ranker.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(ranker)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ranker.id)}
                                                className="text-red-600 hover:text-red-900"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">
                                    {editingRanker ? 'Edit Top Ranker' : 'Add Top Ranker'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Photo Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Student Photo *
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            {photoPreview && (
                                                <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden">
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
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">Max size: 5MB. Formats: JPG, PNG</p>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Student Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter student name"
                                            required
                                        />
                                    </div>

                                    {/* Percentage */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Percentage *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.percentage}
                                            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter percentage (0-100)"
                                            required
                                        />
                                    </div>

                                    {/* Rank */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rank *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.rank}
                                            onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter rank"
                                            required
                                        />
                                    </div>

                                    {/* Exam Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Exam Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.exam_name}
                                            onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., JEE Mains 2024"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex justify-end space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
