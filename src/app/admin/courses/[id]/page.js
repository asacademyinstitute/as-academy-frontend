'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function EditCourseContent() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        price: '',
        duration: '',
        thumbnail: '',
        status: 'draft',
    });

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await coursesAPI.getById(courseId);
            const course = response.data.data;

            setFormData({
                title: course.title || '',
                description: course.description || '',
                category: course.category || '',
                level: course.level || 'beginner',
                price: course.price || '',
                duration: course.duration || '',
                thumbnail: course.thumbnail || '',
                status: course.status || 'draft',
            });
        } catch (err) {
            console.error('Error fetching course:', err);
            setError('Failed to load course');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            // Validate required fields
            if (!formData.title || !formData.description || !formData.category || !formData.price || !formData.duration) {
                setError('Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            // Convert price and duration to numbers
            const courseData = {
                ...formData,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
            };

            await coursesAPI.update(courseId, courseData);
            router.push('/admin/courses');
        } catch (err) {
            console.error('Error updating course:', err);
            setError(err.response?.data?.message || 'Failed to update course');
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            await coursesAPI.delete(courseId);
            router.push('/admin/courses');
        } catch (err) {
            console.error('Error deleting course:', err);
            setError(err.response?.data?.message || 'Failed to delete course');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course...</p>
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
                        <Link
                            href="/admin/dashboard"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/users"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            Users
                        </Link>
                        <Link
                            href="/admin/courses"
                            className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium"
                        >
                            Courses
                        </Link>
                        <Link
                            href="/admin/payments"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            Payments
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/admin/courses"
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                        ← Back to Courses
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Course</h2>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Delete Course
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Course Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Complete Web Development Bootcamp"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe what students will learn in this course..."
                            />
                        </div>

                        {/* Category and Level */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Programming, Design, Business"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level *
                                </label>
                                <select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        {/* Price and Duration */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 4999"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration (days) *
                                </label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 90"
                                />
                            </div>
                        </div>

                        {/* Thumbnail URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thumbnail URL
                            </label>
                            <input
                                type="url"
                                name="thumbnail"
                                value={formData.thumbnail}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.thumbnail && (
                                <div className="mt-2">
                                    <img
                                        src={formData.thumbnail}
                                        alt="Thumbnail preview"
                                        className="h-32 w-auto rounded border"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Link
                                href="/admin/courses"
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Updating...' : 'Update Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function EditCourse() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <EditCourseContent />
        </ProtectedRoute>
    );
}
