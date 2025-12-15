'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { enrollmentAPI, coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';

function TeacherStudentsContent() {
    const params = useParams();
    const { user } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const [courseRes, enrollmentsRes] = await Promise.all([
                coursesAPI.getById(params.id),
                enrollmentAPI.getByCourse(params.id),
            ]);

            setCourse(courseRes.data.data);
            setStudents(enrollmentsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (enrollment) => {
        if (!enrollment.progress || enrollment.progress.length === 0) return 0;
        const completed = enrollment.progress.filter(p => p.completed).length;
        const total = enrollment.progress.length;
        return Math.round((completed / total) * 100);
    };

    const handleBlockStudent = async (enrollmentId, studentName) => {
        if (!confirm(`Block ${studentName} from this course? They will lose access but the record will be kept.`)) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            alert('Student blocked successfully');
            fetchData();
        } catch (error) {
            alert('Failed to block student');
        }
    };

    const handleUnblockStudent = async (enrollmentId, studentName) => {
        if (!confirm(`Unblock ${studentName}? They will regain access to the course.`)) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            alert('Student unblocked successfully');
            fetchData();
        } catch (error) {
            alert('Failed to unblock student');
        }
    };

    const handleRemoveStudent = async (enrollmentId, studentName) => {
        if (!confirm(`Permanently remove ${studentName} from this course? This cannot be undone!`)) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            alert('Student removed successfully');
            fetchData();
        } catch (error) {
            alert('Failed to remove student');
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/teacher/dashboard" className="text-blue-600 hover:text-blue-700">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{course?.title}</h1>
                    <p className="text-gray-600">Student List & Progress Tracking</p>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Enrolled Students ({students.length})</h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : students.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled On</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((enrollment) => {
                                        const progress = calculateProgress(enrollment);
                                        return (
                                            <tr key={enrollment.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {enrollment.users?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {enrollment.users?.college_name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {enrollment.users?.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(enrollment.enrolled_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(enrollment.valid_until)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '100px' }}>
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    {enrollment.status === 'active' && (
                                                        <button
                                                            onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name)}
                                                            className="text-orange-600 hover:text-orange-700 font-medium"
                                                        >
                                                            Block
                                                        </button>
                                                    )}
                                                    {enrollment.status === 'cancelled' && (
                                                        <button
                                                            onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name)}
                                                            className="text-green-600 hover:text-green-700 font-medium"
                                                        >
                                                            Unblock
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name)}
                                                        className="text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No students enrolled yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TeacherStudentsPage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherStudentsContent />
        </ProtectedRoute>
    );
}
