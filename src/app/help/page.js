'use client';

import Link from 'next/link';
import { ResponsiveNav } from '@/components/ui/navigation';

export default function HelpCenterPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Help Center</h1>

                <div className="space-y-8">
                    {/* Video Tutorial Section */}
                    <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">📹 Video Tutorial</h2>
                        <p className="text-gray-700 mb-4">
                            Need help purchasing a course? Watch our step-by-step video guide:
                        </p>
                        <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/F61IlfJvQPk"
                                title="How to Purchase Course - AS Academy Tutorial"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">How do I enroll in a course?</h3>
                                <p className="text-gray-600">
                                    Browse our courses page, select the course you're interested in, and click the "Enroll Now" button.
                                    You'll need to create an account and complete the payment process.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">How long do I have access to a course?</h3>
                                <p className="text-gray-600">
                                    Course access duration varies by course. Most courses provide access for the validity period mentioned
                                    on the course page. Check the course details for specific information.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Do I get a certificate after completing a course?</h3>
                                <p className="text-gray-600">
                                    Yes! Upon successful completion of all course lectures and assessments, you'll receive a digital
                                    certificate that you can download and share.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Can I get a refund?</h3>
                                <p className="text-gray-700">
                                    We offer 50% refund within 7 days of purchase if you haven't accessed more than 20% of the course content.
                                    Contact our support team for refund requests.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">How do I reset my password?</h3>
                                <p className="text-gray-600">
                                    Click on "Forgot Password" on the login page, enter your email address, and we'll send you
                                    instructions to reset your password.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-blue-50 p-8 rounded-lg">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still need help?</h2>
                        <p className="text-gray-600 mb-4">
                            Can't find the answer you're looking for? Our support team is here to help.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all"
                        >
                            Contact Support
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
