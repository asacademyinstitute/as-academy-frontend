'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, chapterAPI, streamingAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { customConfirm } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

const CATEGORIES = ['Diploma', 'BTech', 'BCA', 'MCA', 'Coding'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

// ── CSV / Excel export helper (no extra npm needed) ──────────────────────────
function exportToCSV(rows, filename) {
    if (!rows || rows.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
        headers.map(escape).join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ].join('\r\n');

    const BOM = '\uFEFF'; // UTF-8 BOM so Excel opens Hindi/special chars correctly
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function AdminCoursesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // ── Core state ──────────────────────────────────────────────────────────
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Transfer modal
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferSourceCourse, setTransferSourceCourse] = useState(null);
    const [transferTargetCourseId, setTransferTargetCourseId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    // Filters & bulk select
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);

    // ── NEW: Purchase counts & modal ────────────────────────────────────────
    const [purchaseCounts, setPurchaseCounts] = useState({}); // { courseId: number }
    const [purchaseModal, setPurchaseModal] = useState(null);  // null | { course, students[] }
    const [purchaseModalLoading, setPurchaseModalLoading] = useState(false);
    const [exportingAll, setExportingAll] = useState(false);

    // ── Fetch courses ───────────────────────────────────────────────────────
    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const [coursesRes] = await Promise.all([
                coursesAPI.getAll({ limit: 1000 }),
            ]);
            setCourses(coursesRes.data?.data?.courses || []);

            // Fetch purchase counts in background (non-blocking)
            enrollmentAPI.getAllCourseCounts()
                .then(res => setPurchaseCounts(res.data?.data || {}))
                .catch(() => {}); // silent fail — counts are bonus info
        } catch (error) {
            console.error('Error fetching courses:', error);
            showToast('Error fetching courses', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    // ── Purchase modal ──────────────────────────────────────────────────────
    const handleOpenPurchaseModal = async (course) => {
        setPurchaseModal({ course, students: null });
        setPurchaseModalLoading(true);
        try {
            const res = await enrollmentAPI.getCourseEnrollments(course.id);
            const enrollments = res.data?.data || [];
            setPurchaseModal({ course, students: enrollments });
        } catch (e) {
            showToast('Failed to load purchase data', 'error');
            setPurchaseModal(null);
        } finally {
            setPurchaseModalLoading(false);
        }
    };

    const handleExportCoursePurchases = (course, students) => {
        if (!students || students.length === 0) {
            showToast('No purchases to export for this course', 'warning');
            return;
        }
        const rows = students.map(enr => ({
            'Student Name': enr.users?.name || '—',
            'Email': enr.users?.email || '—',
            'Phone': enr.users?.phone || '—',
            'Purchase Date': formatDate(enr.enrolled_at),
            'Valid Until': enr.valid_until ? new Date(enr.valid_until).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—',
            'Payment Type': enr.payment_type || '—',
            'Status': enr.status || '—',
        }));
        const safeName = (course.title || 'course').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        exportToCSV(rows, `purchases_${safeName}_${new Date().toISOString().slice(0,10)}.csv`);
        showToast(`Exported ${rows.length} records`, 'success');
    };

    // ── Export ALL purchases across all courses ─────────────────────────────
    const handleExportAll = async () => {
        setExportingAll(true);
        try {
            const res = await enrollmentAPI.exportAll();
            const rows = res.data?.data || [];
            if (rows.length === 0) { showToast('No purchases found', 'warning'); return; }
            const exportRows = rows.map(r => ({
                'Course Title': r.course_title,
                'Category': r.course_category,
                'Semester': r.course_semester,
                'Course Price (₹)': r.course_price,
                'Student Name': r.student_name,
                'Email': r.student_email,
                'Phone': r.student_phone,
                'Purchase Date': r.purchase_date,
                'Valid Until': r.valid_until,
                'Payment Type': r.payment_type,
            }));
            exportToCSV(exportRows, `all_purchases_${new Date().toISOString().slice(0,10)}.csv`);
            showToast(`Exported ${exportRows.length} total purchases`, 'success');
        } catch (e) {
            showToast('Failed to export purchases', 'error');
        } finally {
            setExportingAll(false);
        }
    };

    // ── Existing handlers (unchanged) ───────────────────────────────────────
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
                        if (lecture.file_url) downloadableLectures.push(lecture);
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
                    showToast(`Failed to download: ${lecture.title}`, 'error');
                }
            }
            showToast('All downloads initiated', 'success');
        } catch (error) {
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
            showToast(error.response?.data?.message || 'Failed to transfer content', 'error');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleSelectAll = (e) => {
        setSelectedCourseIds(e.target.checked ? filteredCourses.map(c => c.id) : []);
    };

    const handleSelectCourse = (courseId, checked) => {
        setSelectedCourseIds(prev => checked ? [...prev, courseId] : prev.filter(id => id !== courseId));
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

    // Total purchases across all courses
    const totalPurchases = Object.values(purchaseCounts).reduce((sum, n) => sum + n, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── TOP HEADER with Export All button ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Courses</h2>
                        {totalPurchases > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Total purchases across all courses: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalPurchases}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* 📥 Export All Purchases */}
                        <button
                            onClick={handleExportAll}
                            disabled={exportingAll}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                        >
                            {exportingAll ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Exporting...</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export All Purchases</>
                            )}
                        </button>
                        <Link
                            href="/admin/courses/create"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                        >
                            + Add New Course
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                                <option value="all">All Categories</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                                <option value="all">All Semesters</option>
                                {SEMESTERS.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                    {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterSemester !== 'all') && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                            {searchTerm && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded-full">Search: &quot;{searchTerm}&quot;</span>}
                            {filterCategory !== 'all' && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-1 rounded-full">Category: {filterCategory}</span>}
                            {filterSemester !== 'all' && <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full">Semester: {filterSemester}</span>}
                            {filterStatus !== 'all' && <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-1 rounded-full">Status: {filterStatus}</span>}
                            <button onClick={resetFilters} className="text-xs text-red-600 dark:text-red-400 hover:underline ml-1 cursor-pointer">Clear all</button>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Banner */}
                {selectedCourseIds.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Selected {selectedCourseIds.length} course(s)</span>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button onClick={() => handleBulkStatusUpdate('active')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold transition cursor-pointer">Set Active</button>
                            <button onClick={() => handleBulkStatusUpdate('inactive')} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-semibold transition cursor-pointer">Set Inactive</button>
                            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition cursor-pointer">Delete Selected</button>
                            <button onClick={() => setSelectedCourseIds([])} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2 cursor-pointer">Clear Selection</button>
                        </div>
                    </div>
                )}

                {/* Courses Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found</p>
                            <Link href="/admin/courses/create" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">Create your first course</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-12">
                                            <input type="checkbox" onChange={handleSelectAll} checked={filteredCourses.length > 0 && selectedCourseIds.length === filteredCourses.length} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semester</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        {/* ✅ NEW COLUMN */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchases</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredCourses.map((course) => (
                                        <tr key={course.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedCourseIds.includes(course.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <input type="checkbox" checked={selectedCourseIds.includes(course.id)} onChange={(e) => handleSelectCourse(course.id, e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {(course.thumbnail_url || course.thumbnail) && (
                                                        <img src={course.thumbnail_url || course.thumbnail} alt={course.title} className="h-12 w-12 rounded object-cover mr-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">{course.level}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900 dark:text-gray-300">{course.category || '—'}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900 dark:text-gray-300">{course.semester || '—'}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-gray-300">₹{course.price}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-gray-300">{course.validity_days || course.duration || '—'} days</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    course.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : course.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>{course.status}</span>
                                            </td>
                                            {/* ✅ PURCHASES COLUMN */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleOpenPurchaseModal(course)}
                                                    title="Click to view buyer details"
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer
                                                        ${(purchaseCounts[course.id] || 0) > 0
                                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    {purchaseCounts[course.id] ?? '—'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <div className="flex items-center space-x-2 relative justify-end">
                                                    <Link href={`/admin/courses/${course.id}`} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md text-xs font-semibold transition">Edit</Link>
                                                    <Link href={`/admin/courses/${course.id}/content`} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-semibold transition">Content</Link>
                                                    <div className="relative inline-block text-left">
                                                        <button onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                                        </button>
                                                        {activeDropdown === course.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 origin-top-right">
                                                                    <button onClick={() => { setActiveDropdown(null); handleDownloadCourseContent(course); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                        Download Files
                                                                    </button>
                                                                    <button onClick={() => { setActiveDropdown(null); openTransferModal(course); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                                        Transfer Content
                                                                    </button>
                                                                    <hr className="border-gray-200 dark:border-gray-700 my-1" />
                                                                    <button onClick={() => { setActiveDropdown(null); handleDelete(course.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-2">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

                {!loading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Showing {filteredCourses.length} of {courses.length} courses
                    </p>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    PURCHASE DETAIL MODAL
                ══════════════════════════════════════════════════════════════ */}
                {purchaseModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setPurchaseModal(null); }}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Purchase Details
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{purchaseModal.course.title}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                    {purchaseModal.students && purchaseModal.students.length > 0 && (
                                        <button
                                            onClick={() => handleExportCoursePurchases(purchaseModal.course, purchaseModal.students)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Export Excel
                                        </button>
                                    )}
                                    <button onClick={() => setPurchaseModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto">
                                {purchaseModalLoading ? (
                                    <div className="flex justify-center items-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading purchases...</span>
                                    </div>
                                ) : !purchaseModal.students ? null : purchaseModal.students.length === 0 ? (
                                    <div className="text-center py-16">
                                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No purchases yet for this course</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Count badge */}
                                        <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">{purchaseModal.students.length}</span>
                                            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">student{purchaseModal.students.length !== 1 ? 's' : ''} purchased this course</span>
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-900/40 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">WhatsApp</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valid Until</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {purchaseModal.students.map((enr, idx) => {
                                                        const phone = (enr.users?.phone || '').replace(/\D/g, '');
                                                        const waPhone = phone.startsWith('91') ? phone : phone.length === 10 ? `91${phone}` : phone;
                                                        const waMsg = encodeURIComponent(`Hello ${enr.users?.name || 'Student'}! Your enrollment for "${purchaseModal.course.title}" is confirmed. 🎓`);
                                                        return (
                                                            <tr key={enr.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-sm text-gray-900 dark:text-white">{enr.users?.name || '—'}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <a href={`mailto:${enr.users?.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{enr.users?.email || '—'}</a>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {waPhone ? (
                                                                        <a
                                                                            href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.868L0 24l6.336-1.521A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.001-1.368l-.36-.213-3.729.895.924-3.639-.234-.374A9.818 9.818 0 012.182 12C2.182 6.587 6.587 2.182 12 2.182S21.818 6.587 21.818 12 17.413 21.818 12 21.818z"/></svg>
                                                                            Message
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">No phone</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(enr.enrolled_at)}</td>
                                                                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                                    {enr.valid_until ? new Date(enr.valid_until).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${enr.payment_type === 'online' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : enr.payment_type === 'offline' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                                        {enr.payment_type || 'online'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
                                <button onClick={() => setPurchaseModal(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Course Content Modal */}
                {isTransferModalOpen && transferSourceCourse && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    Transfer Course Content
                                </h3>
                                <button onClick={() => { setIsTransferModalOpen(false); setTransferSourceCourse(null); setTransferTargetCourseId(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Source Course (Copy From)</span>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">{transferSourceCourse.title}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Target Course (Copy To)</label>
                                    <select value={transferTargetCourseId} onChange={(e) => setTransferTargetCourseId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm">
                                        <option value="">Select Target Course...</option>
                                        {courses.filter(c => c.id !== transferSourceCourse.id).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    <div><p className="font-semibold mb-1">Important Note</p><p>This action will duplicate all chapters and lectures (including video and PDF attachments) to the target course. Existing contents of the target course will not be modified.</p></div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button type="button" onClick={() => { setIsTransferModalOpen(false); setTransferSourceCourse(null); setTransferTargetCourseId(''); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium">Cancel</button>
                                <button type="button" onClick={handleExecuteTransfer} disabled={isTransferring || !transferTargetCourseId} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed">
                                    {isTransferring ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Transferring...</>) : 'Confirm Transfer'}
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
