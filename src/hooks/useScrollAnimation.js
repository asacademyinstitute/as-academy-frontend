'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook for scroll-triggered animations
 * Detects when element enters viewport
 */
export function useScrollAnimation(options = {}) {
    const {
        threshold = 0.3,
        triggerOnce = true,
        rootMargin = '-50px'
    } = options;

    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsInView(false);
                }
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [threshold, triggerOnce, rootMargin]);

    return [ref, isInView];
}
