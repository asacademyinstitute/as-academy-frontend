import CourseDetailClient from './CourseDetailClient';
import CourseSchema from '@/components/seo/CourseSchema';

async function getCourse(id) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://as-academy-backend.onrender.com/api';
    try {
        const res = await fetch(`${apiUrl}/courses/${id}`, {
            next: { revalidate: 60 } // Revalidate every minute
        });
        if (!res.ok) return null;
        const result = await res.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching course on server:', error);
        return null;
    }
}

// Generate dynamic metadata for Automatic SEO & Search Engine Indexing
export async function generateMetadata({ params }) {
    const { id } = await params;
    const course = await getCourse(id);
    const baseUrl = 'https://asacademy.site';
    const pageUrl = `${baseUrl}/courses/${id}`;

    if (!course) {
        return {
            title: 'Course Not Found | AS Academy',
            description: 'The requested course could not be found on AS Academy.',
            robots: {
                index: false,
                follow: false,
            }
        };
    }

    // Clean description (strip markdown/HTML, max 160 chars for optimal Google snippet)
    const rawDesc = course.description || `Enroll in ${course.title} at AS Academy. High quality lectures, study materials, and expert guidance.`;
    const cleanDesc = rawDesc.replace(/[#*`_~]/g, '').replace(/\s+/g, ' ').trim();
    const metaDescription = cleanDesc.length > 155 ? `${cleanDesc.substring(0, 155)}...` : cleanDesc;

    // Build intelligent, targeted keywords
    const keywords = [
        course.title,
        course.category ? `${course.category} courses` : '',
        course.semester || '',
        'AS Academy',
        'MSBTE diploma courses',
        'engineering online courses',
        'video lectures',
        'notes and question bank',
        course.users?.name ? `Instructor: ${course.users.name}` : '',
        'online certification',
        'exam preparation India'
    ].filter(Boolean);

    const imageUrl = course.thumbnail_url || `${baseUrl}/og-image.png`;

    return {
        title: `${course.title} | AS Academy`,
        description: metaDescription,
        keywords: keywords.join(', '),
        authors: [{ name: course.users?.name || 'AS Academy' }],
        creator: 'AS Academy',
        publisher: 'AS Academy',
        alternates: {
            canonical: pageUrl,
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
        openGraph: {
            title: `${course.title} | AS Academy`,
            description: metaDescription,
            url: pageUrl,
            siteName: 'AS Academy',
            locale: 'en_IN',
            type: 'website',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: course.title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${course.title} | AS Academy`,
            description: metaDescription,
            images: [imageUrl],
            creator: '@asacademy',
        },
    };
}

export default async function CourseDetailPage({ params }) {
    const { id } = await params;
    const course = await getCourse(id);
    const pageUrl = `https://asacademy.site/courses/${id}`;

    return (
        <>
            {course && (
                <CourseSchema
                    name={course.title}
                    description={course.description}
                    provider="AS Academy"
                    url={pageUrl}
                    image={course.thumbnail_url}
                    price={course.price}
                    category={course.category}
                    instructor={course.users?.name}
                    datePublished={course.created_at}
                    dateModified={course.updated_at}
                />
            )}
            <CourseDetailClient courseId={id} initialCourse={course} />
        </>
    );
}
