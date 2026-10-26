'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CommunityPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Do not show on admin or teacher management panels
        if (pathname?.startsWith('/admin') || pathname?.startsWith('/teacher')) {
            return;
        }

        // Allow manual trigger from anywhere (e.g. Nav menu, Drawer, Banner)
        const handleManualOpen = () => setIsOpen(true);
        window.addEventListener('open-community-popup', handleManualOpen);

        // Check if dismissed in this visit/session so it doesn't repeatedly irritate the user
        const alreadyDismissed = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('as_community_popup_dismissed') === 'true';
        if (alreadyDismissed) {
            return () => window.removeEventListener('open-community-popup', handleManualOpen);
        }

        // Show popup after 1.2s for new visitors
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 1200);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('open-community-popup', handleManualOpen);
        };
    }, [pathname]);

    const handleDismiss = () => {
        setIsOpen(false);
        try {
            sessionStorage.setItem('as_community_popup_dismissed', 'true');
        } catch (e) {}
    };

    const handleActionClick = () => {
        try {
            sessionStorage.setItem('as_community_popup_dismissed', 'true');
        } catch (e) {}
    };

    // Do not render on admin or teacher routes
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/teacher')) {
        return null;
    }

    if (!isOpen) {
        return null;
    }

    return (
        /* ── Modal Overlay ──────────────────────────────────────────────── */
        <div 
            style={{ zIndex: 999999 }}
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={handleDismiss}
        >
            {/* Modal Card */}
            <div 
                className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-center transition-transform"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    aria-label="Close popup"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 via-rose-500/10 to-purple-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3.5">
                    <span>🔥</span>
                    <span>Exclusive Updates & Perks</span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                    Join the AS Academy Community!
                </h3>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 mb-5 leading-relaxed">
                    Get latest <strong className="text-blue-600 dark:text-blue-400 font-semibold">ASEQP Question Papers</strong>, exam solutions, study materials & <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">special coupon codes</strong> directly on your phone.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* WhatsApp Button */}
                    <a
                        href="https://chat.whatsapp.com/Cls8v9xgbMPGYKcFEu2xzJ"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleActionClick}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                {/* Official WhatsApp SVG */}
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold flex items-center gap-1.5">
                                    Join WhatsApp Group
                                    <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Instant</span>
                                </div>
                                <div className="text-xs text-white/80 font-normal">
                                    ASEQP question papers & fast alerts
                                </div>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>

                    {/* Instagram Button */}
                    <a
                        href="https://www.instagram.com/asacademy_india/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleActionClick}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:via-rose-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                {/* Official Instagram SVG */}
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold">
                                    Follow @asacademy_india
                                </div>
                                <div className="text-xs text-white/80 font-normal">
                                    Exclusive coupon codes & giveaways
                                </div>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>

                {/* Footer text link */}
                <div className="mt-4">
                    <button
                        onClick={handleDismiss}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors cursor-pointer"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
