'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function SecurePDFViewer({ pdfUrl, watermarkData }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const [pdf, setPdf] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Zoom & scale states
    const [scale, setScale] = useState(1.0);
    const [fitScale, setFitScale] = useState(1.0);
    const [hasZoomed, setHasZoomed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Interactive UI states
    const [pageInput, setPageInput] = useState('');
    const [showPageInput, setShowPageInput] = useState(false);
    const [pageTurnFeedback, setPageTurnFeedback] = useState(null); // 'next' | 'prev' | null
    const [showHint, setShowHint] = useState(true);

    // Visual transform during active pinch gesture (for 60fps buttery zoom without lagging canvas render)
    const [gestureTransform, setGestureTransform] = useState({ scale: 1, originX: 50, originY: 50 });
    const isPinchingRef = useRef(false);

    // Drag-to-pan state (mouse on desktop)
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isGrabbing, setIsGrabbing] = useState(false);

    // Touch gesture tracking
    const touchStateRef = useRef({
        startX: 0,
        startY: 0,
        startTime: 0,
        lastTapTime: 0,
        initialDist: 0,
        startScale: 1,
        isSwiping: false,
    });

    // ─── 1. Load PDF Document ──────────────────────────────────────────────────
    useEffect(() => {
        if (!pdfUrl) return;

        let createdBlobUrl = null;

        const loadPDF = async () => {
            try {
                setLoading(true);
                setError(null);

                const pdfjsLib = await import('pdfjs-dist');

                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                        'pdfjs-dist/build/pdf.worker.min.mjs',
                        import.meta.url
                    ).toString();
                }

                let targetUrl = pdfUrl;

                if (!pdfUrl.startsWith('blob:')) {
                    const response = await fetch(pdfUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF (${response.status}: ${response.statusText})`);
                    }
                    const blob = await response.blob();
                    createdBlobUrl = URL.createObjectURL(blob);
                    targetUrl = createdBlobUrl;
                }

                const loadingTask = pdfjsLib.getDocument({
                    url: targetUrl,
                    withCredentials: false
                });

                const pdfDoc = await loadingTask.promise;

                setPdf(pdfDoc);
                setTotalPages(pdfDoc.numPages);
                setCurrentPage(1);
                setLoading(false);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError(err.message || 'Failed to load PDF');
                setLoading(false);
            }
        };

        loadPDF();

        return () => {
            if (createdBlobUrl) {
                URL.revokeObjectURL(createdBlobUrl);
            }
        };
    }, [pdfUrl]);

    // ─── 2. Auto-Fit Page to Container Width ──────────────────────────────────
    useEffect(() => {
        if (!pdf || !containerRef.current || hasZoomed) return;

        const calculateFitScale = async () => {
            try {
                const page = await pdf.getPage(currentPage);
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const containerWidth = containerRef.current.clientWidth - 16; // accounting for padding
                const targetWidth = Math.max(300, containerWidth);
                const calculated = Number((targetWidth / unscaledViewport.width).toFixed(2));
                setFitScale(calculated);
                setScale(calculated);
            } catch (err) {
                console.error('Error auto-scaling PDF:', err);
            }
        };

        calculateFitScale();

        const handleResize = () => {
            if (!hasZoomed) calculateFitScale();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pdf, currentPage, hasZoomed]);

    // ─── 3. Apply Security Watermark ──────────────────────────────────────────
    const applyWatermark = useCallback((context, width, height) => {
        if (!watermarkData) return;
        const { email, phone } = watermarkData;
        const watermarkText = `${email || ''} | ${phone || ''}`.trim();
        if (!watermarkText || watermarkText === '|') return;

        context.save();
        context.globalAlpha = 0.22;
        context.font = 'bold 30px Arial, sans-serif';
        context.fillStyle = '#222222';
        context.textAlign = 'center';

        const angle = -30 * (Math.PI / 180);
        context.translate(width / 2, height / 2);
        context.rotate(angle);

        const spacing = 680;
        const rows = Math.ceil(height / spacing) + 1;
        const cols = Math.ceil(width / spacing) + 1;

        for (let r = -rows; r <= rows; r++) {
            for (let c = -cols; c <= cols; c++) {
                context.fillText(watermarkText, c * spacing, r * spacing);
            }
        }
        context.restore();
    }, [watermarkData]);

    // ─── 4. Render Current Page onto Canvas ────────────────────────────────────
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        let renderTask = null;
        let isCancelled = false;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(currentPage);
                if (isCancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                const viewport = page.getViewport({ scale });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });

                await renderTask.promise;

                if (!isCancelled) {
                    applyWatermark(context, canvas.width, canvas.height);
                }
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('Error rendering PDF page:', err);
                }
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [pdf, currentPage, scale, applyWatermark]);

    // ─── 5. Navigation Triggers with Visual Animation Feedback ─────────────────
    const triggerPageChange = useCallback((direction) => {
        if (direction === 'next') {
            setCurrentPage((prev) => {
                if (prev < totalPages) {
                    setPageTurnFeedback('next');
                    setTimeout(() => setPageTurnFeedback(null), 300);
                    // Reset scroll to top
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0;
                        scrollContainerRef.current.scrollLeft = 0;
                    }
                    return prev + 1;
                }
                return prev;
            });
        } else if (direction === 'prev') {
            setCurrentPage((prev) => {
                if (prev > 1) {
                    setPageTurnFeedback('prev');
                    setTimeout(() => setPageTurnFeedback(null), 300);
                    // Reset scroll to top
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0;
                        scrollContainerRef.current.scrollLeft = 0;
                    }
                    return prev - 1;
                }
                return prev;
            });
        }
    }, [totalPages]);

    // ─── 6. Keyboard Shortcuts Navigation ──────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Block Ctrl+P (Print)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                return false;
            }
            // Block Ctrl+S (Save)
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                return false;
            }

            // If user is typing in page jump input, don't hijack keys
            if (e.target.tagName === 'INPUT') return;

            // Page navigation keys
            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                triggerPageChange('next');
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                triggerPageChange('prev');
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                setScale(s => {
                    setHasZoomed(true);
                    return Math.min(Number((s + 0.25).toFixed(2)), 4.0);
                });
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                setScale(s => {
                    setHasZoomed(true);
                    return Math.max(Number((s - 0.25).toFixed(2)), 0.5);
                });
            } else if (e.key === '0') {
                e.preventDefault();
                setHasZoomed(false);
                setScale(fitScale);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [triggerPageChange, fitScale]);

    // ─── 7. Fullscreen Change Listener ─────────────────────────────────────────
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen toggle error:', err);
        }
    };

    // ─── 8. Mouse Wheel Zoom (Ctrl + Wheel) ────────────────────────────────────
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                setScale(prev => {
                    const next = Math.min(4.0, Math.max(0.5, prev + delta));
                    setHasZoomed(true);
                    return Number(next.toFixed(2));
                });
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    // ─── 9. Desktop Mouse Drag to Pan ──────────────────────────────────────────
    const handleMouseDown = (e) => {
        const el = scrollContainerRef.current;
        if (!el) return;

        // Only pan if content overflows container
        if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
            isDraggingRef.current = true;
            setIsGrabbing(true);
            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: el.scrollLeft,
                scrollTop: el.scrollTop,
            };
        }
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
        scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsGrabbing(false);
    };

    // ─── 10. Touch Gestures: Pinch-to-Zoom + Swipe Navigation + Double-Tap ─────
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const getDistance = (touch1, touch2) => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getMidpoint = (touch1, touch2, rect) => {
            const x = ((touch1.clientX + touch2.clientX) / 2 - rect.left) / rect.width * 100;
            const y = ((touch1.clientY + touch2.clientY) / 2 - rect.top) / rect.height * 100;
            return { x, y };
        };

        const handleTouchStart = (e) => {
            const touch = touchStateRef.current;

            if (e.touches.length === 2) {
                // Multi-touch: Start Pinch
                isPinchingRef.current = true;
                touch.initialDist = getDistance(e.touches[0], e.touches[1]);
                touch.startScale = scale;
                touch.isSwiping = false;

                const rect = el.getBoundingClientRect();
                const mid = getMidpoint(e.touches[0], e.touches[1], rect);
                setGestureTransform({ scale: 1, originX: mid.x, originY: mid.y });
            } else if (e.touches.length === 1) {
                // Single touch: Track for Swipe or Double-Tap
                isPinchingRef.current = false;
                touch.startX = e.touches[0].clientX;
                touch.startY = e.touches[0].clientY;
                touch.startTime = Date.now();
                touch.isSwiping = true;

                // Double-Tap detection (< 300ms between taps)
                const now = Date.now();
                if (now - touch.lastTapTime < 300) {
                    // Double tap detected!
                    if (scale > fitScale * 1.15) {
                        // Reset to fit
                        setHasZoomed(false);
                        setScale(fitScale);
                    } else {
                        // Zoom in to 1.8x
                        setHasZoomed(true);
                        setScale(Number((fitScale * 1.8).toFixed(2)));
                    }
                    touch.lastTapTime = 0;
                    touch.isSwiping = false;
                } else {
                    touch.lastTapTime = now;
                }
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && isPinchingRef.current) {
                // Prevent browser zoom, update CSS transform for 60fps buttery preview
                e.preventDefault();
                const touch = touchStateRef.current;
                const newDist = getDistance(e.touches[0], e.touches[1]);
                const ratio = newDist / (touch.initialDist || 1);

                setGestureTransform(prev => ({
                    ...prev,
                    scale: Math.min(3.5, Math.max(0.6, ratio))
                }));
            }
        };

        const handleTouchEnd = (e) => {
            const touch = touchStateRef.current;

            // Commit pinch zoom when 2-finger gesture ends
            if (isPinchingRef.current && e.touches.length < 2) {
                isPinchingRef.current = false;
                setGestureTransform(prev => {
                    const finalRatio = prev.scale;
                    if (Math.abs(finalRatio - 1) > 0.05) {
                        const newScale = Number((touch.startScale * finalRatio).toFixed(2));
                        const boundedScale = Math.min(4.0, Math.max(0.5, newScale));
                        setScale(boundedScale);
                        setHasZoomed(true);
                    }
                    return { scale: 1, originX: 50, originY: 50 };
                });
            }

            // Handle horizontal swipe navigation
            if (touch.isSwiping && e.changedTouches.length === 1) {
                const endTouch = e.changedTouches[0];
                const dx = endTouch.clientX - touch.startX;
                const dy = endTouch.clientY - touch.startY;
                const duration = Date.now() - touch.startTime;

                // Check if gesture is primarily horizontal and swift (>45px, more X than Y)
                const isHorizontal = Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && duration < 600;

                if (isHorizontal) {
                    const isAtLeftEdge = el.scrollLeft <= 12;
                    const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 12;
                    const isNotZoomed = el.scrollWidth <= el.clientWidth + 20;

                    if (dx < 0 && (isAtRightEdge || isNotZoomed)) {
                        // Swiped Left -> Go to Next Page
                        triggerPageChange('next');
                    } else if (dx > 0 && (isAtLeftEdge || isNotZoomed)) {
                        // Swiped Right -> Go to Prev Page
                        triggerPageChange('prev');
                    }
                }
                touch.isSwiping = false;
            }
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [scale, fitScale, triggerPageChange]);

    // ─── 11. Page Jump Direct Input ────────────────────────────────────────────
    const handlePageSubmit = (e) => {
        e.preventDefault();
        const p = parseInt(pageInput, 10);
        if (p >= 1 && p <= totalPages) {
            setCurrentPage(p);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
                scrollContainerRef.current.scrollLeft = 0;
            }
        }
        setShowPageInput(false);
        setPageInput('');
    };

    // ─── Loading State ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[420px] bg-gray-50 dark:bg-gray-900 rounded-2xl border border-border">
                <div className="text-center p-6">
                    <div className="relative w-14 h-14 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                        <div className="w-14 h-14 rounded-full border-4 border-t-transparent border-blue-600 dark:border-blue-400 animate-spin"></div>
                    </div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">Loading Protected PDF</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Preparing secure viewing canvas...</p>
                </div>
            </div>
        );
    }

    // ─── Error State ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[380px] bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6">
                <div className="text-center max-w-md">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                        ⚠️
                    </div>
                    <h3 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">Failed to Load PDF</h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    // ─── Main Viewer UI ────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className={`relative bg-gray-100 dark:bg-gray-950 border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col select-none ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : ''
            }`}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            {/* ── Top Header Toolbar ────────────────────────────────────────── */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-border px-3.5 py-2.5 flex items-center justify-between gap-2 z-20">

                {/* Left: Page Navigation with Quick Jump */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => triggerPageChange('prev')}
                        disabled={currentPage === 1}
                        title="Previous page (Swipe right or Left Arrow)"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-700 dark:text-gray-200 shadow-xs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {showPageInput ? (
                        <form onSubmit={handlePageSubmit} className="inline-flex">
                            <input
                                autoFocus
                                type="number"
                                min={1}
                                max={totalPages}
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                onBlur={() => { setShowPageInput(false); setPageInput(''); }}
                                placeholder={String(currentPage)}
                                className="w-16 text-center text-xs font-bold border-2 border-blue-500 rounded-xl px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                            />
                        </form>
                    ) : (
                        <button
                            onClick={() => { setShowPageInput(true); setPageInput(String(currentPage)); }}
                            title="Click to jump to page"
                            className="px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition min-w-[72px] text-center border border-transparent hover:border-border"
                        >
                            Page <span className="font-bold text-blue-600 dark:text-blue-400">{currentPage}</span> / {totalPages}
                        </button>
                    )}

                    <button
                        onClick={() => triggerPageChange('next')}
                        disabled={currentPage === totalPages}
                        title="Next page (Swipe left or Right Arrow)"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-700 dark:text-gray-200 shadow-xs"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Right: Zoom & Fullscreen Controls */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => {
                            setScale(s => Math.max(Number((s - 0.25).toFixed(2)), 0.5));
                            setHasZoomed(true);
                        }}
                        title="Zoom out (Ctrl + scroll down)"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-base font-bold transition shadow-xs"
                    >
                        −
                    </button>

                    <button
                        onClick={() => {
                            setHasZoomed(false);
                            setScale(fitScale);
                        }}
                        title="Reset to Fit Width (Double-tap)"
                        className="px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition min-w-[50px] text-center border border-transparent hover:border-border"
                    >
                        {Math.round(scale * 100)}%
                    </button>

                    <button
                        onClick={() => {
                            setScale(s => Math.min(Number((s + 0.25).toFixed(2)), 4.0));
                            setHasZoomed(true);
                        }}
                        title="Zoom in (Ctrl + scroll up / Pinch)"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-base font-bold transition shadow-xs"
                    >
                        +
                    </button>

                    <div className="h-5 w-[1px] bg-border mx-0.5"></div>

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition shadow-xs"
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Mobile Gesture Helper Badge (Dismissible) ─────────────────── */}
            {showHint && (
                <div className="sm:hidden bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 border-b border-blue-500/15 px-3 py-1 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1.5 font-medium">
                        <span>👈 👉 Swipe to turn</span>
                        <span>•</span>
                        <span>🤏 Pinch to zoom</span>
                    </span>
                    <button
                        onClick={() => setShowHint(false)}
                        className="text-blue-600/70 hover:text-blue-900 dark:hover:text-white px-1"
                        title="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ── PDF Canvas Viewport Container ─────────────────────────────── */}
            <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative overflow-auto flex justify-center items-start w-full flex-1 transition-colors duration-150 ${
                    isGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab'
                }`}
                style={{
                    maxHeight: isFullscreen ? 'calc(100vh - 110px)' : 'calc(100vh - 200px)',
                    minHeight: '380px',
                    touchAction: 'pan-x pan-y',
                }}
            >
                {/* Visual Feedback on Swipe / Page Change */}
                {pageTurnFeedback === 'next' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none bg-blue-600 text-white px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1.5 text-xs font-bold animate-pulse">
                        Next Page ➔
                    </div>
                )}
                {pageTurnFeedback === 'prev' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none bg-blue-600 text-white px-3 py-2 rounded-2xl shadow-lg flex items-center gap-1.5 text-xs font-bold animate-pulse">
                        ⬅ Prev Page
                    </div>
                )}

                {/* Canvas Wrapper with Hardware-Accelerated Gesture Scale */}
                <div
                    style={{
                        transform: `scale(${gestureTransform.scale})`,
                        transformOrigin: `${gestureTransform.originX}% ${gestureTransform.originY}%`,
                        transition: isPinchingRef.current ? 'none' : 'transform 0.15s ease-out',
                        display: 'inline-block',
                    }}
                    className="p-3 my-auto"
                >
                    <canvas
                        ref={canvasRef}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-md block border border-border/60"
                        style={{
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            pointerEvents: 'none', // Prevents image drag or selection
                        }}
                    />
                </div>
            </div>

            {/* ── Bottom Mobile / Tablet Friendly Floating Navigation Dock ──── */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-border px-4 py-2 flex items-center justify-between gap-3 z-20">
                <button
                    onClick={() => triggerPageChange('prev')}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                </button>

                {/* Center Page Indicator Pill */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
                    </p>
                </div>

                <button
                    onClick={() => triggerPageChange('next')}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
                >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* ── Security Footer ───────────────────────────────────────────── */}
            <div className="bg-amber-500/10 border-t border-amber-500/20 py-1 px-3 text-center">
                <p className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                    🔒 Protected Document • Download, printing, and sharing are restricted
                </p>
            </div>
        </div>
    );
}
