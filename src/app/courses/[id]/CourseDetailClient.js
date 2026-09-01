'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { coursesAPI, paymentAPI, couponAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import PaymentResultModal from '@/components/ui/PaymentResultModal';
import { showToast } from '@/components/ui/toast';

export default function CourseDetailClient({ courseId, initialCourse }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [course, setCourse] = useState(initialCourse);
    const [loading, setLoading] = useState(!initialCourse);
    const [purchasing, setPurchasing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Auth Prompt Modal states
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Payment result modal
    const [paymentModal, setPaymentModal] = useState({
        type: null,   // 'loading' | 'success' | 'error'
        title: '',
        message: '',
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            setRazorpayLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!initialCourse) {
            fetchCourse();
        }
    }, [courseId]);

    // Timer countdown for redirecting to signup
    useEffect(() => {
        let timer;
        if (showAuthModal && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (showAuthModal && countdown === 0) {
            router.push('/signup');
        }
        return () => clearTimeout(timer);
    }, [showAuthModal, countdown, router]);

    const closePaymentModal = () => setPaymentModal({ type: null, title: '', message: '' });

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            setShowAuthModal(true);
            setCountdown(5);
            return;
        }

        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setIsValidatingCoupon(true);
        setCouponError('');
        setCouponSuccess('');

        try {
            const response = await couponAPI.validate(couponCode.trim(), course.id);
            const couponData = response.data.data;
            setAppliedCoupon(couponData);
            setCouponSuccess(`Coupon applied! Saved ${formatCurrency(couponData.discount_amount)}`);
            showToast(`🎟️ Coupon "${couponData.code}" applied! You saved ${formatCurrency(couponData.discount_amount)}`, 'success', 4000);
        } catch (error) {
            console.error('Coupon validation failed:', error);
            const errMsg = error.response?.data?.message || 'Invalid coupon code';
            setCouponError(errMsg);
            setAppliedCoupon(null);
            showToast(`❌ ${errMsg}`, 'error', 4000);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponSuccess('');
        setCouponError('');
        showToast('Coupon removed', 'info', 2500);
    };

    const handleCloseAuthModal = () => {
        setShowAuthModal(false);
    };

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await coursesAPI.getById(courseId);
            setCourse(response.data.data);
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            setCountdown(5);
            return;
        }

        if (!razorpayLoaded || !window.Razorpay) {
            showToast('Payment system is loading. Please wait a moment and try again.', 'warning', 4000);
            return;
        }

        const finalAmount = appliedCoupon ? appliedCoupon.final_amount : course.price;
        setPurchasing(true);

        // Show loading modal
        setPaymentModal({
            type: 'loading',
            title: 'Preparing Your Order',
            message: 'Setting up a secure payment session for you...',
        });

        try {
            const orderResponse = await paymentAPI.createOrder(course.id, finalAmount);
            const { orderId, amount, currency, keyId } = orderResponse.data.data;

            if (!orderId || !keyId) {
                throw new Error('Invalid order data received from server');
            }

            // Close loading modal — Razorpay will open
            closePaymentModal();

            const options = {
                key: keyId,
                amount,
                currency,
                name: 'AS Academy',
                description: course.title,
                order_id: orderId,
                handler: async function (response) {
                    // Show processing modal
                    setPaymentModal({
                        type: 'loading',
                        title: 'Verifying Payment',
                        message: 'Please wait while we confirm your payment...',
                    });
                    try {
                        await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        // Success!
                        setPaymentModal({
                            type: 'success',
                            title: 'Enrollment Confirmed! 🎉',
                            message: `You have successfully enrolled in "${course.title}". Start learning now from your dashboard.`,
                        });
                        setPurchasing(false);
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        const errMsg = error.response?.data?.message || 'Payment verification failed. Please contact support if your amount was deducted.';
                        setPaymentModal({
                            type: 'error',
                            title: 'Verification Failed',
                            message: errMsg,
                        });
                        setPurchasing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPurchasing(false);
                        closePaymentModal();
                        showToast('Payment cancelled. You can try again anytime.', 'info', 3500);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                theme: {
                    color: '#7c3aed'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                const desc = response.error?.description || 'Unknown payment error';
                const reason = response.error?.reason || '';
                setPaymentModal({
                    type: 'error',
                    title: 'Payment Failed',
                    message: `${desc}${reason ? ` (${reason})` : ''}. Please try again or use a different payment method.`,
                });
                setPurchasing(false);
            });
            razorpay.open();
        } catch (error) {
            console.error('Error creating order:', error);
            const errMsg = error.response?.data?.message || error.message || 'Could not create payment order. Please try again.';
            setPaymentModal({
                type: 'error',
                title: 'Order Creation Failed',
                message: errMsg,
            });
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!course) {
        return <div className="text-center py-12">Course not found</div>;
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
                onError={() => showToast('Failed to load payment system. Please refresh the page.', 'error', 5000)}
            />

            <div className="min-h-screen bg-background dark:bg-gray-950 transition-colors duration-200">
                <div className="bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Link href="/courses" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">
                            ← Back to Courses
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-soft p-6 md:p-8">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{course.title}</h1>
                                <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">{course.description}</p>

                                {course.users && (
                                    <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                        <h3 className="font-semibold text-gray-950 dark:text-white text-sm uppercase tracking-wider mb-1">Instructor</h3>
                                        <p className="text-gray-750 dark:text-gray-305 font-medium">{course.users.name}</p>
                                    </div>
                                )}

                                <div className="border-t border-gray-150 dark:border-gray-800 pt-6">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Syllabus</h3>
                                    {course.chapters && course.chapters.length > 0 ? (
                                        <div className="space-y-4">
                                            {course.chapters.map((chapter, idx) => (
                                                <div key={chapter.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-5 bg-gray-50/50 dark:bg-gray-900/30">
                                                    <h4 className="font-bold text-gray-950 dark:text-white text-base">
                                                        {idx + 1}. {chapter.title}
                                                    </h4>
                                                    {chapter.lectures && chapter.lectures.length > 0 && (
                                                        <ul className="mt-3 space-y-2 ml-4">
                                                            {chapter.lectures.map((lecture) => (
                                                                <li key={lecture.id} className="text-gray-650 dark:text-gray-305 text-sm flex items-center gap-2">
                                                                    <span className="text-blue-500">❖</span>
                                                                    {lecture.title}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">No content available yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-soft p-6 sticky top-6">
                                <div className="mb-4">
                                    {appliedCoupon ? (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm text-gray-400 line-through">
                                                {formatCurrency(course.price)}
                                            </span>
                                            <span className="text-3xl font-extrabold text-green-600 dark:text-green-500">
                                                {formatCurrency(appliedCoupon.final_amount)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-500">
                                            {formatCurrency(course.price)}
                                        </div>
                                    )}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm mb-6 font-semibold">
                                    {course.validity_days} days access
                                </div>

                                {!course.isEnrolled && (
                                    <div className="border-t border-b border-gray-100 dark:border-gray-800 py-5 mb-6">
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/60 p-3 rounded-xl">
                                                <div className="min-w-0">
                                                    <span className="inline-block px-2 py-0.5 bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-[10px] font-black uppercase tracking-wider font-mono">
                                                        {appliedCoupon.code}
                                                    </span>
                                                    <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-semibold">
                                                        Discount of {formatCurrency(appliedCoupon.discount_amount)} applied!
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleRemoveCoupon}
                                                    className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 transition-colors focus:outline-none"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleApplyCoupon} className="space-y-2">
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-450 uppercase tracking-wider">
                                                    Promo/Coupon Code
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="ENTER CODE"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-xs uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isValidatingCoupon}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {isValidatingCoupon ? '...' : 'Apply'}
                                                    </button>
                                                </div>
                                                {couponError && (
                                                    <p className="text-xs text-red-650 dark:text-red-450 font-medium flex items-center gap-1 mt-1">
                                                        <span>⚠️</span> {couponError}
                                                    </p>
                                                )}
                                                {couponSuccess && (
                                                    <p className="text-xs text-green-655 dark:text-green-455 font-medium flex items-center gap-1 mt-1">
                                                        <span>✅</span> {couponSuccess}
                                                    </p>
                                                )}
                                            </form>
                                        )}
                                    </div>
                                )}

                                {course.isEnrolled ? (
                                    <Link
                                        href="/student/dashboard"
                                        className="block w-full bg-green-600 text-white text-center py-3.5 rounded-xl font-bold hover:bg-green-700 transition shadow-medium"
                                    >
                                        Go to Course
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handlePurchase}
                                        disabled={purchasing || !razorpayLoaded}
                                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-medium"
                                    >
                                        {!razorpayLoaded ? 'Loading Payment System...' : purchasing ? 'Processing...' : 'Enroll Now'}
                                    </button>
                                )}

                                <div className="mt-6 space-y-3 text-sm text-gray-550 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lifetime access
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Certificate of completion
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        AI-powered doubt solving
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth Required Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-premium max-w-md w-full overflow-hidden p-6 md:p-8 text-center">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                        <button
                            onClick={handleCloseAuthModal}
                            className="absolute top-4 right-4 text-gray-450 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-medium flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                            Account Required
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
                            To enroll in <span className="font-bold text-gray-800 dark:text-slate-200">"{course.title}"</span>, please log in or create a new account to keep your learning progress safe.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-2xl transition border border-slate-205 text-sm"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => router.push('/signup')}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white font-bold py-3 rounded-2xl transition shadow-medium text-sm"
                            >
                                Sign Up
                            </button>
                        </div>

                        <div className="text-xs text-gray-450 dark:text-gray-500 font-medium">
                            Auto-redirecting to Sign Up in <span className="text-blue-650 dark:text-blue-400 font-bold font-mono">{countdown}</span> seconds...
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Result Modal */}
            <PaymentResultModal
                type={paymentModal.type}
                title={paymentModal.title}
                message={paymentModal.message}
                onClose={closePaymentModal}
                onAction={paymentModal.type === 'success' ? () => router.push('/student/dashboard') : null}
                actionLabel="Go to Dashboard"
                secondaryLabel={paymentModal.type === 'error' ? 'Try Again' : undefined}
                onSecondary={paymentModal.type === 'error' ? () => { closePaymentModal(); handlePurchase(); } : undefined}
            />
        </>
    );
}
