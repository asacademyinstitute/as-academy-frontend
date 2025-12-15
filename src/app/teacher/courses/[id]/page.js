'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { coursesAPI, chapterAPI, lectureAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function TeacherCourseManageContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
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
        const title = prompt('Enter chapter title:');
        if (!title) return;

        try {
            await chapterAPI.create({
                course_id: params.id,
                title,
                chapter_order: chapters.length + 1,
            });
            fetchCourseData();
        } catch (error) {
            alert('Failed to create chapter');
        }
    };

    const handleDeleteChapter = async (chapterId, chapterTitle) => {
        if (!confirm(`Are you sure you want to delete chapter "${chapterTitle}" and all its lectures?`)) {
            return;
        }

        try {
            await chapterAPI.delete(chapterId);
            alert('Chapter deleted successfully!');
            await fetchCourseData();
        } catch (error) {
            console.error('Failed to delete chapter:', error);
            alert(`Failed to delete chapter: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleAddLecture = async (chapterId) => {
        const title = prompt('Enter lecture title:');
        if (!title) return;

        // Validate title length
        if (title.trim().length < 3) {
            alert('Title must be at least 3 characters long');
            return;
        }

        const type = prompt('Enter lecture type (video/pdf):', 'video');
        if (!type || !['video', 'pdf'].includes(type.toLowerCase())) {
            alert('Invalid type. Please use: video or pdf');
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
            alert(`Failed to create lecture: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteLecture = async (lectureId, lectureTitle) => {
        if (!confirm(`Are you sure you want to delete "${lectureTitle}"?`)) {
            return;
        }

        try {
            await lectureAPI.delete(lectureId);
            alert('Lecture deleted successfully!');
            await fetchCourseData();
        } catch (error) {
            console.error('Failed to delete lecture:', error);
            alert(`Failed to delete lecture: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleFileUpload = async (lectureId, event) => {
        const file = event.target.files[0];
        if (!file) return;

        // File size validation (500MB limit)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            alert(`File is too large. Maximum size is 500MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            event.target.value = ''; // Reset input
            return;
        }

        // File type validation
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert(`Invalid file type. Allowed types: MP4, WebM, OGG videos, or PDF. Your file type: ${file.type}`);
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
            alert('File uploaded successfully!');
        } catch (error) {
            console.error('❌ Upload failed:', error);

            // Show specific error message
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
            alert(`Upload failed: ${errorMessage}`);

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

    const handlePreview = (lecture) => {
        setPreviewContent(lecture);
        setPreviewModal(lecture.type);
    };

    const closePreview = () => {
        setPreviewModal(null);
        setPreviewContent(null);
    };

    const handleSaveLiveLink = async () => {
        try {
            await coursesAPI.update(params.id, {
                live_class_link: liveClassLink,
                live_class_scheduled_at: liveClassSchedule || null,
                live_class_title: liveClassTitle || null
            });
            alert('Live class details updated successfully!');
            setEditingLink(false);
            fetchCourseData();
        } catch (error) {
            alert('Failed to update live class details');
        }
    };

    const handleRemoveLiveLink = async () => {
        if (!confirm('Are you sure you want to remove the live class link? This will clear all live class details.')) {
            return;
        }

        try {
            await coursesAPI.update(params.id, {
                live_class_link: null,
                live_class_scheduled_at: null,
                live_class_title: null
            });
            alert('Live class link removed successfully!');
            fetchCourseData();
        } catch (error) {
            alert('Failed to remove live class link');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

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
                    <p className="text-gray-600">{course?.description}</p>
                </div>

                {/* Live Class Link Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Live Class Link</h2>
                        {!editingLink && (
                            <button
                                onClick={() => {
                                    setEditingLink(true);
                                    setLiveClassLink(course?.live_class_link || '');
                                    setLiveClassSchedule(course?.live_class_scheduled_at || '');
                                    setLiveClassTitle(course?.live_class_title || '');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                            >
                                {course?.live_class_link ? 'Update Link' : 'Add Link'}
                            </button>
                        )}
                    </div>

                    {editingLink ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Live Class Title *
                                </label>
                                <input
                                    type="text"
                                    value={liveClassTitle}
                                    onChange={(e) => setLiveClassTitle(e.target.value)}
                                    placeholder="e.g., Introduction to React Hooks"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meeting Link (Zoom, Google Meet, etc.)
                                </label>
                                <input
                                    type="url"
                                    value={liveClassLink}
                                    onChange={(e) => setLiveClassLink(e.target.value)}
                                    placeholder="https://zoom.us/j/123456789"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Scheduled Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={liveClassSchedule}
                                    onChange={(e) => setLiveClassSchedule(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">Students will see when the live class is scheduled</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleSaveLiveLink}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Save Link
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingLink(false);
                                        setLiveClassLink('');
                                    }}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {course?.live_class_link ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm text-blue-800 font-medium mb-1">Current Live Class:</div>
                                            {course.live_class_title && (
                                                <div className="text-base font-semibold text-blue-900 mb-2">
                                                    {course.live_class_title}
                                                </div>
                                            )}
                                            <a
                                                href={course.live_class_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 underline break-all text-sm"
                                            >
                                                {course.live_class_link}
                                            </a>
                                            {course.live_class_scheduled_at && (
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <span className="font-medium">Scheduled:</span>{' '}
                                                    {new Date(course.live_class_scheduled_at).toLocaleString('en-IN', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(course.live_class_link);
                                                    alert('Link copied to clipboard!');
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                                            >
                                                Copy Link
                                            </button>
                                            <button
                                                onClick={handleRemoveLiveLink}
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm whitespace-nowrap"
                                            >
                                                Remove Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                    <p className="text-gray-500">No live class link set for this course</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Course Content */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
                        <button
                            onClick={handleAddChapter}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            + Add Chapter
                        </button>
                    </div>

                    {chapters.length > 0 ? (
                        <div className="space-y-6">
                            {chapters.map((chapter, chapterIdx) => (
                                <div key={chapter.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {chapterIdx + 1}. {chapter.title}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleAddLecture(chapter.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                                            >
                                                + Add Lecture
                                            </button>
                                            <button
                                                onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                                            >
                                                Delete Chapter
                                            </button>
                                        </div>
                                    </div>

                                    {chapter.lectures && chapter.lectures.length > 0 ? (
                                        <div className="space-y-3 ml-6">
                                            {chapter.lectures.map((lecture, lectureIdx) => (
                                                <div key={lecture.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                                    <div className="flex-1">
                                                        <span className="text-gray-900">
                                                            {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                        </span>
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({lecture.type})
                                                        </span>
                                                        {lecture.file_url && (
                                                            <span className="ml-2 text-xs text-green-600">
                                                                ✓ {lecture.type === 'video' ? 'Video' : 'PDF'} uploaded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {/* Video Upload */}
                                                        {lecture.type === 'video' && (
                                                            <>
                                                                <label className="bg-blue-600 text-white px-4 py-2 rounded text-sm cursor-pointer hover:bg-blue-700">
                                                                    {lecture.file_url ? 'Replace Video' : 'Upload Video'}
                                                                    <input
                                                                        type="file"
                                                                        accept="video/*"
                                                                        className="hidden"
                                                                        onChange={(e) => handleFileUpload(lecture.id, e)}
                                                                        disabled={uploading}
                                                                    />
                                                                </label>
                                                                {lecture.file_url && (
                                                                    <button
                                                                        onClick={() => handlePreview(lecture)}
                                                                        className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                                                                    >
                                                                        Preview Video
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* PDF Upload */}
                                                        {lecture.type === 'pdf' && (
                                                            <>
                                                                <label className="bg-blue-600 text-white px-4 py-2 rounded text-sm cursor-pointer hover:bg-blue-700">
                                                                    {lecture.file_url ? 'Replace PDF' : 'Upload PDF'}
                                                                    <input
                                                                        type="file"
                                                                        accept="application/pdf"
                                                                        className="hidden"
                                                                        onChange={(e) => handleFileUpload(lecture.id, e)}
                                                                        disabled={uploading}
                                                                    />
                                                                </label>
                                                                {lecture.file_url && (
                                                                    <button
                                                                        onClick={() => handlePreview(lecture)}
                                                                        className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                                                                    >
                                                                        View PDF
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                                                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm ml-6">No lectures yet</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No chapters yet</p>
                            <button
                                onClick={handleAddChapter}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Create your first chapter
                            </button>
                        </div>
                    )}

                    {uploading && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-900">Uploading file...</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Modals */}
                    {previewModal && previewContent && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closePreview}>
                            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">{previewContent.title}</h3>
                                    <button
                                        onClick={closePreview}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Video Preview */}
                                {previewModal === 'video' && (
                                    <video
                                        src={previewContent.file_url}
                                        controls
                                        className="w-full rounded"
                                    />
                                )}

                                {/* PDF Preview */}
                                {previewModal === 'pdf' && (
                                    <iframe
                                        src={previewContent.file_url}
                                        className="w-full h-[70vh] rounded border"
                                        title="PDF Preview"
                                    />
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
