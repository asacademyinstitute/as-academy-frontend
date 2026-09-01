import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://asacademy.site';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://as-academy-backend.onrender.com/api';

    // 1. Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/courses`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/signup`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // 2. Fetch Dynamic Course Pages
    let coursePages: MetadataRoute.Sitemap = [];
    try {
        const response = await fetch(`${apiUrl}/courses?limit=1000`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (response.ok) {
            const result = await response.json();
            const courses = result.data?.courses || [];
            coursePages = courses.map((course: any) => ({
                url: `${baseUrl}/courses/${course.id}`,
                lastModified: new Date(course.updated_at || course.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));
        }
    } catch (error) {
        console.error('Failed to fetch courses for sitemap:', error);
    }

    // 3. Fetch Dynamic Database-driven SEO Pages
    let seoPages: MetadataRoute.Sitemap = [];
    try {
        const response = await fetch(`${apiUrl}/seo/sitemap`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            seoPages = pages.map((page: any) => ({
                url: `${baseUrl}/${page.url_slug}`,
                lastModified: new Date(page.updated_at || page.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Failed to fetch SEO pages for sitemap:', error);
    }

    return [...staticPages, ...coursePages, ...seoPages];
}
