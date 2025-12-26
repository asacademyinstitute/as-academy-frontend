/**
 * Dynamic SEO Page Route
 * Handles all SEO content URLs: /msbte/*, /bca/*, /dbatu/*
 */

import SeoContentPage from '@/components/SeoContentPage';

export default function Page() {
    return <SeoContentPage />;
}

// Generate static params for popular pages (optional, for SSG)
export async function generateStaticParams() {
    // You can pre-generate popular pages here
    // For now, we'll use dynamic rendering
    return [];
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string[] } }) {
    const slug = params.slug.join('/');

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/seo/page/${slug}`,
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
