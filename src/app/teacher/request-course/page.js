'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/store/authStore';
import { courseRequestAPI } from '@/lib/api';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';
import { customAlert } from '@/components/ui/custom-modal';
import { uploadThumbnail } from '@/lib/supabase';

const CATEGORIES = ['Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

function TeacherRequestCourseContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [thumbnailMode, setThumbnailMode] = useState('upload'); // 'upload' | 'url'

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        validity_days: '365',
        thumbnail_url: '',
        category: '',
        semester: '',
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadThumbnail(file);
            setFormData(prev => ({ ...prev, thumbnail_url: url }));
        } catch (err) {
            console.error('Upload error:', err);
            customAlert(err.message || 'Failed to upload image. Please try again.', 'Upload Error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.price || !formData.thumbnail_url || !formData.validity_days) {
            customAlert('Please fill in all required fields', 'Validation Error');
            return;
        }

        setSubmitting(true);
        try {
            console.log('📝 Submitting course request:', formData);

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                validity_days: parseInt(formData.validity_days),
            };

            const response = await courseRequestAPI.create(payload);
            const data = response.data;
            console.log('📬 Course request response:', data);

            if (data.success) {
                console.log('✅ Course request created with ID:', data.data?.id);
                customAlert('Course request submitted successfully! Admin will review your request.', 'Request Submitted');
                setFormData({
                    title: '',
                    description: '',
                    price: '',
                    validity_days: '365',
                    thumbnail_url: '',
                    category: '',
                    semester: '',
                    level: 'beginner'
                });
                fetchMyRequests();
            } else {
                console.error('❌ Failed to create course request:', data);
                customAlert(data.message || 'Failed to submit request', 'Error');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            customAlert(error.response?.data?.message || 'Error submitting request', 'Submission Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const navItems = [
        { label: 'My Courses', href: '/teacher/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Students', href: '/teacher/students', icon: <Users className="w-5 h-5" /> },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video className="w-5 h-5" /> },
        { label: 'Profile', href: '/teacher/profile', icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950 pb-24 md:pb-8">
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Request Form */}
                    <div className="bg-card dark:bg-gray-900 border border-border rounded-xl shadow-soft p-6">
                        <h2 className="text-xl font-bold text-foreground mb-2">Request New Course</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Submit a course request for admin approval. Once approved, the course will be created automatically.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Course Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    placeholder="e.g., Advanced React Development"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    placeholder="Describe what students will learn..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                        placeholder="999"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Validity (days) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.validity_days}
                                        onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                                        className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    >
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    >
                                        <option value="">Select Semester</option>
                                        {SEMESTERS.map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Level
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-foreground">
                                        Course Thumbnail <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex space-x-1 bg-muted p-0.5 rounded-lg text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('upload')}
                                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${thumbnailMode === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailMode('url')}
                                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${thumbnailMode === 'url' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Image URL
                                        </button>
                                    </div>
                                </div>

                                {thumbnailMode === 'upload' ? (
                                    <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-blue-500 transition-colors bg-muted/30 text-center relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full">
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
                                            <p className="text-sm text-foreground font-medium">
                                                {uploading ? 'Uploading image...' : 'Click or drag image to upload'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PNG, JPG, JPEG up to 5MB (Recommended: 1280x720)
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="url"
                                            value={formData.thumbnail_url}
                                            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                            className="w-full px-3 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                                            <span>📐</span>
                                            <span>Recommended resolution: <strong>1280 × 720 px</strong> (16:9 aspect ratio)</span>
                                        </p>
                                    </div>
                                )}

                                {formData.thumbnail_url && (
                                    <div className="mt-2 relative group border border-border rounded-xl overflow-hidden bg-muted/20 p-2">
                                        <img
                                            src={formData.thumbnail_url}
                                            alt="Thumbnail preview"
                                            className="h-32 w-full object-contain bg-background rounded-lg border border-border"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                                            className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 duration-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit Course Request'}
                            </button>
                        </form>
                    </div>

                    {/* My Requests */}
                    <div className="bg-card dark:bg-gray-900 border border-border rounded-xl shadow-soft p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">My Course Requests</h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : myRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-sm">No course requests yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-2">Submit your first request using the form</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myRequests.map((request) => (
                                    <div key={request.id} className="border border-border rounded-xl p-4 bg-muted/20">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-foreground">{request.title}</h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        {request.description && (
                                            <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                                        )}

                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                            <span>₹{request.price}</span>
                                            <span>•</span>
                                            <span>{request.validity_days} days</span>
                                            {request.category && (
                                                <>
                                                    <span>•</span>
                                                    <span>{request.category}</span>
                                                </>
                                            )}
                                            {request.semester && (
                                                <>
                                                    <span>•</span>
                                                    <span>{request.semester}</span>
                                                </>
                                            )}
                                            {request.level && (
                                                <>
                                                    <span>•</span>
                                                    <span>{request.level}</span>
                                                </>
                                            )}
                                        </div>

                                        {request.admin_notes && (
                                            <div className="mt-3 p-2.5 bg-muted rounded-lg border border-border">
                                                <p className="text-xs font-semibold text-foreground mb-0.5">Admin Notes:</p>
                                                <p className="text-xs text-muted-foreground">{request.admin_notes}</p>
                                            </div>
                                        )}

                                        {request.thumbnail_url && (
                                            <img
                                                src={request.thumbnail_url}
                                                alt={request.title}
                                                className="mt-3 h-28 w-full object-contain bg-gray-50 dark:bg-gray-900 rounded-lg border border-border"
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
