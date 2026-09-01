'use client';

import { useEffect, useRef, useState } from 'react';

export default function SecurePDFViewer({ pdfUrl, watermarkData }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [pdf, setPdf] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasZoomed, setHasZoomed] = useState(false);

    // Load PDF
    useEffect(() => {
        if (!pdfUrl) return;

        const loadPDF = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('1. Starting manual fetch of PDF:', pdfUrl);

                // Dynamically import PDF.js to avoid SSR DOMMatrix error
                const pdfjsLib = await import('pdfjs-dist');

                // Configure worker
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                        'pdfjs-dist/build/pdf.worker.min.mjs',
                        import.meta.url
                    ).toString();
                }

                let targetUrl = pdfUrl;
                let createdBlobUrl = null;

                if (!pdfUrl.startsWith('blob:')) {
                    // Manually fetch if it's a remote URL
                    const response = await fetch(pdfUrl);
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    targetUrl = URL.createObjectURL(blob);
                    createdBlobUrl = targetUrl;
                }

                // Configure loading task using the Blob URL
                const loadingTask = pdfjsLib.getDocument({
                    url: targetUrl,
                    withCredentials: false
                });

                // Add progress listener
                loadingTask.onProgress = (progress) => {
                    console.log('PDF parsing progress:', progress);
                };

                const pdfDoc = await loadingTask.promise;
                console.log('PDF loaded successfully, pages:', pdfDoc.numPages);

                setPdf(pdfDoc);
                setTotalPages(pdfDoc.numPages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    url: pdfUrl
                });
                setError(`Failed to load PDF: ${error.message}`);
                setLoading(false);
            }
        };

        loadPDF();
    }, [pdfUrl]);

    // Auto-fit to width on load or screen resize (unless zoomed manually)
    useEffect(() => {
        if (!pdf || !containerRef.current) return;

        const autoFit = async () => {
            if (hasZoomed) return;
            try {
                const page = await pdf.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1.0 });
                const containerWidth = containerRef.current.clientWidth;
                const targetWidth = Math.max(280, containerWidth);
                const fitScale = targetWidth / viewport.width;
                setScale(Number(fitScale.toFixed(2)));
            } catch (error) {
                console.error('Error auto-scaling PDF:', error);
            }
        };

        autoFit();

        window.addEventListener('resize', autoFit);
        return () => window.removeEventListener('resize', autoFit);
    }, [pdf, currentPage, hasZoomed]);

    // Render page with watermark
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

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                // Render PDF page
                renderTask = page.render(renderContext);
                await renderTask.promise;

                if (!isCancelled) {
                    // Apply watermark overlay
                    applyWatermark(context, canvas.width, canvas.height);
                }
            } catch (error) {
                if (error?.name !== 'RenderingCancelledException') {
                    console.error('Error rendering page:', error);
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
    }, [pdf, currentPage, scale]);

    // Apply watermark overlay
    const applyWatermark = (context, width, height) => {
        if (!watermarkData) return;

        const { email, phone } = watermarkData;
        // Show ONLY email and phone (no name)
        const watermarkText = `${email} | ${phone}`;

        context.save();
        context.globalAlpha = 0.25; // Slightly lower opacity for better readability
        context.font = 'bold 34px Arial'; // BOLD and LARGE for maximum visibility
        context.fillStyle = '#333333'; // Dark gray for strong contrast
        context.textAlign = 'center';

        // Rotate and repeat watermark diagonally
        const angle = -30 * (Math.PI / 180); // -30 degrees as specified

        context.translate(width / 2, height / 2);
        context.rotate(angle);

        // Draw watermark with proper spacing to avoid overlap
        const spacing = 700; // Extra large spacing for zero overlap
        const rows = Math.ceil(height / spacing);
        const cols = Math.ceil(width / spacing);

        for (let row = -rows; row <= rows; row++) {
            for (let col = -cols; col <= cols; col++) {
                const x = col * spacing;
                const y = row * spacing;
                context.fillText(watermarkText, x, y);
            }
        }

        context.restore();
    };

    // Security: Disable right-click
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Security: Block keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Block Ctrl+P (Print)
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                alert('Printing is disabled for security reasons.');
                return false;
            }
            // Block Ctrl+S (Save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                alert('Saving is disabled for security reasons.');
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const zoomIn = () => {
        setScale(Math.min(scale + 0.25, 3));
        setHasZoomed(true);
    };

    const zoomOut = () => {
        setScale(Math.max(scale - 0.25, 0.5));
        setHasZoomed(true);
    };

    // Fullscreen toggle
    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center aspect-video bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-blue-600 dark:border-blue-500 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading PDF...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center aspect-video bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                <div className="text-center p-6 max-w-md">
                    <div className="text-red-500 text-4xl mb-3">⚠️</div>
                    <h3 className="text-base font-bold text-red-800 dark:text-red-400 mb-1.5">Failed to Load PDF</h3>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 border border-border rounded-xl overflow-hidden shadow-soft" ref={containerRef}>
            {/* Controls */}
            <div className="bg-white dark:bg-gray-900 border-b border-border p-2.5 flex flex-wrap gap-2.5 items-center justify-between">
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-xs font-semibold transition"
                    >
                        Prev
                    </button>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 px-1">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-xs font-semibold transition"
                    >
                        Next
                    </button>
                </div>

                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={zoomOut}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-850 dark:text-gray-200 rounded-lg text-xs font-bold transition"
                    >
                        -
                    </button>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 min-w-[36px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-850 dark:text-gray-200 rounded-lg text-xs font-bold transition"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setHasZoomed(false)}
                        className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                    >
                        Fit
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div className="overflow-auto bg-gray-100 dark:bg-gray-950 flex justify-center items-start w-full" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <canvas
                    ref={canvasRef}
                    onContextMenu={handleContextMenu}
                    className="bg-white dark:bg-gray-900"
                    style={{ userSelect: 'none', display: 'block' }}
                />
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-t border-yellow-200 dark:border-yellow-900/30 p-2 text-center">
                <p className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-500 font-medium">
                    🔒 This PDF is protected. Download, print, and copy are disabled.
                </p>
            </div>
        </div>
    );
}
