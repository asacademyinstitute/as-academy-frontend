'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/ProtectedRoute';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { coursesAPI, chapterAPI, streamingAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { ArrowLeft, PlayCircle, FileText, ChevronDown, ChevronRight, BookOpen, List, X } from 'lucide-react';

// Dynamically import SecurePDFViewer with SSR disabled to avoid DOMMatrix error
const SecurePDFViewer = dynamic(() => import('@/components/SecurePDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center aspect-video bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading PDF viewer...</p>
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
    const [lectureLoading, setLectureLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedChapters, setExpandedChapters] = useState({});
    const contentRef = useRef(null);

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
            const fetchedCourse = courseRes.data.data;
            if (fetchedCourse && fetchedCourse.enrollment) {
                const enrollment = fetchedCourse.enrollment;
                const isExpired = enrollment.status !== 'active' ||
                    (enrollment.valid_until && new Date(enrollment.valid_until) < new Date());

                if (isExpired) {
                    router.push(`/student/dashboard?expired=true&courseTitle=${encodeURIComponent(fetchedCourse.title)}`);
                    return;
                }
            }

            setCourse(fetchedCourse);
            const chapData = chaptersRes.data.data;
            setChapters(chapData);

            // Expand all chapters by default
            const expanded = {};
            chapData.forEach(ch => { expanded[ch.id] = true; });
            setExpandedChapters(expanded);

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
        // If same lecture already selected, do nothing
        if (selectedLecture?.id === lecture.id) {
            setSidebarOpen(false);
            return;
        }

        setSelectedLecture(lecture);
        setVideoUrl(null);
        setSidebarOpen(false);

        // Scroll to top of content on mobile
        if (contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (lecture.file_url) {
            setLectureLoading(true);
            try {
                if (lecture.type === 'video') {
                    const response = await streamingAPI.getVideoUrl(lecture.id);
                    setVideoUrl(response.data.data.url);
                } else if (lecture.type === 'pdf') {
                    const response = await streamingAPI.getPdfStream(lecture.id);
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const objectUrl = URL.createObjectURL(blob);
                    setVideoUrl(objectUrl);
                } else {
                    console.warn('Unknown lecture type:', lecture.type);
                }
            } catch (error) {
                console.error('Error fetching content URL:', error);
                alert('Failed to load content. Please try again.');
            } finally {
                setLectureLoading(false);
            }
        }
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
    };

    const getTotalLectures = () => chapters.reduce((sum, ch) => sum + (ch.lectures?.length || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-sm">Loading course...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

            {/* ── Top Header Bar ─────────────────────────────────────── */}
            <header className="bg-white dark:bg-gray-900 border-b border-border sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
                    <button
                        onClick={() => router.push('/student/dashboard')}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="flex-1 min-w-0 text-center">
                        <h1 className="text-sm font-semibold text-foreground truncate">{course?.title}</h1>
                    </div>

                    {/* Mobile: toggle sidebar */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <List className="w-4 h-4" />
                        <span>Content</span>
                    </button>
                </div>
            </header>

            {/* ── Main Layout ─────────────────────────────────────────── */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
                <div className="flex gap-6 items-start">

                    {/* ── Content Area (left / main) ──────────────────── */}
                    <div className="flex-1 min-w-0" ref={contentRef}>

                        {selectedLecture ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-border overflow-hidden">

                                {/* Player / viewer */}
                                {lectureLoading ? (
                                    <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                        <p className="text-gray-400 text-sm">Loading {selectedLecture.type === 'pdf' ? 'PDF' : 'video'}...</p>
                                    </div>
                                ) : selectedLecture.file_url && videoUrl ? (
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
                                    <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center gap-3">
                                        <FileText className="w-12 h-12 text-gray-600" />
                                        <p className="text-gray-400 text-sm">No content available for this lecture</p>
                                    </div>
                                )}

                                {/* Lecture info */}
                                <div className="p-5 md:p-6">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${selectedLecture.type === 'pdf' ? 'bg-orange-100 dark:bg-orange-950 text-orange-600' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'}`}>
                                            {selectedLecture.type === 'pdf'
                                                ? <FileText className="w-4 h-4" />
                                                : <PlayCircle className="w-4 h-4" />
                                            }
                                        </div>
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-foreground">
                                                {selectedLecture.title}
                                            </h2>
                                            {selectedLecture.description && (
                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                    {selectedLecture.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        ) : (
                            /* ── "Choose a Lecture" Welcome Screen ─── */
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-border overflow-hidden">
                                {/* Hero banner */}
                                <div className="aspect-video bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                                    {/* Decorative circles */}
                                    <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/5"></div>
                                    <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/5"></div>

                                    <div className="relative z-10">
                                        <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                            <BookOpen className="w-10 h-10 text-white" />
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                                            {course?.title}
                                        </h2>
                                        <p className="text-blue-100 text-sm md:text-base max-w-md">
                                            {getTotalLectures()} lectures • {chapters.length} chapters
                                        </p>
                                        <p className="text-blue-200 text-xs mt-3">
                                            👈 Select a lecture from the content list to start learning
                                        </p>
                                    </div>
                                </div>

                                {/* Course description */}
                                {course?.description && (
                                    <div className="p-5 md:p-6 border-t border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-2">About this course</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Desktop Sidebar ─────────────────────────────── */}
                    <aside className="hidden lg:block w-80 flex-shrink-0">
                        <SidebarContent
                            course={course}
                            chapters={chapters}
                            selectedLecture={selectedLecture}
                            expandedChapters={expandedChapters}
                            toggleChapter={toggleChapter}
                            handleLectureSelect={handleLectureSelect}
                            lectureLoading={lectureLoading}
                        />
                    </aside>
                </div>
            </div>

            {/* ── Mobile Sidebar Overlay ───────────────────────────────── */}
            {sidebarOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Drawer */}
                    <div className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white dark:bg-gray-900 z-50 lg:hidden shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="font-semibold text-foreground text-sm">Course Content</span>
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <SidebarContent
                                course={course}
                                chapters={chapters}
                                selectedLecture={selectedLecture}
                                expandedChapters={expandedChapters}
                                toggleChapter={toggleChapter}
                                handleLectureSelect={handleLectureSelect}
                                lectureLoading={lectureLoading}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Sidebar Component (shared by desktop + mobile drawer) ─── */
function SidebarContent({ course, chapters, selectedLecture, expandedChapters, toggleChapter, handleLectureSelect, lectureLoading }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-border overflow-hidden">
            {/* Course title */}
            <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
                <h3 className="font-bold text-foreground text-sm leading-snug">{course?.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {chapters.reduce((s, c) => s + (c.lectures?.length || 0), 0)} lectures
                </p>
            </div>

            {/* Live class */}
            {course?.live_class_link && (
                <div className="mx-3 mt-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-1">
                        📹 {course.live_class_title || 'Live Class Available'}
                    </p>
                    {course.live_class_scheduled_at && (
                        <p className="text-[10px] text-green-700 dark:text-green-500 mb-2">
                            {new Date(course.live_class_scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    )}
                    <a
                        href={course.live_class_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                        Join Live Class →
                    </a>
                </div>
            )}

            {/* Chapters list */}
            <div className="px-3 py-3 space-y-1.5">
                {chapters.map((chapter, chapterIdx) => (
                    <div key={chapter.id} className="rounded-xl overflow-hidden border border-border/50">
                        {/* Chapter header */}
                        <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                            <span className="text-xs font-semibold text-foreground leading-snug flex-1 pr-2">
                                {chapterIdx + 1}. {chapter.title}
                            </span>
                            {expandedChapters[chapter.id]
                                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            }
                        </button>

                        {/* Lectures */}
                        {expandedChapters[chapter.id] && chapter.lectures?.length > 0 && (
                            <div className="divide-y divide-border/30">
                                {chapter.lectures.map((lecture, lectureIdx) => {
                                    const isActive = selectedLecture?.id === lecture.id;
                                    const isPdf = lecture.type === 'pdf';
                                    return (
                                        <button
                                            key={lecture.id}
                                            onClick={() => handleLectureSelect(lecture)}
                                            disabled={lectureLoading && isActive}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all
                                                ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-950/40'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                                                ${isActive
                                                    ? isPdf ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                                                    : isPdf ? 'bg-orange-100 dark:bg-orange-950 text-orange-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                }`}
                                            >
                                                {isPdf
                                                    ? <FileText className="w-3.5 h-3.5" />
                                                    : <PlayCircle className="w-3.5 h-3.5" />
                                                }
                                            </div>

                                            {/* Title */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium leading-snug truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                                                    {chapterIdx + 1}.{lectureIdx + 1} {lecture.title}
                                                </p>
                                                <p className={`text-[10px] mt-0.5 ${isPdf ? 'text-orange-500' : 'text-gray-400'}`}>
                                                    {isPdf ? 'PDF' : 'Video'}
                                                </p>
                                            </div>

                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
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
