'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, chapterAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { customConfirm } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

const CATEGORIES = ['Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

function AdminCoursesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferSourceCourse, setTransferSourceCourse] = useState(null);
    const [transferTargetCourseId, setTransferTargetCourseId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await coursesAPI.getAll({ limit: 1000 });
            setCourses(response.data?.data?.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            showToast('Error fetching courses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId) => {
        const confirmed = await customConfirm('Are you sure you want to delete this course? This action cannot be undone.', 'Confirm Delete');
        if (!confirmed) return;

        try {
            await coursesAPI.delete(courseId);
            setCourses(courses.filter(c => c.id !== courseId));
            showToast('Course deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Failed to delete course', 'error');
        }
    };

    const handleDownloadCourseContent = async (course) => {
        try {
            showToast('Fetching course files...', 'info');
            const response = await chapterAPI.getByCourse(course.id);
            const chapters = response.data.data || [];
            
            const downloadableLectures = [];
            chapters.forEach(chapter => {
                if (chapter.lectures) {
                    chapter.lectures.forEach(lecture => {
                        if (lecture.file_url) {
                            downloadableLectures.push(lecture);
                        }
                    });
                }
            });

            if (downloadableLectures.length === 0) {
                showToast('No downloadable files found in this course', 'warning');
                return;
            }

            const confirmed = await customConfirm(
                `Found ${downloadableLectures.length} file(s) to download. Do you want to proceed?`,
                'Download Course Content'
            );
            if (!confirmed) return;

            showToast(`Starting download of ${downloadableLectures.length} file(s)...`, 'info');

            for (let i = 0; i < downloadableLectures.length; i++) {
                const lecture = downloadableLectures[i];
                try {
                    const urlResponse = await streamingAPI.getAdminDownloadUrl(lecture.id);
                    const signedUrl = urlResponse.data.data.url;
                    
                    const link = document.createElement('a');
                    link.href = signedUrl;
                    link.setAttribute('download', lecture.title || 'lecture_file');
                    link.setAttribute('target', '_blank');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (err) {
                    console.error(`Failed to download lecture ${lecture.title}:`, err);
                    showToast(`Failed to download: ${lecture.title}`, 'error');
                }
            }
            showToast('All downloads initiated', 'success');
        } catch (error) {
            console.error('Error getting course content for download:', error);
            showToast('Failed to fetch course content', 'error');
        }
    };

    const openTransferModal = (course) => {
        setTransferSourceCourse(course);
        setIsTransferModalOpen(true);
    };

    const handleExecuteTransfer = async () => {
        if (!transferSourceCourse || !transferTargetCourseId) return;

        setIsTransferring(true);
        try {
            const response = await coursesAPI.transferContent(transferSourceCourse.id, transferTargetCourseId);
            showToast(response.data.message || 'Content transferred successfully!', 'success');
            setIsTransferModalOpen(false);
            setTransferSourceCourse(null);
            setTransferTargetCourseId('');
            fetchCourses();
        } catch (error) {
            console.error('Error transferring content:', error);
            const errMsg = error.response?.data?.message || 'Failed to transfer content';
            showToast(errMsg, 'error');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCourseIds(filteredCourses.map(c => c.id));
        } else {
            setSelectedCourseIds([]);
        }
    };

    const handleSelectCourse = (courseId, checked) => {
        if (checked) {
            setSelectedCourseIds(prev => [...prev, courseId]);
        } else {
            setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        const confirmed = await customConfirm(
            `Are you sure you want to set the status of ${selectedCourseIds.length} course(s) to "${status}"?`,
            'Bulk Update Status'
        );
        if (!confirmed) return;

        try {
            showToast('Updating courses status...', 'info');
            await coursesAPI.bulkUpdateStatus(selectedCourseIds, status);
            fetchCourses();
            setSelectedCourseIds([]);
            showToast('Courses updated successfully', 'success');
        } catch (error) {
            console.error('Error bulk updating status:', error);
            showToast('Failed to update courses status', 'error');
        }
    };

    const handleBulkDelete = async () => {
        const confirmed = await customConfirm(
            `Are you sure you want to delete ${selectedCourseIds.length} course(s)? This will delete all chapters, lectures, and B2 storage files. THIS ACTION CANNOT BE UNDONE!`,
            'Confirm Bulk Delete'
        );
        if (!confirmed) return;

        try {
            showToast('Deleting courses...', 'info');
            await coursesAPI.bulkDelete(selectedCourseIds);
            fetchCourses();
            setSelectedCourseIds([]);
            showToast('Courses deleted successfully', 'success');
        } catch (error) {
            console.error('Error bulk deleting courses:', error);
            showToast('Failed to bulk delete courses', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
        const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
        const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;
        return matchesSearch && matchesStatus && matchesCategory && matchesSemester;
    });

    const resetFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterCategory('all');
        setFilterSemester('all');
        setSelectedCourseIds([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Courses</h2>
                    <Link
                        href="/admin/courses/create"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add New Course
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="all">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Semester */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <select
                                value={filterSemester}
                                onChange={(e) => setFilterSemester(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="all">All Semesters</option>
                                {SEMESTERS.map(sem => (
                                    <option key={sem} value={sem}>{sem}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    {/* Active filters + Reset */}
                    {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterSemester !== 'all') && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                            {searchTerm && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded-full">Search: "{searchTerm}"</span>}
                            {filterCategory !== 'all' && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-1 rounded-full">Category: {filterCategory}</span>}
                            {filterSemester !== 'all' && <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full">Semester: {filterSemester}</span>}
                            {filterStatus !== 'all' && <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-1 rounded-full">Status: {filterStatus}</span>}
                            <button onClick={resetFilters} className="text-xs text-red-600 dark:text-red-400 hover:underline ml-1 cursor-pointer">Clear all</button>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Banner */}
                {selectedCourseIds.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-4 duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                Selected {selectedCourseIds.length} course(s)
                            </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => handleBulkStatusUpdate('active')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
                            >
                                Set Active
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('inactive')}
                                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
                            >
                                Set Inactive
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
                            >
                                Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedCourseIds([])}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2 cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Courses Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found</p>
                            <Link href="/admin/courses/create" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                                Create your first course
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-12">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredCourses.length > 0 && selectedCourseIds.length === filteredCourses.length}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semester</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredCourses.map((course) => (
                                        <tr key={course.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedCourseIds.includes(course.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCourseIds.includes(course.id)}
                                                    onChange={(e) => handleSelectCourse(course.id, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {(course.thumbnail_url || course.thumbnail) && (
                                                        <img
                                                            src={course.thumbnail_url || course.thumbnail}
                                                            alt={course.title}
                                                            className="h-12 w-12 rounded object-cover mr-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">{course.level}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-300">{course.category || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-300">{course.semester || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-300">₹{course.price}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-300">{course.validity_days || course.duration || '—'} days</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    course.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : course.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <div className="flex items-center space-x-2 relative justify-end">
                                                    <Link 
                                                        href={`/admin/courses/${course.id}`} 
                                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md text-xs font-semibold transition"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Link 
                                                        href={`/admin/courses/${course.id}/content`} 
                                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-semibold transition"
                                                    >
                                                        Content
                                                    </Link>
                                                    
                                                    <div className="relative inline-block text-left">
                                                        <button
                                                            onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {activeDropdown === course.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 origin-top-right">
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveDropdown(null);
                                                                            handleDownloadCourseContent(course);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                        </svg>
                                                                        Download Files
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveDropdown(null);
                                                                            openTransferModal(course);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                        </svg>
                                                                        Transfer Content
                                                                    </button>
                                                                    <hr className="border-gray-200 dark:border-gray-700 my-1" />
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveDropdown(null);
                                                                            handleDelete(course.id);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-2"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete Course
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Result count */}
                {!loading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Showing {filteredCourses.length} of {courses.length} courses
                    </p>
                )}

                {/* Transfer Course Content Modal */}
                {isTransferModalOpen && transferSourceCourse && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Transfer Course Content
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsTransferModalOpen(false);
                                        setTransferSourceCourse(null);
                                        setTransferTargetCourseId('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                {/* Source Course */}
                                <div>
                                    <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Source Course (Copy From)</span>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {transferSourceCourse.title}
                                    </div>
                                </div>

                                {/* Target Course Select */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Target Course (Copy To)</label>
                                    <select
                                        value={transferTargetCourseId}
                                        onChange={(e) => setTransferTargetCourseId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                                    >
                                        <option value="">Select Target Course...</option>
                                        {courses
                                            .filter(c => c.id !== transferSourceCourse.id)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                {/* Warning Alert */}
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-semibold mb-1">Important Note</p>
                                        <p>This action will duplicate all chapters and lectures (including video and PDF attachments) to the target course. Existing contents of the target course will not be modified.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTransferModalOpen(false);
                                        setTransferSourceCourse(null);
                                        setTransferTargetCourseId('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteTransfer}
                                    disabled={isTransferring || !transferTargetCourseId}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {isTransferring ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Transferring...
                                        </>
                                    ) : (
                                        'Confirm Transfer'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminCourses() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminCoursesContent />
        </ProtectedRoute>
    );
}
