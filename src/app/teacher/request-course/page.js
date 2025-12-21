'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/store/authStore';
import { courseRequestAPI } from '@/lib/api';

function TeacherRequestCourseContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        validity_days: '365',
        thumbnail_url: '',
        category: '',
        level: 'beginner'
    });

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const response = await courseRequestAPI.getMy();
            setMyRequests(response.data.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.price || !formData.thumbnail_url) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            console.log('📝 Submitting course request:', formData);

            const response = await courseRequestAPI.create(formData);
            const data = response.data;
            console.log('📬 Course request response:', data);

            if (data.success) {
                console.log('✅ Course request created with ID:', data.data?.id);
                alert('Course request submitted successfully! Admin will review your request.');
                setFormData({
                    title: '',
                    description: '',
                    price: '',
                    validity_days: '365',
                    thumbnail_url: '',
                    category: '',
                    level: 'beginner'
                });
                fetchMyRequests();
            } else {
                console.error('❌ Failed to create course request:', data);
                alert(data.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert(error.response?.data?.message || 'Error submitting request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY - Teacher
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Teacher: {user?.name}</span>
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
                        <Link href="/teacher/dashboard" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Dashboard
                        </Link>
                        <Link href="/teacher/courses" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            My Courses
                        </Link>
                        <Link href="/teacher/request-course" className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium">
                            Request New Course
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Request Form */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Request New Course</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Submit a course request for admin approval. Once approved, the course will be created automatically.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Course Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Advanced React Development"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe what students will learn..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Validity (days)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.validity_days}
                                        onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thumbnail Image URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.thumbnail_url}
                                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.thumbnail_url && (
                                    <div className="mt-2">
                                        <img
                                            src={formData.thumbnail_url}
                                            alt="Thumbnail preview"
                                            className="h-32 w-full object-cover rounded-lg"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Programming"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Level
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                            >
                                {submitting ? 'Submitting...' : 'Submit Course Request'}
                            </button>
                        </form>
                    </div>

                    {/* My Requests */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">My Course Requests</h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : myRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No course requests yet</p>
                                <p className="text-sm text-gray-400 mt-2">Submit your first request using the form</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myRequests.map((request) => (
                                    <div key={request.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">{request.title}</h3>
                                            <span className={`px-2 py-1 text-xs rounded ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        {request.description && (
                                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                                        )}

                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span>₹{request.price}</span>
                                            <span>•</span>
                                            <span>{request.validity_days} days</span>
                                            <span>•</span>
                                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {request.admin_notes && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded">
                                                <p className="text-xs font-medium text-gray-700">Admin Notes:</p>
                                                <p className="text-sm text-gray-600">{request.admin_notes}</p>
                                            </div>
                                        )}

                                        {request.thumbnail_url && (
                                            <img
                                                src={request.thumbnail_url}
                                                alt={request.title}
                                                className="mt-2 h-24 w-full object-cover rounded"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeacherRequestCoursePage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherRequestCourseContent />
        </ProtectedRoute>
    );
}
