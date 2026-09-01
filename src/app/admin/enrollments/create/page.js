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
        amount: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                userAPI.getAll({ role: 'student', limit: 10000 }),
                coursesAPI.getAll({ status: 'active', limit: 1000 }),
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
        // Auto-fill amount when course is selected
        if (name === 'course_id') {
            const selectedCourse = courses.find(c => c.id === value);
            if (selectedCourse?.price != null) {
                setFormData(prev => ({ ...prev, course_id: value, amount: selectedCourse.price }));
                return;
            }
        }
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

        const amountValue = parseFloat(formData.amount);
        if (isNaN(amountValue) || amountValue < 0) {
            setError('Please enter a valid amount (0 or more)');
            return;
        }

        setSubmitting(true);

        try {
            await enrollmentAPI.adminEnroll({
                student_id: formData.student_id,
                course_id: formData.course_id,
                validity_days: parseInt(formData.validity_days),
                amount: parseFloat(formData.amount) || 0,
            });

            setSuccess('Student enrolled successfully!');
            setFormData({
                student_id: '',
                course_id: '',
                validity_days: 365,
                amount: '',
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/admin/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-medium">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Enroll Student</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Manually enroll a student into a course (offline payment)</p>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Student *
                            </label>
                            <select
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="" className="dark:bg-gray-900">Choose a student...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id} className="dark:bg-gray-900">
                                        {student.name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Course *
                            </label>
                            <select
                                name="course_id"
                                value={formData.course_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="" className="dark:bg-gray-900">Choose a course...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id} className="dark:bg-gray-900">
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Validity Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Validity (days) *
                            </label>
                            <input
                                type="number"
                                name="validity_days"
                                value={formData.validity_days}
                                onChange={handleChange}
                                required
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                placeholder="e.g., 365 (1 year)"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Number of days the student will have access to this course
                            </p>
                        </div>

                        {/* Amount Paid */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Amount Paid (₹) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">₹</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Enter the actual amount received from the student. This will be saved as an offline payment record.
                            </p>
                        </div>

                        {/* Payment Type Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Offline Payment</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        This enrollment will be marked as "offline" payment type in the system.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Link
                                href="/admin/dashboard"
                                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting || !formData.student_id || !formData.course_id || formData.amount === ''}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
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
