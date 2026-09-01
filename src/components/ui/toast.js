'use client';

/**
 * Toast Notification System
 * Usage: import { showToast } from '@/components/ui/toast';
 *        showToast('Saved!', 'success');
 *        showToast('Error occurred', 'error');
 *        showToast('Please wait...', 'info');
 *        showToast('Check this out', 'warning');
 */

let toastContainer = null;

function getOrCreateContainer() {
    if (toastContainer && document.body.contains(toastContainer)) {
        return toastContainer;
    }
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        max-width: 380px;
        width: calc(100vw - 48px);
    `;
    document.body.appendChild(toastContainer);
    return toastContainer;
}

const ICONS = {
    success: `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    error:   `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    warning: `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info:    `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
};

const COLORS = {
    success: {
        light: { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', text: '#15803d', progress: '#16a34a' },
        dark:  { bg: '#14532d', border: '#166534', icon: '#4ade80', text: '#86efac', progress: '#4ade80' },
    },
    error: {
        light: { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#b91c1c', progress: '#dc2626' },
        dark:  { bg: '#450a0a', border: '#991b1b', icon: '#f87171', text: '#fca5a5', progress: '#f87171' },
    },
    warning: {
        light: { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706', text: '#b45309', progress: '#d97706' },
        dark:  { bg: '#451a03', border: '#92400e', icon: '#fbbf24', text: '#fcd34d', progress: '#fbbf24' },
    },
    info: {
        light: { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb', text: '#1d4ed8', progress: '#2563eb' },
        dark:  { bg: '#172554', border: '#1e40af', icon: '#60a5fa', text: '#93c5fd', progress: '#60a5fa' },
    },
};

export function showToast(message, type = 'info', duration = 3500) {
    if (typeof window === 'undefined') return;

    const isDark = document.documentElement.classList.contains('dark');
    const container = getOrCreateContainer();
    const palette = COLORS[type]?.[isDark ? 'dark' : 'light'] || COLORS.info[isDark ? 'dark' : 'light'];

    const toast = document.createElement('div');
    toast.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: ${palette.bg};
        border: 1px solid ${palette.border};
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        pointer-events: all;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
    `;

    // Progress bar
    const progress = document.createElement('div');
    progress.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        background: ${palette.progress};
        opacity: 0.6;
        transform-origin: left;
        animation: toastProgress ${duration}ms linear forwards;
    `;

    // Add keyframes once
    if (!document.getElementById('toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `@keyframes toastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`;
        document.head.appendChild(style);
    }

    toast.innerHTML = `
        <div style="color:${palette.icon};flex-shrink:0;margin-top:1px">${ICONS[type] || ICONS.info}</div>
        <div style="flex:1;min-width:0">
            <p style="margin:0;font-size:14px;font-weight:500;color:${palette.text};line-height:1.4;word-break:break-word">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" style="flex-shrink:0;color:${palette.text};opacity:0.5;background:none;border:none;cursor:pointer;padding:0;margin-top:1px;font-size:16px;line-height:1">✕</button>
    `;
    toast.appendChild(progress);

    toast.addEventListener('click', () => dismiss(toast));
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });
    });

    // Auto dismiss
    const timer = setTimeout(() => dismiss(toast), duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));

    function dismiss(el) {
        el.style.transform = 'translateX(110%)';
        el.style.opacity = '0';
        el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 350);
    }
}
