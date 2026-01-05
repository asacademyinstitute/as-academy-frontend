'use client';

import { motion } from 'framer-motion';

/**
 * Skeleton loader component for loading states
 */
export function Skeleton({ className = '', variant = 'default', ...props }) {
    const variants = {
        default: 'bg-gray-200',
        card: 'bg-white border border-gray-200',
        text: 'bg-gray-200 rounded',
        circle: 'bg-gray-200 rounded-full',
    };

    return (
        <motion.div
            className={`skeleton ${variants[variant]} ${className}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            {...props}
        />
    );
}

/**
 * Card skeleton for loading course/content cards
 */
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-soft p-6 space-y-4">
            <Skeleton variant="default" className="h-48 w-full rounded-lg" />
            <Skeleton variant="text" className="h-6 w-3/4" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
                <Skeleton variant="default" className="h-10 w-24 rounded-lg" />
                <Skeleton variant="default" className="h-10 w-24 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <Skeleton variant="text" className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

/**
 * Dashboard stats skeleton
 */
export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-soft p-6">
                    <Skeleton variant="circle" className="h-12 w-12 mb-4" />
                    <Skeleton variant="text" className="h-8 w-20 mb-2" />
                    <Skeleton variant="text" className="h-4 w-32" />
                </div>
            ))}
        </div>
    );
}
