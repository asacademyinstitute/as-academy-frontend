import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.asacademy.site';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://as-academy-backend.onrender.com/api';

    // 1. Static Core Pages
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

    // 2. Fetch All Active Dynamic Course Pages Automatically
    let coursePages: MetadataRoute.Sitemap = [];
    try {
        const response = await fetch(`${apiUrl}/courses?limit=1000`, {
            next: { revalidate: 300 } // Auto-revalidate every 5 minutes for newly added courses
        });

        if (response.ok) {
            const result = await response.json();
            const rawCourses = result.data?.courses || result.data || [];
            
            // Filter only active courses (exclude drafts or soft-deleted)
            const activeCourses = rawCourses.filter((course: any) => {
                if (!course?.id) return false;
                if (course.status && course.status !== 'active' && course.status !== 'published') {
                    return false;
                }
                return true;
            });

            coursePages = activeCourses.map((course: any) => ({
                url: `${baseUrl}/courses/${course.id}`,
                lastModified: new Date(course.updated_at || course.created_at || new Date()),
                changeFrequency: 'daily',
                priority: 0.9,
            }));
        }
    } catch (error) {
        console.error('Failed to fetch courses for sitemap:', error);
    }

    // 3. Fetch Dynamic Database-driven SEO landing Pages
    let seoPages: MetadataRoute.Sitemap = [];
    try {
        const response = await fetch(`${apiUrl}/seo/sitemap`, {
            next: { revalidate: 300 }
        });
        if (response.ok) {
            const result = await response.json();
            const pages = result.data || [];
            seoPages = pages
                .filter((p: any) => p?.url_slug)
                .map((page: any) => ({
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
