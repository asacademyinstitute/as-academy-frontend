'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function InstallAppPrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const pathname = usePathname();
    const { user } = useAuthStore();

    useEffect(() => {
        // Listen for the PWA install event on Android / Chromium
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Allow manual trigger from any button (e.g. Dashboard banner or Mobile drawer)
        const handleManualOpen = () => {
            setShowIOSGuide(false);
            setIsOpen(true);
        };
        window.addEventListener('open-install-app-prompt', handleManualOpen);

        // Detect if already installed and running inside the standalone app
        const isStandalone = 
            typeof window !== 'undefined' && (
                window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://')
            );

        if (isStandalone) {
            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('open-install-app-prompt', handleManualOpen);
            };
        }

        // Detect iOS
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
        const iosDevice = /iPhone|iPad|iPod/i.test(ua);
        setIsIOS(iosDevice);

        // Check if user is on student routes or just logged in
        const isStudentArea = pathname?.startsWith('/student');
        const justLoggedIn = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('just_logged_in') === 'true';

        const isDev = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
        );

        if (isStudentArea || justLoggedIn) {
            // Check if dismissed in this session
            const dismissedRecently = !isDev && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('as_app_dismissed_session');
            
            if (!dismissedRecently) {
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    if (justLoggedIn) {
                        sessionStorage.removeItem('just_logged_in');
                    }
                }, 1200);

                return () => {
                    clearTimeout(timer);
                    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                    window.removeEventListener('open-install-app-prompt', handleManualOpen);
                };
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('open-install-app-prompt', handleManualOpen);
        };
    }, [pathname, user]);

    const handleDismiss = () => {
        setIsOpen(false);
        try {
            sessionStorage.setItem('as_app_dismissed_session', 'true');
        } catch (e) {}
    };

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult.outcome === 'accepted') {
                    setIsOpen(false);
                }
                setDeferredPrompt(null);
            } catch (err) {
                console.error('Install prompt error:', err);
                setShowIOSGuide(true);
            }
        } else {
            // Fallback guide if browser already consumed the prompt or in-app browser
            setShowIOSGuide(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            style={{ zIndex: 999998 }}
            className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
            {/* Modal Card */}
            <div 
                className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 border-t sm:border border-gray-100 dark:border-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 text-center animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* App Icon with Glow */}
                <div className="relative w-20 h-20 mx-auto mb-3.5">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md"></div>
                    <img
                        src="/icons/icon-192x192.png"
                        alt="AS Academy App"
                        className="relative w-20 h-20 rounded-2xl shadow-md border border-white/20 object-cover mx-auto"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Trust Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-2">
                    <span>⚡ Official Web App</span>
                    <span>•</span>
                    <span>Ultra-Light (&lt;1 MB)</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    Install AS Academy App
                </h3>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 mb-4 leading-relaxed">
                    Apne mobile par AS Academy install karein! Wahan se courses, lectures aur notes dekhna bahut <strong>fast aur aasaan</strong> hai.
                </p>

                {/* Feature Perks */}
                <div className="grid grid-cols-3 gap-2 my-4 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="text-lg mb-0.5">🚀</div>
                        <div className="text-[11px] font-bold text-gray-900 dark:text-white">1-Tap Open</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">Home Screen</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="text-lg mb-0.5">📺</div>
                        <div className="text-[11px] font-bold text-gray-900 dark:text-white">Fullscreen</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">Distraction Free</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="text-lg mb-0.5">⚡</div>
                        <div className="text-[11px] font-bold text-gray-900 dark:text-white">Faster</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">Low Data Usage</div>
                    </div>
                </div>

                {/* Guide for iPhone Safari or Manual Browser installation */}
                {showIOSGuide && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 text-left my-3 space-y-2.5 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150">
                        <div className="font-bold flex items-center gap-1.5 text-sm text-blue-800 dark:text-blue-300">
                            <span>📲</span> How to Install:
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                            <span>Browser me neeche ya upar <strong className="font-bold">Share (⎙ / ⬆)</strong> ya <strong className="font-bold">Menu (⋮)</strong> dabayein.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                            <span>List me se <strong className="font-bold">"Add to Home Screen"</strong> (या "Install App") select karein.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                            <span>Top right par <strong className="font-bold">"Add"</strong> dabayein — App ready! 🎉</span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 mt-4">
                    <button
                        onClick={handleInstallClick}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-98"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{isIOS ? 'Show How to Install on iPhone' : (showIOSGuide ? 'Follow Steps Above ⬆' : 'Install Web App Now')}</span>
                    </button>

                    <button
                        onClick={handleDismiss}
                        className="w-full py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Continue in Browser
                    </button>
                </div>
            </div>
        </div>
    );
}
