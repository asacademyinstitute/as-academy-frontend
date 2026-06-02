/**
 * SEO Content Page Component
 * Displays educational content (notes, question papers, projects, etc.)
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

interface SeoPage {
    id: string;
    title: string;
    meta_description: string;
    h1_tag: string;
    content: string;
    schema_markup: any;
    pdf_url?: string;
    thumbnail_url?: string;
    page_type: string;
    category: {
        name: string;
        display_name: string;
    };
    subject?: {
        display_name: string;
        subject_code?: string;
    };
    related_pages: Array<{
        id: string;
        title: string;
        url_slug: string;
        page_type: string;
        thumbnail_url?: string;
    }>;
}

export default function SeoContentPage() {
    const params = useParams();
    const [page, setPage] = useState<SeoPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Construct the full slug from params
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

    useEffect(() => {
        fetchPageContent();
    }, [slug]);

    const fetchPageContent = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seo/page/${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Page not found');
                } else {
                    throw new Error('Failed to fetch page');
                }
                return;
            }

            const data = await response.json();
            setPage(data.data);
        } catch (err) {
            setError('Error loading content');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!page?.pdf_url) return;

        // Track download
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seo/track-download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_id: page.id })
            });
        } catch (err) {
            console.error('Failed to track download:', err);
        }

        // Open PDF in new tab
        window.open(page.pdf_url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600">{error || 'Page not found'}</p>
                    <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                        Go back home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{page.title}</title>
                <meta name="description" content={page.meta_description} />
                {page.schema_markup && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schema_markup) }}
                    />
                )}
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Breadcrumb */}
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <nav className="flex text-sm text-gray-500">
                            <a href="/" className="hover:text-blue-600">Home</a>
                            <span className="mx-2">/</span>
                            <a href={`/${page.category.name}`} className="hover:text-blue-600 capitalize">
                                {page.category.display_name}
                            </a>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900">{page.subject?.display_name || 'Content'}</span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2">
                            <article className="bg-white rounded-lg shadow-sm p-6 md:p-8">
                                {/* Header */}
                                <header className="mb-8">
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                        {page.h1_tag}
                                    </h1>

                                    {page.subject && (
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                            {page.subject.subject_code && (
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                                    {page.subject.subject_code}
                                                </span>
                                            )}
                                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full capitalize">
                                                {page.page_type.replace('-', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </header>

                                {/* PDF Download Button */}
                                {page.pdf_url && (
                                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-blue-900 mb-1">
                                                    Download Complete {page.page_type === 'notes' ? 'Notes' : 'Material'} PDF
                                                </h3>
                                                <p className="text-sm text-blue-700">
                                                    Get all content in one PDF file
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleDownload}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                            >
                                                Download PDF
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div
                                    className="prose prose-lg max-w-none"
                                    dangerouslySetInnerHTML={{ __html: page.content }}
                                />
                            </article>
                        </div>

                        {/* Sidebar */}
                        <aside className="lg:col-span-1">
                            {/* Related Content */}
                            {page.related_pages && page.related_pages.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Related Resources
                                    </h3>
                                    <div className="space-y-3">
                                        {page.related_pages.map((relatedPage) => (
                                            <a
                                                key={relatedPage.id}
                                                href={relatedPage.url_slug}
                                                className="block p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                            >
                                                <p className="font-medium text-gray-900 text-sm mb-1">
                                                    {relatedPage.title}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {relatedPage.page_type.replace('-', ' ')}
                                                </p>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA Box */}
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
                                <h3 className="text-lg font-bold mb-2">
                                    Need More Help?
                                </h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    Join our courses for detailed video explanations and live doubt solving
                                </p>
                                <a
                                    href="/courses"
                                    className="block w-full bg-white text-blue-600 text-center px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                                >
                                    Browse Courses
                                </a>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
