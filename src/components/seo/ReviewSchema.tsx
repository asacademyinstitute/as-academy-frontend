import React from 'react';

interface Review {
    author: string;
    rating: number;
    reviewBody: string;
    datePublished: string;
}

interface ReviewSchemaProps {
    itemName: string;
    reviews: Review[];
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
    };
}

export default function ReviewSchema({ itemName, reviews, aggregateRating }: ReviewSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: itemName,
        ...(aggregateRating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: aggregateRating.ratingValue,
                reviewCount: aggregateRating.reviewCount,
            },
        }),
        review: reviews.map((review) => ({
            '@type': 'Review',
            author: {
                '@type': 'Person',
                name: review.author,
            },
            datePublished: review.datePublished,
            reviewBody: review.reviewBody,
            reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
                bestRating: 5,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
