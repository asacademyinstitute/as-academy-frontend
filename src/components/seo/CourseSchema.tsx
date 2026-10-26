import React from 'react';

interface CourseSchemaProps {
    name: string;
    description?: string;
    provider?: string;
    url: string;
    image?: string;
    price?: number;
    category?: string;
    instructor?: string;
    datePublished?: string;
    dateModified?: string;
}

export default function CourseSchema({
    name,
    description,
    provider = "AS Academy",
    url,
    image,
    price,
    category,
    instructor,
    datePublished,
    dateModified
}: CourseSchemaProps) {
    const cleanDescription = (description || `Learn ${name} online at ${provider}. Comprehensive course materials, video lectures, and notes.`)
        .replace(/[#*`_~]/g, '')
        .trim();

    const courseSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": cleanDescription,
        "provider": {
            "@type": "Organization",
            "name": provider,
            "sameAs": "https://asacademy.site",
            "logo": "https://asacademy.site/icon.png"
        },
        "url": url,
        ...(image && { "image": image }),
        "educationalCredentialAwarded": "Certificate of Completion",
        "inLanguage": "en-IN",
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "courseWorkload": "PT40H",
            ...(instructor && {
                "instructor": {
                    "@type": "Person",
                    "name": instructor
                }
            })
        }
    };

    if (category) {
        courseSchema.about = category;
        courseSchema.educationalLevel = category;
    }

    if (price !== undefined && price !== null) {
        courseSchema.offers = {
            "@type": "Offer",
            "price": price,
            "priceCurrency": "INR",
            "category": "Paid",
            "availability": "https://schema.org/InStock",
            "url": url
        };
    }

    if (datePublished) courseSchema.datePublished = datePublished;
    if (dateModified) courseSchema.dateModified = dateModified;

    // BreadcrumbList schema for rich Google search hierarchy (Home > Courses > Course Name)
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://asacademy.site"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Courses",
                "item": "https://asacademy.site/courses"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": name,
                "item": url
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
        </>
    );
}
