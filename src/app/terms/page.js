'use client';

import Link from 'next/link';
import { ResponsiveNav } from '@/components/ui/navigation';

export default function TermsOfServicePage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                <p className="text-gray-600 mb-8">Last updated: December 2024</p>

                <div className="prose max-w-none space-y-8">
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600">
                            By accessing and using AS Academy's services, you accept and agree to be bound by the terms and
                            provisions of this agreement. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
                        <p className="text-gray-600 mb-4">
                            When you create an account with us, you must provide accurate and complete information. You are
                            responsible for:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Maintaining the security of your account and password</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Course Access and Content</h2>
                        <p className="text-gray-600 mb-4">
                            Upon enrollment in a course:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>You receive a limited, non-exclusive, non-transferable license to access the course content</li>
                            <li>Access is granted for the duration specified in the course details</li>
                            <li>You may not share your account credentials with others</li>
                            <li>You may not download, reproduce, or distribute course materials without permission</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payments and Refunds</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>All payments are processed securely through our payment gateway</li>
                            <li>Course prices are subject to change without notice</li>
                            <li>Promotional discounts are valid for limited periods</li>
                            <li>50% refund available within 7 days if less than 20% of course content has been accessed</li>
                            <li>No refunds after the 7-day period or if more than 20% content is accessed</li>
                            <li>Refund processing may take 7-10 business days</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Conduct</h2>
                        <p className="text-gray-600 mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Use the service for any illegal purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Share course content without authorization</li>
                            <li>Harass or harm other users</li>
                            <li>Upload malicious code or viruses</li>
                        </ul>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                        <p className="text-gray-600">
                            All content on AS Academy, including courses, text, graphics, logos, and software, is the property
                            of AS Academy or its content suppliers and is protected by copyright and intellectual property laws.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
                        <p className="text-gray-600">
                            AS Academy shall not be liable for any indirect, incidental, special, consequential, or punitive
                            damages resulting from your use or inability to use the service.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
                        <p className="text-gray-600">
                            We reserve the right to modify these terms at any time. We will notify users of any material changes
                            via email or through the platform.
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
                        <p className="text-gray-600">
                            For questions about these Terms of Service, please contact us at{' '}
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
