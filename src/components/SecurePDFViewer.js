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
    const [scale, setScale] = useState(1.5);
    const [isFullscreen, setIsFullscreen] = useState(false);

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

                // Manually fetch the PDF first to isolate network issues
                const response = await fetch(pdfUrl);

                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                console.log('2. Fetch successful, blob size:', blob.size);
                console.log('3. Initializing PDF.js with blob URL');

                // Configure loading task using the Blob URL
                const loadingTask = pdfjsLib.getDocument({
                    url: url,
                    withCredentials: false // Not needed for blob URLs
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

    // Render page with watermark
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(currentPage);
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                const viewport = page.getViewport({ scale });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                // Render PDF page
                await page.render(renderContext).promise;

                // Apply watermark overlay
                applyWatermark(context, canvas.width, canvas.height);
            } catch (error) {
                console.error('Error rendering page:', error);
            }
        };

        renderPage();
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
    };

    const zoomOut = () => {
        setScale(Math.max(scale - 0.25, 0.5));
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
            <div className="flex items-center justify-center aspect-video bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center aspect-video bg-red-50 border border-red-200">
                <div className="text-center p-6 max-w-md">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Failed to Load PDF</h3>
                    <p className="text-sm text-red-700 mb-4">{error}</p>
                    <div className="text-xs text-gray-600 mb-4">
                        <p>Possible causes:</p>
                        <ul className="list-disc list-inside text-left mt-2">
                            <li>PDF file is not accessible</li>
                            <li>Network connection issue</li>
                            <li>Invalid or expired URL</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100" ref={containerRef}>
            {/* Controls */}
            <div className="bg-white border-b p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={zoomOut}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        -
                    </button>
                    <span className="text-sm text-gray-700">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        +
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                        {isFullscreen ? '⊗' : '⛶'}
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div className="overflow-auto bg-gray-200 p-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                <canvas
                    ref={canvasRef}
                    onContextMenu={handleContextMenu}
                    className="mx-auto shadow-lg bg-white"
                    style={{ userSelect: 'none' }}
                />
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border-t border-yellow-200 p-2 text-center">
                <p className="text-xs text-yellow-800">
                    🔒 This PDF is protected. Download, print, and copy are disabled.
                </p>
            </div>
        </div>
    );
}
