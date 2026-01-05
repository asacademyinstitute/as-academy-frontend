// Framer Motion configuration utilities
// Global motion settings and accessibility helpers

import { MotionConfig } from 'framer-motion';

// ============================================
// REDUCED MOTION CONFIG
// ============================================
export const reducedMotionConfig = {
    transition: { duration: 0 },
    initial: false,
    animate: { opacity: 1 },
    exit: { opacity: 1 }
};

// ============================================
// EASING FUNCTIONS
// ============================================
export const easings = {
    // Apple-style easings
    easeInOut: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],

    // Custom easings
    smooth: [0.25, 0.1, 0.25, 1],
    snappy: [0.4, 0, 0.6, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],

    // Material Design
    standard: [0.4, 0, 0.2, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1]
};

// ============================================
// DURATION PRESETS
// ============================================
export const durations = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    slower: 0.7,
    slowest: 1
};

// ============================================
// GLOBAL MOTION CONFIG
// ============================================
export const globalMotionConfig = {
    reducedMotion: "user", // Respect user's motion preferences
    transition: {
        duration: durations.normal,
        ease: easings.easeInOut
    }
};

// ============================================
// VIEWPORT CONFIG FOR SCROLL ANIMATIONS
// ============================================
export const viewportConfig = {
    once: true, // Animate only once
    margin: "-50px", // Trigger 50px before element enters viewport
    amount: 0.3 // Trigger when 30% of element is visible
};

// ============================================
// DRAG CONSTRAINTS
// ============================================
export const dragConstraints = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
};

// ============================================
// LAYOUT ANIMATION CONFIG
// ============================================
export const layoutTransition = {
    layout: {
        duration: durations.normal,
        ease: easings.easeInOut
    }
};
