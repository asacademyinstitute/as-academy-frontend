'use client';

import { motion } from 'framer-motion';
import { useState, forwardRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Animated input component with floating label and validation states
 */
const AnimatedInput = forwardRef(({
    label,
    error,
    success,
    type = 'text',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(props.value || props.defaultValue || '');
    const prefersReducedMotion = useReducedMotion();

    const handleChange = (e) => {
        setHasValue(e.target.value);
        if (props.onChange) {
            props.onChange(e);
        }
    };

    const labelVariants = prefersReducedMotion
        ? {}
        : {
            float: {
                y: -24,
                scale: 0.85,
                color: error ? '#ef4444' : success ? '#10b981' : '#3b82f6',
            },
            default: {
                y: 0,
                scale: 1,
                color: '#6b7280',
            }
        };

    const inputVariants = prefersReducedMotion
        ? {}
        : {
            focus: {
                scale: 1.01,
                borderColor: error ? '#ef4444' : success ? '#10b981' : '#3b82f6',
                boxShadow: error
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                    : success
                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)'
                        : '0 0 0 3px rgba(59, 130, 246, 0.1)',
            },
            blur: {
                scale: 1,
                borderColor: error ? '#ef4444' : success ? '#10b981' : '#d1d5db',
                boxShadow: 'none',
            }
        };

    const errorVariants = prefersReducedMotion
        ? {}
        : {
            initial: { opacity: 0, x: -10 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -10 }
        };

    const isFloating = isFocused || hasValue;

    return (
        <div className={`relative ${containerClassName}`}>
            {label && (
                <motion.label
                    className="absolute left-4 pointer-events-none origin-left font-medium"
                    variants={labelVariants}
                    animate={isFloating ? 'float' : 'default'}
                    transition={{ duration: 0.2 }}
                    style={{ top: '1rem' }}
                >
                    {label}
                </motion.label>
            )}

            <motion.input
                ref={ref}
                type={type}
                className={`
          w-full px-4 py-3 pt-6 rounded-lg border-2 transition-colors
          focus:outline-none font-body
          ${error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300'}
          ${className}
        `}
                variants={inputVariants}
                animate={isFocused ? 'focus' : 'blur'}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={handleChange}
                {...props}
            />

            {error && (
                <motion.p
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                    variants={errorVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </motion.p>
            )}

            {success && (
                <motion.p
                    className="mt-2 text-sm text-green-600 flex items-center gap-1"
                    variants={errorVariants}
                    initial="initial"
                    animate="animate"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                </motion.p>
            )}
        </div>
    );
});

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;
