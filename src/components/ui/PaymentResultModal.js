'use client';

/**
 * PaymentResultModal
 * A beautiful animated modal for payment success, error, and loading states.
 *
 * Props:
 *  - type: 'success' | 'error' | 'loading' | null  (null = hidden)
 *  - title: string
 *  - message: string
 *  - onClose: () => void
 *  - onAction: () => void   (primary button action, e.g. "Go to Dashboard")
 *  - actionLabel: string   (default: 'Go to Dashboard')
 *  - secondaryLabel: string (optional second button)
 *  - onSecondary: () => void (optional second button action)
 */
export default function PaymentResultModal({
    type,
    title,
    message,
    onClose,
    onAction,
    actionLabel = 'Go to Dashboard',
    secondaryLabel,
    onSecondary,
}) {
    if (!type) return null;

    const config = {
        success: {
            gradient: 'from-emerald-500 to-teal-500',
            glow: 'shadow-emerald-500/30',
            ring: 'ring-emerald-400/30',
            btn: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30',
            bgAura: 'bg-emerald-500/10',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: '🎉 Payment Successful',
            badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        error: {
            gradient: 'from-red-500 to-rose-600',
            glow: 'shadow-red-500/30',
            ring: 'ring-red-400/30',
            btn: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30',
            bgAura: 'bg-red-500/10',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            badge: '❌ Payment Failed',
            badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
        },
        loading: {
            gradient: 'from-blue-500 to-violet-600',
            glow: 'shadow-blue-500/30',
            ring: 'ring-blue-400/30',
            btn: 'from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 shadow-blue-500/30',
            bgAura: 'bg-blue-500/10',
            icon: (
                <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ),
            badge: '⏳ Processing...',
            badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        },
    };

    const c = config[type] || config.error;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={type !== 'loading' ? onClose : undefined}
        >
            {/* Keyframe styles */}
            <style>{`
                @keyframes pmSlideUp {
                    from { opacity: 0; transform: translateY(28px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pmPop {
                    0%   { transform: scale(0.5); opacity: 0; }
                    70%  { transform: scale(1.12); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pmPulse {
                    0%, 100% { opacity: 0.25; transform: scale(1); }
                    50%       { opacity: 0.45; transform: scale(1.08); }
                }
                .pm-card  { animation: pmSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                .pm-icon  { animation: pmPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
                .pm-aura  { animation: pmPulse 2.5s ease-in-out infinite; }
            `}</style>

            <div
                className="pm-card relative w-full max-w-md rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, rgba(15,15,25,0.98), rgba(10,10,20,0.99))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${c.gradient}`} />

                <div className="p-8">
                    {/* Close button */}
                    {type !== 'loading' && (
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    {/* Icon + Aura */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="relative mb-5">
                            {/* Pulsing aura */}
                            <div className={`pm-aura absolute inset-0 rounded-full ${c.bgAura} blur-2xl scale-150`} />
                            {/* Icon circle */}
                            <div className={`pm-icon relative w-20 h-20 rounded-full bg-gradient-to-br ${c.gradient} ${c.glow} shadow-2xl flex items-center justify-center ring-4 ${c.ring}`}>
                                {c.icon}
                            </div>
                        </div>

                        {/* Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${c.badgeColor}`}>
                            {c.badge}
                        </span>

                        {/* Title */}
                        <h2 className="text-xl font-extrabold text-white mb-2 leading-tight">
                            {title}
                        </h2>

                        {/* Message */}
                        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                            {message}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/8 mb-6" />

                    {/* Actions */}
                    {type !== 'loading' && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            {onAction && (
                                <button
                                    onClick={onAction}
                                    className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${c.btn} shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    {actionLabel}
                                </button>
                            )}
                            {secondaryLabel && onSecondary && (
                                <button
                                    onClick={onSecondary}
                                    className="flex-1 py-3 px-5 rounded-xl font-bold text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                                >
                                    {secondaryLabel}
                                </button>
                            )}
                            {!onAction && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 px-5 rounded-xl font-bold text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    )}

                    {type === 'loading' && (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-medium">Please do not close or refresh this page</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
