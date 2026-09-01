'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Page transition wrapper component
 * Wraps page content to provide smooth transitions between routes
 */
export default function PageTransition({ children }) {
    const pathname = usePathname();
    const prefersReducedMotion = useReducedMotion();

    const variants = prefersReducedMotion
        ? {
            initial: { opacity: 1 },
            animate: { opacity: 1 },
            exit: { opacity: 1 }
        }
        : {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 }
        };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
