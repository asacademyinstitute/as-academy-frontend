'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, chapterAPI, lectureAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Video, User } from 'lucide-react';
import { customAlert, customConfirm, customPrompt } from '@/components/ui/custom-modal';

function TeacherCourseManageContent() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingLink, setEditingLink] = useState(false);
    const [liveClassLink, setLiveClassLink] = useState('');
    const [liveClassSchedule, setLiveClassSchedule] = useState('');
    const [liveClassTitle, setLiveClassTitle] = useState('');

    // Preview state for video and PDF
    const [previewModal, setPreviewModal] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [params.id]);

    const fetchCourseData = async () => {
        try {
            const [courseRes, chaptersRes] = await Promise.all([
                coursesAPI.getById(params.id),
                chapterAPI.getByCourse(params.id),
            ]);
            setCourse(courseRes.data.data);
            setChapters(chaptersRes.data.data);
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChapter = async () => {
        const title = await customPrompt('Enter chapter title:', '', 'Add Chapter');
        if (!title) return;

        try {
            await chapterAPI.create({
                course_id: params.id,
                title,
                chapter_order: chapters.length + 1,
            });
            fetchCourseData();
        } catch (error) {
            await customAlert('Failed to create chapter', 'Error');
        }
    };

    const handleDeleteChapter = async (chapterId, chapterTitle) => {
        if (!await customConfirm(`Are you sure you want to delete chapter "${chapterTitle}" and all its lectures?`, 'Delete Chapter')) {
            return;
        }

        try {
            await chapterAPI.delete(chapterId);
            await customAlert('Chapter deleted successfully!', 'Success');
            await fetchCourseData();
        } catch (error) {
            console.error('Failed to delete chapter:', error);
            await customAlert(`Failed to delete chapter: ${error.response?.data?.message || error.message}`, 'Error');
        }
    };

    const handleAddLecture = async (chapterId) => {
        const title = await customPrompt('Enter lecture title:', '', 'Add Lecture');
        if (!title) return;

        // Validate title length
        if (title.trim().length < 3) {
            await customAlert('Title must be at least 3 characters long', 'Validation Error');
            return;
        }

        const type = await customPrompt('Enter lecture type (video/pdf):', 'video', 'Lecture Type');
        if (!type || !['video', 'pdf'].includes(type.toLowerCase())) {
            await customAlert('Invalid type. Please use: video or pdf', 'Validation Error');
            return;
        }

        try {
            // Find the chapter and calculate next lecture order
            const chapter = chapters.find(c => c.id === chapterId);
            const nextOrder = chapter?.lectures?.length ? chapter.lectures.length + 1 : 1;

            await lectureAPI.create({
                chapter_id: chapterId,
                title: title.trim(),
                type: type.toLowerCase(),
                lecture_order: nextOrder,
            });
            await fetchCourseData();
        } catch (error) {
            console.error('Failed to create lecture:', error);
            await customAlert(`Failed to create lecture: ${error.response?.data?.message || error.message}`, 'Error');
        }
    };

    const handleDeleteLecture = async (lectureId, lectureTitle) => {
        if (!await customConfirm(`Are you sure you want to delete "${lectureTitle}"?`, 'Delete Lecture')) {
            return;
        }

        try {
            await lectureAPI.delete(lectureId);
            await customAlert('Lecture deleted successfully!', 'Success');
            await fetchCourseData();
        } catch (error) {
            console.error('Failed to delete lecture:', error);
            await customAlert(`Failed to delete lecture: ${error.response?.data?.message || error.message}`, 'Error');
        }
    };

    const handleFileUpload = async (lectureId, event) => {
        const file = event.target.files[0];
        if (!file) return;

        // File size validation (500MB limit)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            await customAlert(`File is too large. Maximum size is 500MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'File Too Large');
            event.target.value = ''; // Reset input
            return;
        }

        // File type validation
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            await customAlert(`Invalid file type. Allowed types: MP4, WebM, OGG videos, or PDF. Your file type: ${file.type}`, 'Invalid File Type');
            event.target.value = ''; // Reset input
            return;
        }

        console.log('📤 Starting file upload:', {
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: file.type,
            lectureId
        });

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'lectures');

            console.log('Uploading to backend...');
            const response = await streamingAPI.uploadFile(formData);
            console.log('Upload response:', response.data);

            // Update lecture with file URL
            console.log('Updating lecture with file URL...');
            await lectureAPI.update(lectureId, {
                file_url: response.data.data.fileUrl,
            });

            console.log('✅ Upload complete! Refreshing data...');
            await fetchCourseData();
            await customAlert('File uploaded successfully!', 'Success');
        } catch (error) {
            console.error('❌ Upload failed:', error);

            // Show specific error message
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
            await customAlert(`Upload failed: ${errorMessage}`, 'Upload Failed');

            // Log detailed error for debugging
            if (error.response) {
                console.error('Server error:', {
                    status: error.response.status,
                    message: error.response.data?.message,
                    data: error.response.data
                });
            }
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    const handlePreview = async (lecture) => {
        if (!lecture.file_url) return;
        setPreviewLoading(true);
        try {
            let url = lecture.file_url;
            if (lecture.type === 'video') {
                const response = await streamingAPI.getVideoUrl(lecture.id);
                url = response.data.data.url;
            } else if (lecture.type === 'pdf') {
                const response = await streamingAPI.getPdfUrl(lecture.id);
                url = response.data.data.url;
            }
            setPreviewContent({ ...lecture, signed_url: url });
            setPreviewModal(lecture.type);
        } catch (error) {
            console.error('Error fetching preview URL:', error);
            await customAlert('Failed to load preview. Please try again.', 'Error');
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        setPreviewModal(null);
        setPreviewContent(null);
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

    const handleSaveLiveLink = async () => {
        if (!liveClassTitle || !liveClassLink || !liveClassSchedule) {
            await customAlert('Please fill in all fields', 'Validation Error');
            return;
        }

        try {
            await coursesAPI.update(params.id, {
                live_class_link: liveClassLink,
                live_class_scheduled_at: new Date(liveClassSchedule).toISOString(),
                live_class_title: liveClassTitle
            });
            await customAlert('Live class details updated successfully!', 'Success');
            setEditingLink(false);
            fetchCourseData();
        } catch (error) {
            await customAlert('Failed to update live class details', 'Error');
        }
    };

    const handleRemoveLiveLink = async () => {
        if (!await customConfirm('Are you sure you want to remove the live class link? This will clear all live class details.', 'Remove Live Class Link')) {
            return;
        }

        try {
            await coursesAPI.update(params.id, {
                live_class_link: null,
                live_class_scheduled_at: null,
                live_class_title: null
            });
            await customAlert('Live class link removed successfully!', 'Success');
            fetchCourseData();
        } catch (error) {
            await customAlert('Failed to remove live class link', 'Error');
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 md:pb-8">
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/teacher/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Header / Breadcrumb */}
            <div className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
                    <Link href="/teacher/dashboard" className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        ← Back to Dashboard
                    </Link>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="text-muted-foreground text-sm font-medium truncate">{course?.title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* Course Info */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{course?.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{course?.description}</p>
                </div>

                {/* Live Class Link Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">🎥 Live Class Link</h2>
                        {!editingLink && (
                            <button
                                onClick={() => {
                                    setEditingLink(true);
                                    setLiveClassLink(course?.live_class_link || '');
                                    setLiveClassSchedule(formatForDatetimeLocal(course?.live_class_scheduled_at));
                                    setLiveClassTitle(course?.live_class_title || '');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition w-full sm:w-auto"
                            >
                                {course?.live_class_link ? 'Update Link' : 'Add Link'}
                            </button>
                        )}
                    </div>

                    {editingLink ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Live Class Title *</label>
                                <input
                                    type="text"
                                    value={liveClassTitle}
                                    onChange={(e) => setLiveClassTitle(e.target.value)}
                                    placeholder="e.g., Introduction to React Hooks"
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meeting Link (Zoom, Google Meet, etc.)</label>
                                <input
                                    type="url"
                                    value={liveClassLink}
                                    onChange={(e) => setLiveClassLink(e.target.value)}
                                    placeholder="https://zoom.us/j/123456789"
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Scheduled Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={liveClassSchedule}
                                    onChange={(e) => setLiveClassSchedule(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Students will see when the live class is scheduled</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleSaveLiveLink} className="flex-1 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium transition">
                                    Save Link
                                </button>
                                <button onClick={() => { setEditingLink(false); setLiveClassLink(''); }} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {course?.live_class_link ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase mb-1">Current Live Class</div>
                                            {course.live_class_title && (
                                                <div className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">{course.live_class_title}</div>
                                            )}
                                            <a href={course.live_class_link} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm">
                                                {course.live_class_link}
                                            </a>
                                            {course.live_class_scheduled_at && (
                                                <div className="mt-1.5 text-sm text-blue-700 dark:text-blue-300">
                                                    <span className="font-medium">Scheduled: </span>
                                                    {new Date(course.live_class_scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={async () => { navigator.clipboard.writeText(course.live_class_link); await customAlert('Link copied!', 'Copied'); }}
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap font-medium">
                                                Copy
                                            </button>
                                            <button onClick={handleRemoveLiveLink}
                                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm whitespace-nowrap font-medium">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No live class link set for this course</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Course Content */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">📚 Course Content</h2>
                        <button onClick={handleAddChapter}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition w-full sm:w-auto">
                            + Add Chapter
                        </button>
                    </div>

                    {chapters.length > 0 ? (
                        <div className="space-y-5">
                            {chapters.map((chapter, chapterIdx) => (
                                <div key={chapter.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    {/* Chapter Header */}
                                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                            {chapterIdx + 1}. {chapter.title}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => handleAddLecture(chapter.id)}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium transition">
                                                + Add Lecture
                                            </button>
                                            <button onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium transition">
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lectures List */}
                                    {chapter.lectures && chapter.lectures.length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {chapter.lectures.map((lecture, lectureIdx) => (
                                                <div key={lecture.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                        </span>
                                                        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                                            {lecture.type}
                                                        </span>
                                                        {lecture.file_url && (
                                                            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                                                                ✓ Uploaded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        {/* Video Upload */}
                                                        {lecture.type === 'video' && (
                                                            <>
                                                                <label className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-blue-700 font-medium transition whitespace-nowrap">
                                                                    {lecture.file_url ? 'Replace Video' : 'Upload Video'}
                                                                    <input type="file" accept="video/*" className="hidden"
                                                                        onChange={(e) => handleFileUpload(lecture.id, e)} disabled={uploading} />
                                                                </label>
                                                                {lecture.file_url && (
                                                                    <button onClick={() => handlePreview(lecture)}
                                                                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-700 font-medium transition whitespace-nowrap">
                                                                        Preview
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {/* PDF Upload */}
                                                        {lecture.type === 'pdf' && (
                                                            <>
                                                                <label className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-blue-700 font-medium transition whitespace-nowrap">
                                                                    {lecture.file_url ? 'Replace PDF' : 'Upload PDF'}
                                                                    <input type="file" accept="application/pdf" className="hidden"
                                                                        onChange={(e) => handleFileUpload(lecture.id, e)} disabled={uploading} />
                                                                </label>
                                                                {lecture.file_url && (
                                                                    <button onClick={() => handlePreview(lecture)}
                                                                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-700 font-medium transition whitespace-nowrap">
                                                                        View PDF
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        <button onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                                                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 font-medium transition">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 dark:text-gray-500 text-sm px-4 py-4">No lectures yet. Add a lecture to get started.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">📂</div>
                            <p className="text-gray-500 dark:text-gray-400 mb-3 text-base">No chapters yet</p>
                            <button onClick={handleAddChapter} className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                                Create your first chapter
                            </button>
                        </div>
                    )}

                    {/* Uploading overlay */}
                    {uploading && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                                <p className="text-gray-900 dark:text-white font-medium">Uploading file...</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Please wait, do not close this tab</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Loading */}
                    {previewLoading && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Generating secure preview...</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Modal */}
                    {previewModal && previewContent && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closePreview}>
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-4xl w-full mx-auto max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">{previewContent.title}</h3>
                                    <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl flex-shrink-0">×</button>
                                </div>
                                {previewModal === 'video' && (
                                    <video src={previewContent.signed_url || previewContent.file_url} controls className="w-full rounded-lg" />
                                )}
                                {previewModal === 'pdf' && (
                                    <iframe src={previewContent.signed_url || previewContent.file_url} className="w-full h-[65vh] rounded-lg border border-gray-200 dark:border-gray-700" title="PDF Preview" />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TeacherCourseManage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherCourseManageContent />
        </ProtectedRoute>
    );
}
