// SEO utility functions for AS Academy

export const siteConfig = {
    name: 'AS Academy',
    domain: 'asacademy.site',
    url: 'https://asacademy.site',
    description: 'Best online courses for JEE, NEET, and competitive exam preparation. Expert-led courses with certificates.',
    keywords: [
        'online courses India',
        'JEE preparation online',
        'NEET coaching online',
        'competitive exam preparation',
        'online learning platform',
        'AS Academy',
        'online education',
        'exam preparation courses',
    ],
    ogImage: '/og-image.png',
    twitterHandle: '@asacademy',
}

export interface SEOProps {
    title?: string
    description?: string
    image?: string
    url?: string
    keywords?: string[]
    type?: 'website' | 'article' | 'course'
    publishedTime?: string
    modifiedTime?: string
}

export function generateMetadata({
    title,
    description = siteConfig.description,
    image = siteConfig.ogImage,
    url,
    keywords = siteConfig.keywords,
    type = 'website',
    publishedTime,
    modifiedTime,
}: SEOProps = {}) {
    const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
    const fullUrl = url ? `${siteConfig.url}${url}` : siteConfig.url
    const fullImage = image.startsWith('http') ? image : `${siteConfig.url}${image}`

    return {
        title: fullTitle,
        description,
        keywords: keywords.join(', '),
        authors: [{ name: siteConfig.name }],
        creator: siteConfig.name,
        publisher: siteConfig.name,
        metadataBase: new URL(siteConfig.url),
        alternates: {
            canonical: fullUrl,
        },
        openGraph: {
            type,
            title: fullTitle,
            description,
            url: fullUrl,
            siteName: siteConfig.name,
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: fullTitle,
                },
            ],
            locale: 'en_IN',
            ...(publishedTime && { publishedTime }),
            ...(modifiedTime && { modifiedTime }),
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [fullImage],
            creator: siteConfig.twitterHandle,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    }
}

export function generateCourseMetadata(course: {
    id: string
    title: string
    description: string
    thumbnail_url?: string
    price?: number
    instructor?: string
    updated_at?: string
}) {
    return generateMetadata({
        title: course.title,
        description: course.description,
        image: course.thumbnail_url || siteConfig.ogImage,
        url: `/courses/${course.id}`,
        type: 'course',
        keywords: [
            ...siteConfig.keywords,
            course.title,
            course.instructor || '',
            'online course',
        ],
        modifiedTime: course.updated_at,
    })
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${siteConfig.url}${item.url}`,
        })),
    }
}
