export const metadata = {
    title: 'All Courses & Study Materials | AS Academy',
    description: 'Explore expert-led online courses for Diploma, B.Tech, BCA, MCA, and Coding on AS Academy. Video lectures, handwritten notes, and certificates.',
    keywords: 'online courses, diploma engineering, MSBTE classes, BTech coaching, BCA online classes, coding bootcamp, AS Academy',
    alternates: {
        canonical: 'https://www.asacademy.site/courses',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: 'All Courses & Study Materials | AS Academy',
        description: 'Explore expert-led online courses for Diploma, B.Tech, BCA, MCA, and Coding on AS Academy.',
        url: 'https://www.asacademy.site/courses',
        siteName: 'AS Academy',
        locale: 'en_IN',
        type: 'website',
        images: [
            {
                url: 'https://www.asacademy.site/og-image.png',
                width: 1200,
                height: 630,
                alt: 'AS Academy Courses',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'All Courses & Study Materials | AS Academy',
        description: 'Explore expert-led online courses for Diploma, B.Tech, BCA, MCA, and Coding on AS Academy.',
        images: ['https://www.asacademy.site/og-image.png'],
    },
};

export default function CoursesLayout({ children }) {
    return <>{children}</>;
}
