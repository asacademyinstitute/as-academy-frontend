'use client';

import { motion } from 'framer-motion';
import AnimatedButton from './animated-button';

/**
 * Empty state component for when there's no data to display
 */
export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
        >
            {icon && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-6"
                >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                        {icon}
                    </div>
                </motion.div>
            )}

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl md:text-2xl font-heading font-semibold text-gray-900 mb-2"
            >
                {title}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 max-w-md mb-6"
            >
                {description}
            </motion.p>

            {actionLabel && onAction && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <AnimatedButton
                        variant="primary"
                        onClick={onAction}
                    >
                        {actionLabel}
                    </AnimatedButton>
                </motion.div>
            )}
        </motion.div>
    );
}

/**
 * Predefined empty states for common scenarios
 */
export function NoCourses({ onAction }) {
    return (
        <EmptyState
            icon={
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            }
            title="No courses yet"
            description="Start your learning journey by enrolling in a course"
            actionLabel="Browse Courses"
            onAction={onAction}
        />
    );
}

export function NoData({ title = "No data available", description = "There's nothing to show here yet" }) {
    return (
        <EmptyState
            icon={
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            }
            title={title}
            description={description}
        />
    );
}

export function SearchNoResults({ searchTerm }) {
    return (
        <EmptyState
            icon={
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            }
            title="No results found"
            description={searchTerm ? `No results for "${searchTerm}". Try adjusting your search.` : "Try adjusting your search criteria"}
        />
    );
}
