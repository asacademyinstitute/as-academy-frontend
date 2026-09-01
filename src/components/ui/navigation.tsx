'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Menu, X } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
}

interface ResponsiveNavProps {
    brand: {
        name: string;
        href: string;
    };
    items: NavItem[];
    actions?: React.ReactNode;
    className?: string;
}

export function ResponsiveNav({ brand, items, actions, className }: ResponsiveNavProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const pathname = usePathname();

    // Close mobile menu when route changes
    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    React.useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    return (
        <>
            <nav className={cn(
                "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-border/40",
                className
            )}>
                <div className="max-w-7xl mx-auto container-padding">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand */}
                        <Link href={brand.href} className="flex items-center gap-2">
                            <Image
                                src="/icons/icon-192x192.png"
                                alt="AS Academy Logo"
                                width={32}
                                height={32}
                                className="rounded-lg object-contain"
                            />
                            <h1 className="text-lg font-bold gradient-text hidden sm:block">
                                {brand.name}
                            </h1>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            {items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        pathname === item.href
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            {actions && <div className="flex items-center space-x-3">{actions}</div>}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors touch-target"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-16 right-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 md:hidden overflow-y-auto safe-bottom"
                        >
                            <div className="flex flex-col p-6 space-y-6">
                                {/* Navigation Items */}
                                <div className="flex flex-col space-y-4">
                                    {items.map((item, index) => (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all touch-target",
                                                    pathname === item.href
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : "text-foreground hover:bg-accent"
                                                )}
                                            >
                                                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                                                <span>{item.label}</span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Actions */}
                                {actions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: items.length * 0.05 }}
                                        className="pt-6 border-t border-border space-y-3"
                                    >
                                        {actions}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Mobile Bottom Navigation Component
interface MobileBottomNavProps {
    navItems: NavItem[];
    brandHref?: string;
}

function MobileBottomNav({ navItems, brandHref }: MobileBottomNavProps) {
    const pathname = usePathname();

    const midIndex = Math.ceil(navItems.length / 2);
    const leftItems = navItems.slice(0, midIndex);
    const rightItems = navItems.slice(midIndex);

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href;
        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-300 group z-10",
                    isActive
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400 active:scale-95"
                )}
            >
                {/* Active pill background */}
                {isActive && (
                    <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute inset-0 rounded-xl gradient-blue-purple shadow-medium"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}

                {/* Icon */}
                <span className={cn(
                    "relative z-10 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                    {item.icon}
                </span>

                {/* Label */}
                <span className={cn(
                    "relative z-10 text-[9px] font-bold mt-0.5 leading-tight truncate max-w-full",
                    isActive
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400"
                )}>
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Ambient Background Glow behind the center floating button */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-28 h-10 bg-primary/20 dark:bg-primary/10 rounded-full blur-xl pointer-events-none" />

            {/* Glassmorphic background */}
            <div
                className="mx-3 mb-3 rounded-2xl border border-white/15 dark:border-white/10 shadow-premium overflow-visible"
                style={{
                    background: 'rgba(255, 255, 255, 0.78)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                }}
            >
                {/* Dark mode override */}
                <div className="hidden dark:block absolute inset-0 rounded-2xl" style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                }} />

                <div className="relative flex items-center justify-between px-2 py-1.5" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
                    {/* Left 2 items */}
                    <div className="flex flex-1 items-center justify-around">
                        {leftItems.map(renderNavItem)}
                    </div>

                    {/* Center Floating Brand Badge with Premium Shapes */}
                    <div className="relative flex items-center justify-center px-2 z-20">
                        <Link
                            href={brandHref || "/"}
                            className="relative flex flex-col items-center justify-center -mt-6 group focus:outline-none"
                        >
                            {/* Inner circle glowing layer */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 blur-[8px] opacity-70 group-hover:opacity-100 group-hover:scale-115 transition-all duration-300" />
                            
                            {/* The floating rounded badge itself */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-[3px] border-white dark:border-slate-900 shadow-premium flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95 bg-white">
                                <Image
                                    src="/icons/icon-192x192.png"
                                    alt="AS Academy Logo"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>

                            {/* Micro brand name appearing on hover */}
                            <span className="absolute -bottom-5 text-[8px] font-black tracking-widest text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap uppercase">
                                ACADEMY
                            </span>
                        </Link>
                    </div>

                    {/* Right 2 items */}
                    <div className="flex flex-1 items-center justify-around">
                        {rightItems.map(renderNavItem)}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// Dashboard Navigation Component
interface DashboardNavProps {
    brand: {
        name: string;
        href: string;
    };
    user: {
        name: string;
        email?: string;
    };
    navItems: NavItem[];
    onLogout: () => void;
    actions?: React.ReactNode;
}

export function DashboardNav({ brand, user, navItems, onLogout, actions }: DashboardNavProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const pathname = usePathname();

    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    return (
        <>
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto container-padding">
                    <div className="flex justify-between items-center h-16">
                        <Link href={brand.href} className="flex items-center gap-2">
                            <Image
                                src="/icons/icon-192x192.png"
                                alt="AS Academy Logo"
                                width={32}
                                height={32}
                                className="rounded-lg object-contain"
                            />
                            <h1 className="text-lg font-bold gradient-text hidden sm:block">
                                {brand.name}
                            </h1>
                        </Link>

                        <div className="flex items-center space-x-3">
                            {actions}
                            <div className="hidden md:flex items-center space-x-3">
                                <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
                                <button
                                    onClick={onLogout}
                                    className="text-sm text-destructive hover:text-destructive/80 font-medium transition-colors"
                                >
                                    Logout
                                </button>
                            </div>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors touch-target"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Navigation Tabs */}
                <div className="hidden md:block max-w-7xl mx-auto container-padding border-t border-border">
                    <nav className="flex space-x-8 -mb-px">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "border-b-2 py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap",
                                    pathname === item.href
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Mobile Slide-out Menu (user info + logout only) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-16 right-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 md:hidden overflow-y-auto safe-bottom"
                        >
                            <div className="flex flex-col p-6 space-y-6">
                                {/* User Info */}
                                <div className="pb-4 border-b border-border">
                                    <p className="text-sm font-medium">{user.name}</p>
                                    {user.email && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}
                                </div>

                                {/* Navigation Items */}
                                <div className="flex flex-col space-y-2">
                                    {navItems.map((item, index) => (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all touch-target",
                                                    pathname === item.href
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : "text-foreground hover:bg-accent"
                                                )}
                                            >
                                                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                                                <span>{item.label}</span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={onLogout}
                                    className="w-full px-4 py-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-all touch-target text-left"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav navItems={navItems} brandHref={brand.href} />
        </>
    );
}
