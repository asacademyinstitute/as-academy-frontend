import React from 'react';

interface CourseSchemaProps {
    name: string;
    description: string;
    provider: string;
    url: string;
    image?: string;
}

export default function CourseSchema({
    name,
    description,
    provider = "AS Academy",
    url,
    image
}: CourseSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": description,
        "provider": {
            "@type": "Organization",
            "name": provider,
            "sameAs": "https://asacademy.in"
        },
        "url": url,
        ...(image && { "image": image }),
        "educationalLevel": "Diploma",
        "audience": {
            "@type": "EducationalAudience",
            "educationalRole": "student"
        },
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "courseWorkload": "PT40H"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
