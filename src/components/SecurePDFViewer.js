'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function SecurePDFViewer({ pdfUrl, watermarkData }) {
    const canvasRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const containerRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const zoomBadgeRef = useRef(null);

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

    // Dynamic ref tracking to avoid stale closures in event listeners
    const scaleRef = useRef(scale);
    scaleRef.current = scale;

    const fitScaleRef = useRef(fitScale);
    fitScaleRef.current = fitScale;

    const totalPagesRef = useRef(totalPages);
    totalPagesRef.current = totalPages;

    const currentPageRef = useRef(currentPage);
    currentPageRef.current = currentPage;

    // Interactive UI states
    const [pageInput, setPageInput] = useState('');
    const [showPageInput, setShowPageInput] = useState(false);
    const [pageTurnFeedback, setPageTurnFeedback] = useState(null); // 'next' | 'prev' | null
    const [showHint, setShowHint] = useState(true);

    // Drag-to-pan state (mouse on desktop)
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isGrabbing, setIsGrabbing] = useState(false);

    // High-performance touch gesture tracking
    const touchRef = useRef({
        isPinching: false,
        isPanning: false,
        startDist: 0,
        startScale: 1,
        currentRatio: 1,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
        startTime: 0,
        lastTapTime: 0,
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
                const containerWidth = containerRef.current.clientWidth - 16;
                const targetWidth = Math.max(280, containerWidth);
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
                if (prev < totalPagesRef.current) {
                    setPageTurnFeedback('next');
                    setTimeout(() => setPageTurnFeedback(null), 350);
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
                    setTimeout(() => setPageTurnFeedback(null), 350);
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0;
                        scrollContainerRef.current.scrollLeft = 0;
                    }
                    return prev - 1;
                }
                return prev;
            });
        }
    }, []);

    // ─── 6. Keyboard Shortcuts Navigation ──────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                return false;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                return false;
            }

            if (e.target.tagName === 'INPUT') return;

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
                setScale(fitScaleRef.current);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [triggerPageChange]);

    // ─── 7. Fullscreen Toggle ──────────────────────────────────────────────────
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

    // ─── 10. MOBILE TOUCH ENGINE (Pinch Zoom + Pan + Swipe Navigation) ─────────
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const handleTouchStart = (e) => {
            const t = touchRef.current;

            if (e.touches.length === 2) {
                // Multi-touch: 2 fingers -> Pinch to zoom!
                // Calling preventDefault on touchstart blocks browser native viewport zoom
                e.preventDefault();
                t.isPinching = true;
                t.isPanning = false;

                const t1 = e.touches[0];
                const t2 = e.touches[1];
                t.startDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                t.startScale = scaleRef.current;
                t.currentRatio = 1;

                if (canvasWrapperRef.current) {
                    canvasWrapperRef.current.style.transition = 'none';
                }
            } else if (e.touches.length === 1) {
                // Single touch: Track for 1-finger pan or swipe
                t.isPinching = false;
                t.isPanning = true;

                const touch = e.touches[0];
                t.startX = touch.clientX;
                t.startY = touch.clientY;
                t.startScrollLeft = el.scrollLeft;
                t.startScrollTop = el.scrollTop;
                t.startTime = Date.now();

                // Double tap detection (< 300ms)
                const now = Date.now();
                if (now - t.lastTapTime < 300) {
                    e.preventDefault();
                    const current = scaleRef.current;
                    const fit = fitScaleRef.current;
                    if (current > fit * 1.15) {
                        setHasZoomed(false);
                        setScale(fit);
                    } else {
                        setHasZoomed(true);
                        setScale(Number((fit * 1.8).toFixed(2)));
                    }
                    t.lastTapTime = 0;
                    t.isPanning = false;
                } else {
                    t.lastTapTime = now;
                }
            }
        };

        const handleTouchMove = (e) => {
            const t = touchRef.current;

            if (e.touches.length === 2 && t.isPinching) {
                // Pinching in/out: Prevent browser scroll/zoom
                e.preventDefault();

                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

                if (t.startDist > 0) {
                    const ratio = currentDist / t.startDist;
                    t.currentRatio = ratio;

                    // Direct hardware-accelerated CSS transform (120 FPS buttery smooth)
                    if (canvasWrapperRef.current) {
                        canvasWrapperRef.current.style.transform = `scale(${ratio})`;
                    }

                    // Update live percentage badge
                    const liveScale = Math.min(4.0, Math.max(0.4, t.startScale * ratio));
                    if (zoomBadgeRef.current) {
                        zoomBadgeRef.current.textContent = `${Math.round(liveScale * 100)}%`;
                    }
                }
            } else if (e.touches.length === 1 && t.isPanning) {
                const touch = e.touches[0];
                const dx = touch.clientX - t.startX;
                const dy = touch.clientY - t.startY;

                // When user is zoomed in, allow dragging around smoothly
                if (scaleRef.current > fitScaleRef.current * 1.05 || el.scrollWidth > el.clientWidth + 10) {
                    el.scrollLeft = t.startScrollLeft - dx;
                    el.scrollTop = t.startScrollTop - dy;
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = (e) => {
            const t = touchRef.current;

            // Pinch ended: commit new scale
            if (t.isPinching && e.touches.length < 2) {
                t.isPinching = false;
                const finalRatio = t.currentRatio;
                t.currentRatio = 1;

                if (canvasWrapperRef.current) {
                    canvasWrapperRef.current.style.transition = 'transform 0.15s ease-out';
                    canvasWrapperRef.current.style.transform = 'scale(1)';
                }

                if (Math.abs(finalRatio - 1) > 0.04) {
                    const newScale = Number((t.startScale * finalRatio).toFixed(2));
                    const boundedScale = Math.min(4.0, Math.max(0.5, newScale));
                    setHasZoomed(true);
                    setScale(boundedScale);
                } else {
                    if (zoomBadgeRef.current) {
                        zoomBadgeRef.current.textContent = `${Math.round(scaleRef.current * 100)}%`;
                    }
                }
            }

            // 1-Finger horizontal swipe for page turn
            if (t.isPanning && e.changedTouches.length === 1 && !t.isPinching) {
                t.isPanning = false;
                const touch = e.changedTouches[0];
                const dx = touch.clientX - t.startX;
                const dy = touch.clientY - t.startY;
                const duration = Date.now() - t.startTime;

                const isHorizontal = Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && duration < 500;

                if (isHorizontal) {
                    const isAtLeftEdge = el.scrollLeft <= 15;
                    const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 15;
                    const isNotZoomed = el.scrollWidth <= el.clientWidth + 25;

                    if (dx < 0 && (isAtRightEdge || isNotZoomed)) {
                        triggerPageChange('next');
                    } else if (dx > 0 && (isAtLeftEdge || isNotZoomed)) {
                        triggerPageChange('prev');
                    }
                }
            }
        };

        // Attach touch listeners with passive: false to allow e.preventDefault()
        el.addEventListener('touchstart', handleTouchStart, { passive: false });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: false });
        el.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [triggerPageChange]);

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
                        title="Zoom out"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-base font-bold transition shadow-xs"
                    >
                        −
                    </button>

                    <button
                        ref={zoomBadgeRef}
                        onClick={() => {
                            setHasZoomed(false);
                            setScale(fitScale);
                        }}
                        title="Reset to Fit Width (or Double-tap on mobile)"
                        className="px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition min-w-[50px] text-center border border-transparent hover:border-border"
                    >
                        {Math.round(scale * 100)}%
                    </button>

                    <button
                        onClick={() => {
                            setScale(s => Math.min(Number((s + 0.25).toFixed(2)), 4.0));
                            setHasZoomed(true);
                        }}
                        title="Zoom in"
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
                        <span>🤏 Pinch to zoom</span>
                        <span>•</span>
                        <span>👈 👉 Swipe to turn</span>
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

            {/* ── PDF Canvas Viewport Container (with touchAction: none for mobile pinch) ── */}
            <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative overflow-auto flex justify-center items-start w-full flex-1 transition-colors duration-150 select-none ${
                    isGrabbing ? 'cursor-grabbing' : (scale > fitScale ? 'cursor-grab' : 'cursor-default')
                }`}
                style={{
                    maxHeight: isFullscreen ? 'calc(100vh - 110px)' : 'calc(100vh - 190px)',
                    minHeight: '350px',
                    touchAction: 'none', // MANDATORY for mobile 2-finger pinch zoom
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Visual Feedback on Swipe / Page Change */}
                {pageTurnFeedback === 'next' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none bg-blue-600 text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-pulse">
                        Next Page ➔
                    </div>
                )}
                {pageTurnFeedback === 'prev' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none bg-blue-600 text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-pulse">
                        ⬅ Prev Page
                    </div>
                )}

                {/* Canvas Wrapper (directly animated during pinch gesture for 120 FPS performance) */}
                <div
                    ref={canvasWrapperRef}
                    className="p-2 sm:p-4 my-auto inline-block"
                    style={{
                        transformOrigin: 'center center',
                        willChange: 'transform',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg block border border-border/60"
                        style={{
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            pointerEvents: 'none',
                            display: 'block',
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

                {/* Center Page Indicator */}
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
