'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Scroll reveal component - animates children when scrolled into view
 */
export default function ScrollReveal({
    children,
    animation = 'fadeInUp',
    delay = 0,
    duration = 0.6,
    className = ''
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const prefersReducedMotion = useReducedMotion();

    const animations = {
        fadeInUp: {
            initial: { opacity: 0, y: 40 },
            animate: { opacity: 1, y: 0 }
        },
        fadeInLeft: {
            initial: { opacity: 0, x: -40 },
            animate: { opacity: 1, x: 0 }
        },
        fadeInRight: {
            initial: { opacity: 0, x: 40 },
            animate: { opacity: 1, x: 0 }
        },
        scaleIn: {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 }
        },
        fadeIn: {
            initial: { opacity: 0 },
            animate: { opacity: 1 }
        }
    };

    const selectedAnimation = animations[animation] || animations.fadeInUp;

    if (prefersReducedMotion) {
        return <div ref={ref} className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={selectedAnimation.initial}
            animate={isInView ? selectedAnimation.animate : selectedAnimation.initial}
            transition={{
                duration,
                delay,
                ease: [0.4, 0, 0.2, 1]
            }}
        >
            {children}
        </motion.div>
    );
}
