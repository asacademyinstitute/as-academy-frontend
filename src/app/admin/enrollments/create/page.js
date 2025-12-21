'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userAPI, coursesAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function AdminEnrollStudentContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        student_id: '',
        course_id: '',
        validity_days: 365,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                userAPI.getAll({ role: 'student' }),
                coursesAPI.getAll({ status: 'active' }),
            ]);
            setStudents(studentsRes.data.data.users || []);
            setCourses(coursesRes.data.data.courses || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load students and courses');
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
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.student_id || !formData.course_id || !formData.validity_days) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.validity_days < 1) {
            setError('Validity days must be at least 1');
            return;
        }

        setSubmitting(true);

        try {
            await enrollmentAPI.adminEnroll({
                student_id: formData.student_id,
                course_id: formData.course_id,
                validity_days: parseInt(formData.validity_days),
            });

            setSuccess('Student enrolled successfully!');
            setFormData({
                student_id: '',
                course_id: '',
                validity_days: 365,
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 2000);
        } catch (err) {
            console.error('Error enrolling student:', err);
            setError(err.response?.data?.message || 'Failed to enroll student');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Enroll Student</h1>
                    <p className="text-gray-600 mb-6">Manually enroll a student into a course (offline payment)</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Student *
                            </label>
                            <select
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Choose a student...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Course *
                            </label>
                            <select
                                name="course_id"
                                value={formData.course_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Choose a course...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Validity Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Validity (days) *
                            </label>
                            <input
                                type="number"
                                name="validity_days"
                                value={formData.validity_days}
                                onChange={handleChange}
                                required
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., 365 (1 year)"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Number of days the student will have access to this course
                            </p>
                        </div>

                        {/* Payment Type Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Offline Payment</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        This enrollment will be marked as "offline" payment type in the system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Link
                                href="/admin/dashboard"
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Enrolling...' : 'Enroll Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function AdminEnrollStudent() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminEnrollStudentContent />
        </ProtectedRoute>
    );
}
