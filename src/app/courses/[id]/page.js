'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { coursesAPI, paymentAPI, couponAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import useAuthStore from '@/store/authStore';

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            setRazorpayLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchCourse();
    }, [params.id]);

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
            console.log('Validating coupon:', couponCode, 'for course:', course.id);
            const response = await couponAPI.validate(couponCode.trim(), course.id);
            console.log('Coupon validation response:', response.data);
            
            const couponData = response.data.data;
            setAppliedCoupon(couponData);
            setCouponSuccess(`Coupon applied! Saved ${formatCurrency(couponData.discount_amount)}`);
        } catch (error) {
            console.error('Coupon validation failed:', error);
            const errMsg = error.response?.data?.message || 'Invalid coupon code';
            setCouponError(errMsg);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponSuccess('');
        setCouponError('');
    };

    const handleCloseAuthModal = () => {
        setShowAuthModal(false);
    };

    const fetchCourse = async () => {
        try {
            const response = await coursesAPI.getById(params.id);
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

        // Check if Razorpay script is loaded
        if (!razorpayLoaded || !window.Razorpay) {
            alert('Payment system is loading. Please wait a moment and try again.');
            console.error('Razorpay script not loaded yet');
            return;
        }

        const finalAmount = appliedCoupon ? appliedCoupon.final_amount : course.price;
        setPurchasing(true);
        try {
            console.log('Creating payment order for course:', course.id, 'with amount:', finalAmount);
            const orderResponse = await paymentAPI.createOrder(course.id, finalAmount);
            console.log('Order response:', orderResponse.data);

            const { orderId, amount, currency, keyId } = orderResponse.data.data;

            if (!orderId || !keyId) {
                throw new Error('Invalid order data received from server');
            }

            console.log('Opening Razorpay with order:', orderId);

            const options = {
                key: keyId,
                amount,
                currency,
                name: 'AS Academy',
                description: course.title,
                order_id: orderId,
                handler: async function (response) {
                    console.log('Payment successful, verifying...', response);
                    try {
                        await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        alert('Payment successful! You can now access the course.');
                        router.push('/student/dashboard');
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log('Payment modal closed by user');
                        setPurchasing(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                alert(`Payment failed: ${response.error.description}`);
                setPurchasing(false);
            });

            razorpay.open();
        } catch (error) {
            console.error('Error creating order:', error);
            alert(`Failed to create order: ${error.response?.data?.message || error.message}`);
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
            {/* Load Razorpay Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => {
                    console.log('Razorpay script loaded successfully');
                    setRazorpayLoaded(true);
                }}
                onError={(e) => {
                    console.error('Failed to load Razorpay script:', e);
                    alert('Failed to load payment system. Please refresh the page.');
                }}
            />

            <div className="min-h-screen bg-background dark:bg-gray-950">
                <div className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Link href="/courses" className="text-blue-600 hover:text-blue-700">
                            ← Back to Courses
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-md p-8">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                                <p className="text-gray-600 text-lg mb-6">{course.description}</p>

                                {course.users && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">Instructor</h3>
                                        <p className="text-gray-600">{course.users.name}</p>
                                    </div>
                                )}

                                <div className="border-t pt-6">
                                    <h3 className="text-2xl font-semibold mb-4">Course Content</h3>
                                    {course.chapters && course.chapters.length > 0 ? (
                                        <div className="space-y-4">
                                            {course.chapters.map((chapter, idx) => (
                                                <div key={chapter.id} className="border rounded-lg p-4">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {idx + 1}. {chapter.title}
                                                    </h4>
                                                    {chapter.lectures && chapter.lectures.length > 0 && (
                                                        <ul className="mt-2 space-y-1 ml-4">
                                                            {chapter.lectures.map((lecture) => (
                                                                <li key={lecture.id} className="text-gray-600 text-sm">
                                                                    • {lecture.title}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No content available yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 sticky top-6 border border-slate-100 dark:border-slate-800">
                                {/* Price Details */}
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
                                <div className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                                    {course.validity_days} days access
                                </div>

                                {/* Coupon Apply UI Block */}
                                {!course.isEnrolled && (
                                    <div className="border-t border-b border-slate-100 dark:border-slate-800 py-5 mb-6">
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/60 p-3 rounded-xl transition-all">
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
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    Promo/Coupon Code
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="ENTER CODE"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                                    <p className="text-xs text-red-600 dark:text-red-500 font-medium flex items-center gap-1 mt-1">
                                                        <span>⚠️</span> {couponError}
                                                    </p>
                                                )}
                                                {couponSuccess && (
                                                    <p className="text-xs text-green-600 dark:text-green-500 font-medium flex items-center gap-1 mt-1">
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
                                        className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-medium"
                                    >
                                        Go to Course
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handlePurchase}
                                        disabled={purchasing || !razorpayLoaded}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-medium"
                                    >
                                        {!razorpayLoaded ? 'Loading Payment System...' : purchasing ? 'Processing...' : 'Enroll Now'}
                                    </button>
                                )}

                                <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
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

            {/* Custom Auth Prompt Modal matching AS ACADEMY premium style */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-premium max-w-md w-full overflow-hidden p-6 md:p-8 text-center transition-all scale-100">
                        {/* Elegant accent strip */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-48 h-12 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />

                        {/* Top close button */}
                        <button
                            onClick={handleCloseAuthModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-medium flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        {/* Content */}
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                            Account Required
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
                            To enroll in <span className="font-bold text-gray-800 dark:text-slate-200">"{course.title}"</span>, please log in or create a new account to keep your learning progress safe.
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-2xl transition shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-sm"
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

                        {/* Auto-redirect alert footer */}
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            Auto-redirecting to Sign Up in <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">{countdown}</span> seconds...
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
