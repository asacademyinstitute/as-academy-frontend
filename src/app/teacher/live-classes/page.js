'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';
import { customAlert } from '@/components/ui/custom-modal';

const CATEGORIES = ['All', 'Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
const SEM_MAP = {
    'Sem 1': 'Semester 1', 'Sem 2': 'Semester 2', 'Sem 3': 'Semester 3', 'Sem 4': 'Semester 4',
    'Sem 5': 'Semester 5', 'Sem 6': 'Semester 6', 'Sem 7': 'Semester 7', 'Sem 8': 'Semester 8',
};

function TeacherLiveClassesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);
    const [liveClassLink, setLiveClassLink] = useState('');
    const [liveClassTitle, setLiveClassTitle] = useState('');
    const [liveClassScheduledAt, setLiveClassScheduledAt] = useState('');

    // Filter state
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSemester, setSelectedSemester] = useState('All');
    const [filterLiveStatus, setFilterLiveStatus] = useState('all'); // all | has-link | no-link

    useEffect(() => {
        if (user) fetchCourses();
    }, [user]);

    const fetchCourses = async () => {
        try {
            const response = await coursesAPI.getByTeacher(user.id);
            setCourses(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatForDatetimeLocal = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60 * 1000);
            return localDate.toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    const handleUpdateLink = async (courseId) => {
        if (!liveClassTitle || !liveClassLink || !liveClassScheduledAt) {
            await customAlert('Please fill in all fields', 'Validation Error');
            return;
        }

        try {
            await coursesAPI.update(courseId, {
                live_class_link: liveClassLink,
                live_class_title: liveClassTitle,
                live_class_scheduled_at: new Date(liveClassScheduledAt).toISOString()
            });
            await customAlert('Live class updated successfully!', 'Success');
            setEditingCourse(null);
            setLiveClassLink('');
            setLiveClassTitle('');
            setLiveClassScheduledAt('');
            fetchCourses();
        } catch (error) {
            await customAlert('Failed to update live class', 'Error');
        }
    };

    const startEditing = (course) => {
        setEditingCourse(course.id);
        setLiveClassLink(course.live_class_link || '');
        setLiveClassTitle(course.live_class_title || '');
        setLiveClassScheduledAt(formatForDatetimeLocal(course.live_class_scheduled_at));
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedCategory('All');
        setSelectedSemester('All');
        setFilterLiveStatus('all');
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title?.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            selectedCategory === 'All' ||
            (course.category || '').toLowerCase() === selectedCategory.toLowerCase();

        const fullSem = SEM_MAP[selectedSemester] || selectedSemester;
        const matchesSemester =
            selectedSemester === 'All' ||
            (course.semester || '').toLowerCase() === fullSem.toLowerCase();

        const matchesLiveStatus =
            filterLiveStatus === 'all' ||
            (filterLiveStatus === 'has-link' && !!course.live_class_link) ||
            (filterLiveStatus === 'no-link' && !course.live_class_link);

        return matchesSearch && matchesCategory && matchesSemester && matchesLiveStatus;
    });

    const hasActiveFilters = search || selectedCategory !== 'All' || selectedSemester !== 'All' || filterLiveStatus !== 'all';

    const navItems = [
        { label: 'My Courses', href: '/teacher/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Students', href: '/teacher/students', icon: <Users className="w-5 h-5" /> },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video className="w-5 h-5" /> },
        { label: 'Profile', href: '/teacher/profile', icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950 pb-24 md:pb-0">
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">🎥 Live Class Management</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage live class links for your courses</p>
                </div>

                {/* Search + Filters */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">🔍</span>
                        <input
                            type="text"
                            placeholder="Search courses by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
                                ×
                            </button>
                        )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Category:</span>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedCategory === cat
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600'
                                }`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Semester Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Semester:</span>
                        {SEMESTERS.map(sem => (
                            <button key={sem} onClick={() => setSelectedSemester(sem)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedSemester === sem
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600 hover:text-purple-600'
                                }`}>
                                {sem}
                            </button>
                        ))}
                    </div>

                    {/* Live Status Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Live Link:</span>
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'has-link', label: '✅ Has Link' },
                            { value: 'no-link', label: '❌ No Link' },
                        ].map(opt => (
                            <button key={opt.value} onClick={() => setFilterLiveStatus(opt.value)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    filterLiveStatus === opt.value
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-600 hover:text-green-600'
                                }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Results + Clear */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-sm pt-0.5">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                {filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''} found
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <button onClick={resetFilters} className="text-red-500 hover:text-red-600 font-medium hover:underline text-xs">
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Courses List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <div className="text-5xl mb-3">😕</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                            {courses.length === 0 ? 'No courses assigned yet' : 'No courses match your filters'}
                        </p>
                        {hasActiveFilters && (
                            <button onClick={resetFilters} className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                                {/* Course Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                                {course.title}
                                            </h3>
                                            {course.category && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                                    {course.category}
                                                </span>
                                            )}
                                            {course.semester && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                                                    {course.semester}
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                course.live_class_link
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {course.live_class_link ? '🟢 Live Set' : '⚪ No Link'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{course.description}</p>
                                    </div>
                                    {editingCourse !== course.id && (
                                        <button
                                            onClick={() => startEditing(course)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition flex-shrink-0 w-full sm:w-auto"
                                        >
                                            {course.live_class_link ? 'Update Link' : 'Add Link'}
                                        </button>
                                    )}
                                </div>

                                {/* Edit Form */}
                                {editingCourse === course.id ? (
                                    <div className="space-y-4 mt-4 bg-gray-50/50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                Live Class Title *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={liveClassTitle}
                                                onChange={(e) => setLiveClassTitle(e.target.value)}
                                                placeholder="e.g., Introduction to React Hooks"
                                                className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                Meeting Link (Zoom, Google Meet, etc.) *
                                            </label>
                                            <input
                                                type="url"
                                                required
                                                value={liveClassLink}
                                                onChange={(e) => setLiveClassLink(e.target.value)}
                                                placeholder="https://zoom.us/j/123456789"
                                                className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                Scheduled Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={liveClassScheduledAt}
                                                onChange={(e) => setLiveClassScheduledAt(e.target.value)}
                                                className="w-full px-4 py-2 border border-border bg-background dark:bg-gray-950 text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Students will see when the live class is scheduled</p>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => handleUpdateLink(course.id)}
                                                className="flex-1 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition"
                                            >
                                                Save Live Class
                                            </button>
                                            <button
                                                onClick={() => { setEditingCourse(null); setLiveClassLink(''); setLiveClassTitle(''); setLiveClassScheduledAt(''); }}
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {course.live_class_link ? (
                                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 sm:p-5 mt-2">
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Class Title</span>
                                                        <p className="text-sm font-semibold text-foreground">{course.live_class_title || 'Untitled Live Class'}</p>
                                                    </div>
                                                    <div className="grid sm:grid-cols-2 gap-4 pt-1">
                                                        <div>
                                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Meeting Link</span>
                                                            <a href={course.live_class_link} target="_blank" rel="noopener noreferrer"
                                                                className="text-primary hover:underline break-all text-sm font-medium block">
                                                                {course.live_class_link}
                                                            </a>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Scheduled For</span>
                                                            <p className="text-sm text-foreground font-medium">
                                                                {course.live_class_scheduled_at 
                                                                    ? new Date(course.live_class_scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
                                                                    : 'Not scheduled'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={async () => { navigator.clipboard.writeText(course.live_class_link); await customAlert('Link copied!', 'Copied'); }}
                                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-xs font-semibold transition"
                                                        >
                                                            Copy Link
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center mt-2">
                                                <p className="text-gray-400 dark:text-gray-500 text-sm">No live class scheduled for this course</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {!loading && courses.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                        Showing {filteredCourses.length} of {courses.length} courses
                    </p>
                )}
            </div>
        </div>
    );
}

export default function TeacherLiveClassesPage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLiveClassesContent />
        </ProtectedRoute>
    );
}
