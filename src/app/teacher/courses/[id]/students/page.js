'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { enrollmentAPI, coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';
import { customAlert, customConfirm } from '@/components/ui/custom-modal';

function TeacherStudentsContent() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
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
        if (!await customConfirm(`Block ${studentName} from this course? They will lose access but the record will be kept.`, 'Block Student')) return;
        try {
            await enrollmentAPI.cancelEnrollment(enrollmentId);
            await customAlert('Student blocked successfully', 'Success');
            fetchData();
        } catch (error) {
            await customAlert('Failed to block student', 'Error');
        }
    };

    const handleUnblockStudent = async (enrollmentId, studentName) => {
        if (!await customConfirm(`Unblock ${studentName}? They will regain access to the course.`, 'Unblock Student')) return;
        try {
            await enrollmentAPI.unblockEnrollment(enrollmentId);
            await customAlert('Student unblocked successfully', 'Success');
            fetchData();
        } catch (error) {
            await customAlert('Failed to unblock student', 'Error');
        }
    };

    const handleRemoveStudent = async (enrollmentId, studentName) => {
        if (!await customConfirm(`Permanently remove ${studentName} from this course? This cannot be undone!`, 'Remove Student')) return;
        try {
            await enrollmentAPI.deleteEnrollment(enrollmentId);
            await customAlert('Student removed successfully', 'Success');
            fetchData();
        } catch (error) {
            await customAlert('Failed to remove student', 'Error');
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
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Back button and title */}
                <div className="mb-6">
                    <Link href={`/teacher/courses/${params.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 mb-3 transition-colors">
                        ← Back to Course
                    </Link>
                    <div className="bg-card dark:bg-gray-900 border border-border rounded-xl p-5 sm:p-6 shadow-soft">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{course?.title}</h1>
                        <p className="text-muted-foreground text-sm">Student List & Progress Tracking</p>
                    </div>
                </div>

                {/* Students List */}
                <div className="bg-card dark:bg-gray-900 border border-border rounded-xl shadow-soft overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-lg font-bold text-foreground">Enrolled Students ({students.length})</h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : students.length > 0 ? (
                        <>
                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled On</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid Until</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-transparent">
                                        {students.map((enrollment) => {
                                            const progress = calculateProgress(enrollment);
                                            return (
                                                <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-foreground">
                                                            {enrollment.users?.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {enrollment.users?.college_name || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {enrollment.users?.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {formatDate(enrollment.enrolled_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {formatDate(enrollment.valid_until)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {enrollment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                        {enrollment.status === 'active' && (
                                                            <button
                                                                onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name)}
                                                                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold transition-colors"
                                                            >
                                                                Block
                                                            </button>
                                                        )}
                                                        {enrollment.status === 'cancelled' && (
                                                            <button
                                                                onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name)}
                                                                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold transition-colors"
                                                            >
                                                                Unblock
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name)}
                                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors"
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

                            {/* Mobile View - Cards */}
                            <div className="md:hidden divide-y divide-border bg-card dark:bg-gray-900">
                                {students.map((enrollment) => {
                                    const progress = calculateProgress(enrollment);
                                    return (
                                        <div key={enrollment.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-foreground text-sm">{enrollment.users?.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{enrollment.users?.college_name || 'N/A'}</p>
                                                </div>
                                                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                                    enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    enrollment.status === 'cancelled' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {enrollment.status}
                                                </span>
                                            </div>

                                            <div className="text-xs space-y-2 text-muted-foreground">
                                                <div>
                                                    <span>Email: </span>
                                                    <span className="text-foreground font-medium">{enrollment.users?.email}</span>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="space-y-1">
                                                    <span>Progress: </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-250 dark:bg-gray-800 rounded-full h-2 max-w-[120px]">
                                                            <div
                                                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-foreground">{progress}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-[10px] pt-1 text-muted-foreground/80">
                                                    <span>Enrolled: {formatDate(enrollment.enrolled_at)}</span>
                                                    <span>Valid: {formatDate(enrollment.valid_until)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2.5 border-t border-border text-xs">
                                                {enrollment.status === 'active' && (
                                                    <button
                                                        onClick={() => handleBlockStudent(enrollment.id, enrollment.users?.name)}
                                                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-semibold transition-colors"
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                                {enrollment.status === 'cancelled' && (
                                                    <button
                                                        onClick={() => handleUnblockStudent(enrollment.id, enrollment.users?.name)}
                                                        className="text-green-600 dark:text-green-400 hover:text-green-700 font-semibold transition-colors"
                                                    >
                                                        Unblock
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveStudent(enrollment.id, enrollment.users?.name)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 font-semibold transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-sm">No students enrolled yet</p>
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
