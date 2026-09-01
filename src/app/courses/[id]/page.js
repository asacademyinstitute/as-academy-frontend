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

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }) {
    const { id } = await params;
    const course = await getCourse(id);
    if (!course) {
        return {
            title: 'Course Not Found | AS Academy',
            description: 'The requested course could not be found.'
        };
    }

    return {
        title: `${course.title} | AS Academy`,
        description: course.description,
        openGraph: {
            title: course.title,
            description: course.description,
            type: 'website',
            images: course.thumbnail_url ? [course.thumbnail_url] : []
        }
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
                />
            )}
            <CourseDetailClient courseId={id} initialCourse={course} />
        </>
    );
}

