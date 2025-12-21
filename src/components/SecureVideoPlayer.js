'use client';

import { useEffect, useRef, useState } from 'react';

export default function SecureVideoPlayer({ videoUrl, watermarkData }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 });

    console.log('🎬 SecureVideoPlayer rendered with:', { videoUrl, watermarkData });

    // Move watermark position every 2.5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Generate random position
            const maxX = 70; // Keep within 70% of width
            const maxY = 70; // Keep within 70% of height
            const newX = Math.random() * maxX;
            const newY = Math.random() * maxY;

            setWatermarkPosition({ x: newX, y: newY });
            console.log('📍 Watermark position updated:', { x: newX, y: newY });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    // Block right-click
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // Block keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
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

    if (!videoUrl) {
        return (
            <div className="flex items-center justify-center aspect-video bg-gray-100">
                <p className="text-gray-600">No video available</p>
            </div>
        );
    }

    // Prepare watermark text
    console.log('🔍 Full watermarkData object:', JSON.stringify(watermarkData, null, 2));

    const email = watermarkData?.email || 'No Email';
    const phone = watermarkData?.phone || 'No Phone';

    const watermarkText = watermarkData
        ? `${email} | ${phone}`
        : 'Protected Content';

    console.log('💧 Watermark text:', watermarkText);
    console.log('📧 Email:', email);
    console.log('📱 Phone:', phone);

    return (
        <div
            ref={containerRef}
            className="relative bg-black"
            onContextMenu={handleContextMenu}
            style={{
                userSelect: 'none',
                width: '100%',
                position: 'relative' // Ensure container is positioned
            }}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={videoUrl}
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
                onContextMenu={handleContextMenu}
            >
                Your browser does not support the video tag.
            </video>

            {/* Watermark Overlay */}
            <div
                className="pointer-events-none transition-all duration-500"
                style={{
                    position: 'absolute',
                    left: `${watermarkPosition.x}%`,
                    top: `${watermarkPosition.y}%`,
                    zIndex: 2147483647,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    opacity: 0.7
                }}
            >
                {watermarkText}
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border-t border-yellow-200 p-2 text-center">
                <p className="text-xs text-yellow-800">
                    🔒 This video is protected. Download and screen recording are monitored.
                </p>
            </div>
        </div>
    );
}
