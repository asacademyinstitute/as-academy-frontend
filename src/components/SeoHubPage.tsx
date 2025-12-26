/**
 * SEO Hub Page Component
 * Category hub pages for MSBTE, BCA, DBATU
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

interface Subject {
    id: string;
    name: string;
    display_name: string;
    subject_code?: string;
    semester?: number;
}

interface SeoPage {
    id: string;
    title: string;
    url_slug: string;
    page_type: string;
    thumbnail_url?: string;
    view_count: number;
}

export default function SeoHubPage() {
    const params = useParams();
    const category = params.category as string; // 'msbte', 'bca', 'dbatu'

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [popularPages, setPopularPages] = useState<SeoPage[]>([]);
    const [loading, setLoading] = useState(true);

    const categoryInfo = {
        msbte: {
            display: 'MSBTE',
            full: 'Maharashtra State Board of Technical Education',
            description: 'Complete study material for MSBTE diploma students - Notes, Question Papers, Projects & Exam Tips'
        },
        bca: {
            display: 'BCA',
            full: 'Bachelor of Computer Applications',
            description: 'Comprehensive BCA study resources - Semester-wise notes, Previous year papers & Project ideas'
        },
        dbatu: {
            display: 'DBATU',
            full: 'Dr. Babasaheb Ambedkar Technological University',
            description: 'Complete DBATU BTech study material - Branch-wise notes, Question papers & Career guidance'
        }
    };

    const info = categoryInfo[category as keyof typeof categoryInfo];

    useEffect(() => {
        fetchData();
    }, [category]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch subjects
            const subjectsRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/seo/category/${category}/subjects`
            );
            const subjectsData = await subjectsRes.json();
            setSubjects(subjectsData.data || []);

            // Fetch popular pages
            const pagesRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/seo/category/${category}?limit=12`
            );
            const pagesData = await pagesRes.json();
            setPopularPages(pagesData.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{info.display} Notes, Question Papers & Study Material | AS Academy</title>
                <meta name="description" content={info.description} />
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            {info.display} Study Material
                        </h1>
                        <p className="text-xl text-blue-100 mb-2">
                            {info.full}
                        </p>
                        <p className="text-blue-100 max-w-3xl">
                            {info.description}
                        </p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <a
                                href={`/${category}/notes`}
                                className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <div className="text-3xl mb-2">📚</div>
                                <div className="font-semibold text-gray-900">Notes</div>
                                <div className="text-sm text-gray-500">Subject-wise</div>
                            </a>
                            <a
                                href={`/${category}/question-papers`}
                                className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <div className="text-3xl mb-2">📝</div>
                                <div className="font-semibold text-gray-900">Question Papers</div>
                                <div className="text-sm text-gray-500">Previous Years</div>
                            </a>
                            <a
                                href={`/${category}/projects`}
                                className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <div className="text-3xl mb-2">💡</div>
                                <div className="font-semibold text-gray-900">Projects</div>
                                <div className="text-sm text-gray-500">Ideas & Reports</div>
                            </a>
                            <a
                                href={`/${category}/exam-tips`}
                                className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <div className="text-3xl mb-2">🎯</div>
                                <div className="font-semibold text-gray-900">Exam Tips</div>
                                <div className="text-sm text-gray-500">Pass Strategies</div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Popular Resources */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Popular Resources
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {popularPages.map((page) => (
                                <a
                                    key={page.id}
                                    href={page.url_slug}
                                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-500 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                                            {page.page_type.replace('-', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {page.view_count} views
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {page.title}
                                    </h3>
                                    <div className="text-sm text-blue-600 font-medium">
                                        View Resource →
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Subjects Grid */}
                    {subjects.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                All Subjects
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subjects.map((subject) => (
                                    <a
                                        key={subject.id}
                                        href={`/${category}/notes/${subject.name}`}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {subject.display_name}
                                                </h3>
                                                {subject.subject_code && (
                                                    <p className="text-sm text-gray-500">
                                                        {subject.subject_code}
                                                    </p>
                                                )}
                                            </div>
                                            {subject.semester && (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    Sem {subject.semester}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA Section */}
                    <section className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">
                            Want Video Lectures & Live Doubt Solving?
                        </h2>
                        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                            Join our premium courses for detailed video explanations, live classes, and personalized mentorship
                        </p>
                        <a
                            href="/courses"
                            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Browse Courses
                        </a>
                    </section>
                </div>
            </div>
        </>
    );
}
