/**
 * Dynamic SEO Page Route
 * Handles all SEO content URLs: /msbte/*, /bca/*, /dbatu/*
 */

import SeoContentPage from '@/components/SeoContentPage';
import SeoHubPage from '@/components/SeoHubPage';

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;

    if (slug.length === 1 && ['msbte', 'bca', 'dbatu'].includes(slug[0].toLowerCase())) {
        return <SeoHubPage />;
    }

    return <SeoContentPage />;
}

// Generate static params for popular pages (optional, for SSG)
export async function generateStaticParams() {
    return [];
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;

    if (slug.length === 1 && ['msbte', 'bca', 'dbatu'].includes(slug[0].toLowerCase())) {
        const category = slug[0].toLowerCase();
        const categoryInfo = {
            msbte: {
                display: 'MSBTE',
                description: 'Complete study material for MSBTE diploma students - Notes, Question Papers, Projects & Exam Tips'
            },
            bca: {
                display: 'BCA',
                description: 'Comprehensive BCA study resources - Semester-wise notes, Previous year papers & Project ideas'
            },
            dbatu: {
                display: 'DBATU',
                description: 'Complete DBATU BTech study material - Branch-wise notes, Question papers & Career guidance'
            }
        };
        const info = categoryInfo[category as keyof typeof categoryInfo];
        if (info) {
            return {
                title: `${info.display} Notes, Question Papers & Study Material | AS Academy`,
                description: info.description
            };
        }
    }

    const slugStr = slug.join('/');

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/seo/page/${slugStr}`,
            { next: { revalidate: 3600 } } // Revalidate every hour
        );

        if (!response.ok) {
            return {
                title: 'Page Not Found | AS Academy',
                description: 'The requested page could not be found.'
            };
        }

        const data = await response.json();
        const page = data.data;

        return {
            title: page.title,
            description: page.meta_description,
            openGraph: {
                title: page.title,
                description: page.meta_description,
                type: 'article',
                images: page.thumbnail_url ? [page.thumbnail_url] : []
            }
        };
    } catch (error) {
        return {
            title: 'AS Academy',
            description: 'Educational content for MSBTE, BCA, and DBATU students'
        };
    }
}
