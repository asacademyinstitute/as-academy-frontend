'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { coursesAPI, chapterAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Dynamically import SecurePDFViewer with SSR disabled to avoid DOMMatrix error
const SecurePDFViewer = dynamic(() => import('@/components/SecurePDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center aspect-video bg-gray-100">
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
    const { user } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [watermark, setWatermark] = useState(null);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);

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

            // Auto-select first lecture
            if (chaptersRes.data.data.length > 0 && chaptersRes.data.data[0].lectures?.length > 0) {
                handleLectureSelect(chaptersRes.data.data[0].lectures[0]);
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

        if (lecture.file_url) {
            try {
                // Call appropriate API based on lecture type
                if (lecture.type === 'video') {
                    // For video, get signed URL
                    const response = await streamingAPI.getVideoUrl(lecture.id);
                    setVideoUrl(response.data.data.url);
                } else if (lecture.type === 'pdf') {
                    // For PDF, fetch stream as blob to bypass CORS/Auth issues
                    console.log('Fetching PDF stream...');
                    const response = await streamingAPI.getPdfStream(lecture.id);
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const objectUrl = URL.createObjectURL(blob);
                    console.log('PDF Blob URL created:', objectUrl);
                    setVideoUrl(objectUrl);
                } else {
                    console.warn('Unknown lecture type:', lecture.type);
                    return;
                }
            } catch (error) {
                console.error('Error fetching content URL:', error);
                alert('Failed to load content. Please try again.');
            }
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
                    <button
                        onClick={() => router.push('/student/dashboard')}
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Video Player */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {selectedLecture ? (
                                <>
                                    {selectedLecture.file_url && videoUrl ? (
                                        <>
                                            {/* Video Player - Only for video type */}
                                            {selectedLecture.type === 'video' && (
                                                <SecureVideoPlayer
                                                    videoUrl={videoUrl}
                                                    watermarkData={watermark}
                                                />
                                            )}

                                            {/* PDF Viewer - Only for PDF type */}
                                            {selectedLecture.type === 'pdf' && (
                                                <SecurePDFViewer
                                                    pdfUrl={videoUrl}
                                                    watermarkData={watermark}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="aspect-video bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-500">No content available</span>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            {selectedLecture.title}
                                        </h2>
                                        {selectedLecture.description && (
                                            <p className="text-gray-600">{selectedLecture.description}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500">Select a lecture to start</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Content Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-bold mb-4">{course?.title}</h3>

                            {/* Live Class Link */}
                            {course?.live_class_link && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-green-800 mb-1">
                                                {course.live_class_title || 'Live Class Available'}
                                            </h4>
                                            {course.live_class_scheduled_at && (
                                                <p className="text-xs text-green-700 mb-2">
                                                    <span className="font-medium">Scheduled:</span>{' '}
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
                                                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition"
                                            >
                                                Join Live Class →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {chapters.map((chapter, chapterIdx) => (
                                    <div key={chapter.id} className="border-b pb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">
                                            {chapterIdx + 1}. {chapter.title}
                                        </h4>
                                        {chapter.lectures && chapter.lectures.length > 0 && (
                                            <div className="space-y-2 ml-4">
                                                {chapter.lectures.map((lecture, lectureIdx) => (
                                                    <button
                                                        key={lecture.id}
                                                        onClick={() => handleLectureSelect(lecture)}
                                                        className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedLecture?.id === lecture.id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'hover:bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <span className="text-sm">
                                                                {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                            </span>
                                                        </div>
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
