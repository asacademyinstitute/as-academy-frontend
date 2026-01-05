'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook for animated number counter
 * Counts from 0 to target value with easing
 */
export function useCountUp(end, options = {}) {
    const {
        duration = 2000,
        start = 0,
        decimals = 0,
        enableScrollSpy = true
    } = options;

    const [count, setCount] = useState(start);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        // Only animate when in view (if scroll spy enabled) and hasn't animated yet
        if ((enableScrollSpy && !isInView) || hasAnimated) return;

        setHasAnimated(true);
        const startTime = Date.now();
        const startValue = start;
        const endValue = end;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Easing function (easeOutCubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentCount = startValue + (endValue - startValue) * easeProgress;
            setCount(Number(currentCount.toFixed(decimals)));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration, start, decimals, isInView, enableScrollSpy, hasAnimated]);

    return [ref, count];
}
