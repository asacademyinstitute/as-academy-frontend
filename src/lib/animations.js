// Animation variants library for Framer Motion
// Reusable animation configurations for consistent motion across the app

// ============================================
// PAGE TRANSITIONS
// ============================================
export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

export const pageFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

// ============================================
// SCROLL ANIMATIONS
// ============================================
export const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const fadeInLeft = {
    initial: { opacity: 0, x: -40 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const fadeInRight = {
    initial: { opacity: 0, x: 40 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

// ============================================
// STAGGER ANIMATIONS
// ============================================
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
};

// ============================================
// BUTTON INTERACTIONS
// ============================================
export const buttonHover = {
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" }
};

export const buttonTap = {
    scale: 0.95,
    transition: { duration: 0.1 }
};

export const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

export const glowButton = {
    initial: { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
    hover: {
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
        scale: 1.05
    },
    tap: { scale: 0.95 }
};

// ============================================
// CARD ANIMATIONS
// ============================================
export const cardHover = {
    initial: { y: 0, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)" },
    hover: {
        y: -8,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

export const card3D = {
    initial: { rotateX: 0, rotateY: 0 },
    hover: {
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.3 }
    }
};

// ============================================
// MODAL/DIALOG ANIMATIONS
// ============================================
export const modalBackdrop = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

export const modalContent = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

export const slideUpModal = {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// ============================================
// DRAWER/SIDEBAR ANIMATIONS
// ============================================
export const drawerLeft = {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

export const drawerRight = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// ============================================
// TOAST/NOTIFICATION ANIMATIONS
// ============================================
export const toastSlideIn = {
    initial: { x: 400, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 400, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// ============================================
// INPUT/FORM ANIMATIONS
// ============================================
export const inputFocus = {
    scale: 1.02,
    borderColor: "rgb(59, 130, 246)",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
};

export const shakeError = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
};

export const successCheckmark = {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { duration: 0.5, ease: "backOut" }
};

// ============================================
// LOADING ANIMATIONS
// ============================================
export const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

export const spinAnimation = {
    rotate: 360,
    transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
    }
};

// ============================================
// NUMBER COUNTER ANIMATION
// ============================================
export const counterVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};

// ============================================
// NAVBAR SCROLL ANIMATION
// ============================================
export const navbarScrolled = {
    height: "64px",
    backdropFilter: "blur(12px)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: { duration: 0.3 }
};

export const navbarTop = {
    height: "80px",
    backdropFilter: "blur(0px)",
    backgroundColor: "transparent",
    boxShadow: "none",
    transition: { duration: 0.3 }
};

// ============================================
// SPRING CONFIGS
// ============================================
export const springConfig = {
    type: "spring",
    stiffness: 300,
    damping: 30
};

export const gentleSpring = {
    type: "spring",
    stiffness: 200,
    damping: 25
};

export const bouncySpring = {
    type: "spring",
    stiffness: 400,
    damping: 20
};
