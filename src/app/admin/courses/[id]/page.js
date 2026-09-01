'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { uploadThumbnail } from '@/lib/supabase';
import { customConfirm } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

const CATEGORIES = ['Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

function EditCourseContent() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [thumbnailMode, setThumbnailMode] = useState('upload'); // 'upload' | 'url'
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        validity_days: '',
        teacher_id: '',
        thumbnail_url: '',
        category: '',
        semester: '',
        level: 'beginner',
        status: 'draft',
    });

    useEffect(() => {
        fetchTeachers();
        if (courseId) fetchCourse();
    }, [courseId]);

    const fetchTeachers = async () => {
        try {
            const response = await userAPI.getAll({ role: 'teacher' });
            setTeachers(response.data?.data?.users || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await coursesAPI.getById(courseId);
            const course = response.data?.data || response.data;

            setFormData({
                title: course.title || '',
                description: course.description || '',
                price: course.price || '',
                validity_days: course.validity_days || course.duration || '',
                teacher_id: course.teacher_id || course.teacher?.id || '',
                thumbnail_url: course.thumbnail_url || course.thumbnail || '',
                category: course.category || '',
                semester: course.semester || '',
                level: course.level || 'beginner',
                status: course.status || 'draft',
            });
        } catch (err) {
            console.error('Error fetching course:', err);
            setError('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const url = await uploadThumbnail(file);
            setFormData(prev => ({ ...prev, thumbnail_url: url }));
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (!formData.title || !formData.description || !formData.price || !formData.validity_days || !formData.teacher_id) {
                setError('Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            const courseData = {
                ...formData,
                price: parseFloat(formData.price),
                validity_days: parseInt(formData.validity_days),
            };

            await coursesAPI.update(courseId, courseData);
            showToast('Course updated successfully!', 'success');
            router.push('/admin/courses');
        } catch (err) {
            console.error('Error updating course:', err);
            setError(err.response?.data?.message || 'Failed to update course');
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await customConfirm('Are you sure you want to delete this course? This action cannot be undone.', 'Delete Course');
        if (!confirmed) return;

        try {
            await coursesAPI.delete(courseId);
            showToast('Course deleted successfully', 'success');
            router.push('/admin/courses');
        } catch (err) {
            console.error('Error deleting course:', err);
            showToast(err.response?.data?.message || 'Failed to delete course', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/admin/courses" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                        ← Back to Courses
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h2>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                        >
                            Delete Course
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                placeholder="e.g., Complete Web Development Bootcamp"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                placeholder="Describe what students will learn in this course..."
                            />
                        </div>

                        {/* Teacher and Price */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Teacher *</label>
                                <select
                                    name="teacher_id"
                                    value={formData.teacher_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="" className="dark:bg-gray-900">Select a teacher</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id} className="dark:bg-gray-900">
                                            {teacher.name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    placeholder="e.g., 4999"
                                />
                            </div>
                        </div>

                        {/* Category and Semester */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="" className="dark:bg-gray-900">Select Category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} className="dark:bg-gray-900">{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="" className="dark:bg-gray-900">Select Semester</option>
                                    {SEMESTERS.map(sem => (
                                        <option key={sem} value={sem} className="dark:bg-gray-900">{sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Level and Validity */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Level</label>
                                <select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="beginner" className="dark:bg-gray-900">Beginner</option>
                                    <option value="intermediate" className="dark:bg-gray-900">Intermediate</option>
                                    <option value="advanced" className="dark:bg-gray-900">Advanced</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Validity (days) *</label>
                                <input
                                    type="number"
                                    name="validity_days"
                                    value={formData.validity_days}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    placeholder="e.g., 365"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Days students will have access</p>
                            </div>
                        </div>

                        {/* Thumbnail URL / Upload */}
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
                                        name="thumbnail_url"
                                        value={formData.thumbnail_url}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-200"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <span>📐</span>
                                        <span>Recommended resolution: <strong>1280 × 720 px</strong> (16:9 aspect ratio)</span>
                                    </p>
                                </div>
                            )}

                            {formData.thumbnail_url && (
                                <div className="mt-2 relative group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 p-2">
                                    <img
                                        src={formData.thumbnail_url}
                                        alt="Thumbnail preview"
                                        className="h-32 w-full object-contain bg-gray-100 dark:bg-gray-950 rounded-lg"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                                        className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 duration-200 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="draft" className="dark:bg-gray-900">Draft</option>
                                <option value="active" className="dark:bg-gray-900">Active</option>
                                <option value="inactive" className="dark:bg-gray-900">Inactive</option>
                            </select>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Link href="/admin/courses" className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
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
