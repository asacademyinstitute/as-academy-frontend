'use client';

import Link from 'next/link';
import { ResponsiveNav } from '@/components/ui/navigation';

export default function PrivacyPolicyPage() {
    const navItems = [
        { label: 'Home', href: '/' },
        { label: 'Courses', href: '/courses' },
        { label: 'Login', href: '/login' },
    ];

    const navActions = (
        <>
            
            <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all touch-target text-sm md:text-base"
            >
                Sign Up
            </Link>
        </>
    );

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNav
                brand={{ name: 'AS ACADEMY', href: '/' }}
                items={navItems}
                actions={navActions}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-gray-600 mb-8">Last updated: December 2024</p>

                <div className="prose max-w-none space-y-8">
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Name and email address when you create an account</li>
                            <li>Payment information when you purchase courses</li>
                            <li>Course progress and completion data</li>
                            <li>Communications with our support team</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Monitor and analyze trends and usage</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                        <p className="text-gray-600">
                            We do not share your personal information with third parties except as described in this policy.
                            We may share information with service providers who perform services on our behalf, such as payment
                            processing and data analytics.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                        <p className="text-gray-600">
                            We take reasonable measures to help protect your personal information from loss, theft, misuse,
                            unauthorized access, disclosure, alteration, and destruction. However, no internet or email
                            transmission is ever fully secure or error-free.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
                        <p className="text-gray-600 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Access and update your personal information</li>
                            <li>Request deletion of your account and data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Request a copy of your data</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <Link href="/contact" className="text-blue-600 hover:underline">
                                support@asacademy.com
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
