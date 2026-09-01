'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';
import { customAlert, customConfirm } from '@/components/ui/custom-modal';

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
            const coursesRes = await coursesAPI.getAll({ teacherId: user.id, limit: 1000 });
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
        if (!await customConfirm(`Block ${studentName} from "${courseName}"? They will lose access but the record will be kept.`, 'Block Student')) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            customAlert('Student blocked successfully', 'Success');
            fetchData();
        } catch (error) {
            customAlert('Failed to block student', 'Error');
        }
    };

    const handleUnblockStudent = async (enrollmentId, studentName, courseName) => {
        if (!await customConfirm(`Unblock ${studentName} from "${courseName}"? They will regain access.`, 'Unblock Student')) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            customAlert('Student unblocked successfully', 'Success');
            fetchData();
        } catch (error) {
            customAlert('Failed to unblock student', 'Error');
        }
    };

    const handleRemoveStudent = async (enrollmentId, studentName, courseName) => {
        if (!await customConfirm(`Permanently remove ${studentName} from "${courseName}"? This cannot be undone!`, 'Remove Student')) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            customAlert('Student removed successfully', 'Success');
            fetchData();
        } catch (error) {
            customAlert('Failed to remove student', 'Error');
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

    const navItems = [
        { label: 'My Courses', href: '/teacher/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Students', href: '/teacher/students', icon: <Users className="w-5 h-5" /> },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video className="w-5 h-5" /> },
        { label: 'Profile', href: '/teacher/profile', icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950 pb-24 md:pb-8">
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Filters */}
                <div className="bg-card dark:bg-gray-900 border border-border rounded-xl shadow-soft p-5 sm:p-6 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">All Students</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, or college..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                        />
                        <select
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Students List Container */}
                <div className="bg-card dark:bg-gray-900 border border-border rounded-xl shadow-soft overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-bold text-foreground">
                            Enrolled Students ({filteredStudents.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <>
                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled On</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid Until</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-transparent">
                                        {filteredStudents.map((enrollment) => (
                                            <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {enrollment.users?.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {enrollment.users?.college_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Sem: {enrollment.users?.semester || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {enrollment.users?.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/teacher/courses/${enrollment.courseId}/students`}
                                                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                    >
                                                        {enrollment.courseName}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {formatDate(enrollment.enrolled_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {formatDate(enrollment.valid_until)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                                        enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        enrollment.status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    {enrollment.status === 'active' && (
                                                        <button
                                                            onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold transition-colors"
                                                        >
                                                            Block
                                                        </button>
                                                    )}
                                                    {enrollment.status === 'cancelled' && (
                                                        <button
                                                            onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold transition-colors"
                                                        >
                                                            Unblock
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View - Card List */}
                            <div className="md:hidden divide-y divide-border bg-card dark:bg-gray-900">
                                {filteredStudents.map((enrollment) => (
                                    <div key={enrollment.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm">{enrollment.users?.name}</h4>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {enrollment.users?.college_name || 'College: N/A'}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Semester: {enrollment.users?.semester || 'N/A'}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                enrollment.status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {enrollment.status}
                                            </span>
                                        </div>

                                        <div className="text-xs space-y-1.5 text-muted-foreground">
                                            <div>
                                                <span>Email: </span>
                                                <span className="text-foreground font-medium">{enrollment.users?.email}</span>
                                            </div>
                                            <div>
                                                <span>Course: </span>
                                                <Link
                                                    href={`/teacher/courses/${enrollment.courseId}/students`}
                                                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                                >
                                                    {enrollment.courseName}
                                                </Link>
                                            </div>
                                            <div className="flex justify-between text-[10px] pt-1 text-muted-foreground/80">
                                                <span>Enrolled: {formatDate(enrollment.enrolled_at)}</span>
                                                <span>Valid: {formatDate(enrollment.valid_until)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2.5 border-t border-border text-xs">
                                            {enrollment.status === 'active' && (
                                                <button
                                                    onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-semibold transition-colors"
                                                >
                                                    Block
                                                </button>
                                            )}
                                            {enrollment.status === 'cancelled' && (
                                                <button
                                                    onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                    className="text-green-600 dark:text-green-400 hover:text-green-700 font-semibold transition-colors"
                                                >
                                                    Unblock
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name, enrollment.courseName)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-700 font-semibold transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-sm">
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
