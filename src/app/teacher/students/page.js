'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';

function TeacherStudentsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Get teacher's courses
            const coursesRes = await coursesAPI.getAll({ teacherId: user.id });
            const teacherCourses = coursesRes.data.data.courses || [];
            setCourses(teacherCourses);

            // Get enrollments for all courses
            const enrollmentPromises = teacherCourses.map(course =>
                enrollmentAPI.getCourseEnrollments(course.id)
            );
            const enrollmentResults = await Promise.all(enrollmentPromises);

            // Combine all enrollments with course info
            const allStudents = [];
            enrollmentResults.forEach((res, index) => {
                const courseEnrollments = res.data.data || [];
                courseEnrollments.forEach(enrollment => {
                    allStudents.push({
                        ...enrollment,
                        courseName: teacherCourses[index].title,
                        courseId: teacherCourses[index].id,
                    });
                });
            });

            setStudents(allStudents);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleBlockStudent = async (enrollmentId, studentName, courseName) => {
        if (!confirm(`Block ${studentName} from "${courseName}"? They will lose access but the record will be kept.`)) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            alert('Student blocked successfully');
            fetchData();
        } catch (error) {
            alert('Failed to block student');
        }
    };

    const handleUnblockStudent = async (enrollmentId, studentName, courseName) => {
        if (!confirm(`Unblock ${studentName} from "${courseName}"? They will regain access.`)) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            alert('Student unblocked successfully');
            fetchData();
        } catch (error) {
            alert('Failed to unblock student');
        }
    };

    const handleRemoveStudent = async (enrollmentId, studentName, courseName) => {
        if (!confirm(`Permanently remove ${studentName} from "${courseName}"? This cannot be undone!`)) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            alert('Student removed successfully');
            fetchData();
        } catch (error) {
            alert('Failed to remove student');
        }
    };

    // Filter students based on search and course filter
    const filteredStudents = students.filter(student => {
        const matchesSearch = !searchTerm ||
            student.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.users?.college_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCourse = !filterCourse || student.courseId === filterCourse;

        return matchesSearch && matchesCourse;
    });

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY - Teacher
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
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
                            href="/teacher/dashboard"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            My Courses
                        </Link>
                        <Link
                            href="/teacher/students"
                            className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium"
                        >
                            Students
                        </Link>
                        <Link
                            href="/teacher/live-classes"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            Live Classes
                        </Link>
                        <Link
                            href="/teacher/profile"
                            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1"
                        >
                            Profile
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">All Students</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, or college..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-xl font-bold text-gray-900">
                            Enrolled Students ({filteredStudents.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled On</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((enrollment) => (
                                        <tr key={enrollment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {enrollment.users?.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {enrollment.users?.college_name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Sem: {enrollment.users?.semester || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {enrollment.users?.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/courses/${enrollment.courseId}/students`}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    {enrollment.courseName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(enrollment.enrolled_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(enrollment.valid_until)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                                                            enrollment.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {enrollment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                {enrollment.status === 'active' && (
                                                    <button
                                                        onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                        className="text-orange-600 hover:text-orange-700 font-medium"
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                                {enrollment.status === 'cancelled' && (
                                                    <button
                                                        onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                        className="text-green-600 hover:text-green-700 font-medium"
                                                    >
                                                        Unblock
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                    className="text-red-600 hover:text-red-700 font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                {searchTerm || filterCourse ? 'No students found matching your filters' : 'No students enrolled yet'}
                            </p>
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
