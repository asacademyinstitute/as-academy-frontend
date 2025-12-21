import React from 'react';

interface OrganizationSchemaProps {
    name?: string;
    url?: string;
    logo?: string;
    description?: string;
}

export default function OrganizationSchema({
    name = "AS Academy",
    url = "https://asacademy.in",
    logo = "https://asacademy.in/logo.png",
    description = "Leading MSBTE K Scheme Computer Engineering courses platform offering comprehensive diploma courses, question papers, and video lectures for CO students."
}: OrganizationSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": name,
        "url": url,
        "logo": logo,
        "description": description,
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "sameAs": [
            "https://www.facebook.com/asacademy",
            "https://www.instagram.com/asacademy",
            "https://www.youtube.com/@asacademy"
        ],
        "offers": {
            "@type": "Offer",
            "category": "MSBTE K Scheme Courses"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
