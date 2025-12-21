'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentMobileNav from '@/components/StudentMobileNav';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { coursesAPI, chapterAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Dynamically import SecurePDFViewer with SSR disabled to avoid DOMMatrix error
const SecurePDFViewer = dynamic(() => import('@/components/SecurePDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center aspect-video bg-gray-100 rounded-lg">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF viewer...</p>
            </div>
        </div>
    ),
});

function CourseViewContent() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [watermark, setWatermark] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState({});

    useEffect(() => {
        fetchCourseData();
        fetchWatermark();
    }, [params.id]);

    const fetchCourseData = async () => {
        try {
            const [courseRes, chaptersRes] = await Promise.all([
                coursesAPI.getById(params.id),
                chapterAPI.getByCourse(params.id),
            ]);
            setCourse(courseRes.data.data);
            setChapters(chaptersRes.data.data);

            // Auto-expand first chapter and select first lecture
            if (chaptersRes.data.data.length > 0) {
                setExpandedChapters({ [chaptersRes.data.data[0].id]: true });
                if (chaptersRes.data.data[0].lectures?.length > 0) {
                    handleLectureSelect(chaptersRes.data.data[0].lectures[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWatermark = async () => {
        try {
            const response = await streamingAPI.getWatermark();
            setWatermark(response.data.data);
        } catch (error) {
            console.error('Error fetching watermark:', error);
        }
    };

    const handleLectureSelect = async (lecture) => {
        setSelectedLecture(lecture);
        setVideoUrl(null); // Reset video URL while loading

        if (lecture.file_url) {
            try {
                if (lecture.type === 'video') {
                    const response = await streamingAPI.getVideoUrl(lecture.id);
                    setVideoUrl(response.data.data.url);
                } else if (lecture.type === 'pdf') {
                    const response = await streamingAPI.getPdfStream(lecture.id);
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const objectUrl = URL.createObjectURL(blob);
                    setVideoUrl(objectUrl);
                }
            } catch (error) {
                console.error('Error fetching content URL:', error);
                alert('Failed to load content. Please try again.');
            }
        }
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => {
            // If clicking the same chapter, toggle it
            if (prev[chapterId]) {
                return { [chapterId]: false };
            }
            // Otherwise, close all and open only the clicked one
            return { [chapterId]: true };
        });
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading course...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <StudentMobileNav user={user} onLogout={handleLogout} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Course Title - Mobile */}
                <div className="mb-4 lg:hidden">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course?.title}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Video Player Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Video/PDF Player Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                            {selectedLecture ? (
                                <>
                                    {selectedLecture.file_url && videoUrl ? (
                                        <>
                                            {selectedLecture.type === 'video' && (
                                                <SecureVideoPlayer
                                                    videoUrl={videoUrl}
                                                    watermarkData={watermark}
                                                />
                                            )}
                                            {selectedLecture.type === 'pdf' && (
                                                <SecurePDFViewer
                                                    pdfUrl={videoUrl}
                                                    watermarkData={watermark}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                <span className="text-gray-500 dark:text-gray-400">Loading content...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lecture Info */}
                                    <div className="p-4 md:p-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                                {selectedLecture.title}
                                            </h2>
                                            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                {selectedLecture.type?.toUpperCase()}
                                            </span>
                                        </div>
                                        {selectedLecture.description && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                                                {selectedLecture.description}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Select a lecture to start learning</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Content Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden lg:sticky lg:top-4">
                            {/* Course Header */}
                            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {course?.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Live Class Link */}
                            {course?.live_class_link && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                                                {course.live_class_title || 'Live Class Available'}
                                            </h4>
                                            {course.live_class_scheduled_at && (
                                                <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                                                    {new Date(course.live_class_scheduled_at).toLocaleString('en-IN', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            )}
                                            <a
                                                href={course.live_class_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Join Live Class →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chapters List */}
                            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
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
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                                                    {chapter.title}
                                                </span>
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
                                            <div className="bg-gray-50 dark:bg-gray-800/50">
                                                {chapter.lectures.map((lecture, lectureIdx) => (
                                                    <button
                                                        key={lecture.id}
                                                        onClick={() => handleLectureSelect(lecture)}
                                                        className={`w-full px-4 md:px-6 py-3 flex items-center space-x-3 transition-all ${selectedLecture?.id === lecture.id
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                                                            }`}
                                                    >
                                                        {/* Lecture Icon */}
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${selectedLecture?.id === lecture.id
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                            }`}>
                                                            {lecture.type === 'video' ? (
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {/* Lecture Info */}
                                                        <div className="flex-1 text-left min-w-0">
                                                            <p className={`text-sm font-medium truncate ${selectedLecture?.id === lecture.id
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                            </p>
                                                        </div>

                                                        {/* Playing Indicator */}
                                                        {selectedLecture?.id === lecture.id && (
                                                            <div className="flex-shrink-0">
                                                                <div className="flex space-x-1">
                                                                    <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                                                                    <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                                    <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StudentCoursePage() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <CourseViewContent />
        </ProtectedRoute>
    );
}
