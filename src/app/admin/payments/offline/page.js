'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { paymentAPI, coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function OfflineEnrollmentContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [formData, setFormData] = useState({
        studentEmail: '',
        courseId: '',
        amount: '',
    });
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);

    const searchCourses = async (search) => {
        if (!search) return;
        try {
            const response = await coursesAPI.getAll({ search });
            setCourses(response.data.data.courses || []);
        } catch (error) {
            console.error('Error searching courses:', error);
        }
    };

    const searchStudents = async (search) => {
        if (!search) return;
        try {
            const response = await userAPI.getAll({ role: 'student', search });
            setStudents(response.data.data.users || []);
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Find student by email
            const studentsRes = await userAPI.getAll({ search: formData.studentEmail });
            const student = studentsRes.data.data.users?.find(u => u.email === formData.studentEmail);

            if (!student) {
                alert('Student not found with this email');
                setLoading(false);
                return;
            }

            await paymentAPI.offlineEnroll({
                studentId: student.id,
                courseId: formData.courseId,
                amount: parseFloat(formData.amount),
            });

            alert('Offline enrollment successful!');
            router.push('/admin/payments');
        } catch (error) {
            alert('Failed to create offline enrollment');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-background">
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

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/admin/payments" className="text-blue-600 hover:text-blue-700">
                        ← Back to Payments
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Offline Enrollment</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.studentEmail}
                                onChange={(e) => {
                                    setFormData({ ...formData, studentEmail: e.target.value });
                                    searchStudents(e.target.value);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="student@example.com"
                            />
                            {students.length > 0 && (
                                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                                    {students.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, studentEmail: s.email });
                                                setStudents([]);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                        >
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-sm text-gray-600">{s.email}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Course *
                            </label>
                            <input
                                type="text"
                                placeholder="Search for course..."
                                onChange={(e) => searchCourses(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                            />
                            {courses.length > 0 && (
                                <div className="border rounded-lg max-h-60 overflow-y-auto">
                                    {courses.map((course) => (
                                        <button
                                            key={course.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, courseId: course.id, amount: course.price });
                                                setCourses([]);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                                        >
                                            <div className="font-medium">{course.title}</div>
                                            <div className="text-sm text-gray-600">₹{course.price}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {formData.courseId && (
                                <div className="mt-2 text-sm text-green-600">
                                    ✓ Course selected
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount Paid *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Note:</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• This will create an offline payment record</li>
                                <li>• Student will be enrolled immediately</li>
                                <li>• Enrollment validity will start from today</li>
                                <li>• Payment method will be marked as "offline"</li>
                            </ul>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={loading || !formData.studentEmail || !formData.courseId || !formData.amount}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Create Enrollment'}
                            </button>
                            <Link
                                href="/admin/payments"
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 text-center"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function OfflineEnrollmentPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <OfflineEnrollmentContent />
        </ProtectedRoute>
    );
}
