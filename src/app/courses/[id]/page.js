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
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [contentExpanded, setContentExpanded] = useState(false);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [params.id]);

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

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            alert('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        try {
            const response = await couponAPI.validate(couponCode.trim(), course.id);
            setAppliedCoupon(response.data.data);
            alert('Coupon applied successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Invalid coupon code');
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
    };

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if Razorpay script is loaded
        if (!razorpayLoaded || !window.Razorpay) {
            alert('Payment system is loading. Please wait a moment and try again.');
            console.error('Razorpay script not loaded yet');
            return;
        }

        setPurchasing(true);
        try {
            console.log('Creating payment order for course:', course.id);
            const orderResponse = await paymentAPI.createOrder(course.id, appliedCoupon?.code || null);
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
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{course.title}</h1>
                                <div className="mb-6">
                                    <p className={`text-gray-600 dark:text-gray-400 text-lg ${!descriptionExpanded ? 'line-clamp-3' : ''}`}>
                                        {course.description}
                                    </p>
                                    {course.description && course.description.length > 150 && (
                                        <button
                                            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm mt-2 font-medium"
                                        >
                                            {descriptionExpanded ? 'Show less' : 'Read more'}
                                        </button>
                                    )}
                                </div>

                                {course.users && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instructor</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{course.users.name}</p>
                                    </div>
                                )}

                                <div className="border-t pt-6">
                                    <button
                                        onClick={() => setContentExpanded(!contentExpanded)}
                                        className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition"
                                    >
                                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Course Content</h3>
                                        <span className="text-2xl text-gray-600 dark:text-gray-400">
                                            {contentExpanded ? '−' : '+'}
                                        </span>
                                    </button>
                                    {contentExpanded && (
                                        course.chapters && course.chapters.length > 0 ? (
                                            <div className="space-y-4">
                                                {course.chapters.map((chapter, idx) => (
                                                    <div key={chapter.id} className="border rounded-lg p-4">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {idx + 1}. {chapter.title}
                                                        </h4>
                                                        {chapter.lectures && chapter.lectures.length > 0 && (
                                                            <ul className="mt-2 space-y-1 ml-4">
                                                                {chapter.lectures.map((lecture) => (
                                                                    <li key={lecture.id} className="text-gray-600 dark:text-gray-400 text-sm">
                                                                        • {lecture.title}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">No content available yet</p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 sticky top-6">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                                    {formatCurrency(course.price)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 mb-6">
                                    {course.validity_days} days access
                                </div>

                                {course.isEnrolled ? (
                                    <Link
                                        href="/student/dashboard"
                                        className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700"
                                    >
                                        Go to Course
                                    </Link>
                                ) : (
                                    <>
                                        {/* Coupon Input */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Have a coupon code?
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    placeholder="Enter code"
                                                    disabled={appliedCoupon}
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                                />
                                                {appliedCoupon ? (
                                                    <button
                                                        onClick={handleRemoveCoupon}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={couponLoading || !couponCode.trim()}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {couponLoading ? 'Checking...' : 'Apply'}
                                                    </button>
                                                )}
                                            </div>
                                            {appliedCoupon && (
                                                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-400">
                                                    ✓ Coupon "{appliedCoupon.code}" applied!
                                                </div>
                                            )}
                                        </div>

                                        {/* Price Breakdown */}
                                        {appliedCoupon && (
                                            <div className="mb-4 space-y-2 text-sm">
                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Original Price:</span>
                                                    <span>{formatCurrency(appliedCoupon.original_amount)}</span>
                                                </div>
                                                <div className="flex justify-between text-green-600 dark:text-green-400">
                                                    <span>Discount:</span>
                                                    <span>- {formatCurrency(appliedCoupon.discount_amount)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                                    <span>Final Price:</span>
                                                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(appliedCoupon.final_amount)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handlePurchase}
                                            disabled={purchasing || !razorpayLoaded}
                                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {!razorpayLoaded ? 'Loading Payment System...' : purchasing ? 'Processing...' : `Enroll Now ${appliedCoupon ? `- ${formatCurrency(appliedCoupon.final_amount)}` : ''}`}
                                        </button>
                                    </>
                                )}

                                <div className="mt-6 space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lifetime access
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Certificate of completion
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </>
    );
}
