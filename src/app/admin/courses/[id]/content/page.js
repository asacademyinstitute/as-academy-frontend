'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { coursesAPI, chapterAPI, lectureAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function AdminCourseContentContent() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLectures, setSelectedLectures] = useState([]);
    const [transferring, setTransferring] = useState(false);
    const [courses, setCourses] = useState([]);
    const [targetCourseId, setTargetCourseId] = useState('');
    const [expandedChapters, setExpandedChapters] = useState({});

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const [courseRes, chaptersRes, coursesRes] = await Promise.all([
                coursesAPI.getById(params.id),
                chapterAPI.getByCourse(params.id),
                coursesAPI.getAll({ status: 'active' }),
            ]);
            setCourse(courseRes.data.data);
            setChapters(chaptersRes.data.data || []);
            setCourses(coursesRes.data.data.courses.filter(c => c.id !== params.id) || []);

            // Auto-expand all chapters
            const expanded = {};
            chaptersRes.data.data.forEach(chapter => {
                expanded[chapter.id] = true;
            });
            setExpandedChapters(expanded);
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

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterId]: !prev[chapterId]
        }));
    };

    const handleLectureSelect = (lectureId) => {
        setSelectedLectures(prev => {
            if (prev.includes(lectureId)) {
                return prev.filter(id => id !== lectureId);
            }
            return [...prev, lectureId];
        });
    };

    const handleSelectAll = () => {
        const allLectureIds = chapters.flatMap(chapter =>
            chapter.lectures?.map(lecture => lecture.id) || []
        );
        setSelectedLectures(allLectureIds);
    };

    const handleDeselectAll = () => {
        setSelectedLectures([]);
    };

    const handleDownload = async (lecture) => {
        if (!lecture.file_url) {
            alert('No file URL available for this lecture');
            return;
        }

        try {
            // Open file URL in new tab for download
            window.open(lecture.file_url, '_blank');
        } catch (error) {
            console.error('Error downloading lecture:', error);
            alert('Failed to download lecture');
        }
    };

    const handleTransfer = async () => {
        if (selectedLectures.length === 0) {
            alert('Please select at least one lecture to transfer');
            return;
        }

        if (!targetCourseId) {
            alert('Please select a target course');
            return;
        }

        if (!confirm(`Are you sure you want to transfer ${selectedLectures.length} lecture(s) to the selected course?`)) {
            return;
        }

        setTransferring(true);
        try {
            // Note: This would require a backend API endpoint
            // For now, we'll show a message that this feature needs backend support
            alert('Transfer functionality requires backend API implementation. Please contact the developer to add the transfer endpoint.');

            // TODO: Implement when backend API is ready
            // await lectureAPI.transfer({
            //     lecture_ids: selectedLectures,
            //     target_course_id: targetCourseId
            // });

            // setSelectedLectures([]);
            // setTargetCourseId('');
            // fetchData();
        } catch (error) {
            console.error('Error transferring lectures:', error);
            alert('Failed to transfer lectures');
        } finally {
            setTransferring(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalLectures = chapters.reduce((sum, chapter) => sum + (chapter.lectures?.length || 0), 0);

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/admin/courses"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 inline-block"
                    >
                        ← Back to Courses
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {course?.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {chapters.length} Chapters • {totalLectures} Lectures
                    </p>
                </div>

                {/* Bulk Actions */}
                {selectedLectures.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-blue-900 dark:text-blue-100">
                                    {selectedLectures.length} lecture(s) selected
                                </p>
                                <button
                                    onClick={handleDeselectAll}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    Deselect all
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <select
                                    value={targetCourseId}
                                    onChange={(e) => setTargetCourseId(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select target course...</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleTransfer}
                                    disabled={transferring || !targetCourseId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {transferring ? 'Transferring...' : 'Transfer Selected'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Select All Button */}
                {totalLectures > 0 && (
                    <div className="mb-4">
                        <button
                            onClick={handleSelectAll}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                            Select All Lectures
                        </button>
                    </div>
                )}

                {/* Chapters and Lectures */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                    {chapters.length > 0 ? (
                        <div>
                            {chapters.map((chapter, chapterIdx) => (
                                <div key={chapter.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                    {/* Chapter Header */}
                                    <button
                                        onClick={() => toggleChapter(chapter.id)}
                                        className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3 flex-1 text-left">
                                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                                                {chapterIdx + 1}
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base block">
                                                    {chapter.title}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {chapter.lectures?.length || 0} lectures
                                                </span>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedChapters[chapter.id] ? 'transform rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Lectures List */}
                                    {expandedChapters[chapter.id] && chapter.lectures && chapter.lectures.length > 0 && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 md:p-4">
                                            <div className="space-y-2">
                                                {chapter.lectures.map((lecture, lectureIdx) => (
                                                    <div
                                                        key={lecture.id}
                                                        className="bg-white dark:bg-gray-700 rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Checkbox */}
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLectures.includes(lecture.id)}
                                                                onChange={() => handleLectureSelect(lecture.id)}
                                                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />

                                                            {/* Lecture Icon */}
                                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                {lecture.type === 'video' ? (
                                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            {/* Lecture Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                                                                    {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                                </p>
                                                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                    {lecture.type === 'video' ? 'Video' : 'PDF'} Lecture
                                                                    {lecture.file_url && ' • Has file'}
                                                                </p>
                                                            </div>

                                                            {/* Download Button */}
                                                            <button
                                                                onClick={() => handleDownload(lecture)}
                                                                disabled={!lecture.file_url}
                                                                className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No content available for this course</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminCourseContentPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminCourseContentContent />
        </ProtectedRoute>
    );
}
