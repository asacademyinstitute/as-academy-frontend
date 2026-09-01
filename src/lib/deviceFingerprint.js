/**
 * Device Fingerprinting Library
 * Generates a unique, persistent device ID for browser-based device binding
 */

const DEVICE_ID_KEY = 'device_id';

/**
 * Generate a unique device fingerprint based on browser characteristics
 */
async function generateFingerprint() {
    try {
        const components = [];

        // 1. Canvas Fingerprinting
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
            if (ctx) {
                canvas.width = 200;
                canvas.height = 50;
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('Device Fingerprint', 2, 15);
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Device Fingerprint', 4, 17);
                const canvasData = canvas.toDataURL();
                components.push(canvasData);
            } else {
                components.push('canvas-no-ctx');
            }
        } catch (e) {
            components.push('canvas-error');
        }

        // 2. WebGL Fingerprinting
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas && typeof canvas.getContext === 'function'
                ? (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
                : null;

            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    components.push(vendor + '|' + renderer);
                }
            }
        } catch (e) {
            components.push('webgl-error');
        }

        // 3. Screen Resolution
        try {
            components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
        } catch (e) {
            components.push('screen-error');
        }

        // 4. Timezone
        try {
            components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch (e) {
            components.push('timezone-error');
        }

        // 5. Language
        try {
            components.push(navigator.language || navigator.userLanguage);
        } catch (e) {
            components.push('language-error');
        }

        // 6. Platform
        try {
            components.push(navigator.platform);
        } catch (e) {
            components.push('platform-error');
        }

        // 7. Hardware Concurrency
        try {
            components.push(navigator.hardwareConcurrency || 'unknown');
        } catch (e) {
            components.push('cores-error');
        }

        // 8. Device Memory
        try {
            components.push(navigator.deviceMemory || 'unknown');
        } catch (e) {
            components.push('memory-error');
        }

        // 9. User Agent
        try {
            components.push(navigator.userAgent);
        } catch (e) {
            components.push('ua-error');
        }

        // 10. Installed Fonts Detection
        try {
            const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino'];
            const detectedFonts = fonts.filter(font => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
                    if (!ctx) return false;
                    ctx.font = `12px ${font}`;
                    const width = ctx.measureText('mmmmmmmmmmlli').width;
                    return width > 0;
                } catch (err) {
                    return false;
                }
            });
            components.push(detectedFonts.join(','));
        } catch (e) {
            components.push('fonts-error');
        }

        // 11. Touch Support
        try {
            components.push(navigator.maxTouchPoints || 0);
        } catch (e) {
            components.push('touch-error');
        }

        // 12. Plugins
        try {
            components.push(navigator.plugins ? navigator.plugins.length : 0);
        } catch (e) {
            components.push('plugins-error');
        }

        const fingerprint = components.join('|||');
        return await hashString(fingerprint);
    } catch (globalErr) {
        console.error('Global device fingerprint generation failed, using userAgent fallback:', globalErr);
        try {
            const fallbackStr = (navigator.userAgent || 'unknown_ua') + '|||fallback';
            return await hashString(fallbackStr);
        } catch (hashErr) {
            return 'dev_fallback_' + Math.random().toString(36).substring(2, 15);
        }
    }
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str) {
    try {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch (e) {
        console.warn('Crypto subtle not available, using fallback hash:', e);
    }

    // Fallback hash function (deterministic 64-char hex string)
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
    const part4 = ((h1 & h2) >>> 0).toString(16).padStart(8, '0');
    const part5 = ((h1 | h2) >>> 0).toString(16).padStart(8, '0');
    const part6 = ((~h1) >>> 0).toString(16).padStart(8, '0');
    const part7 = ((~h2) >>> 0).toString(16).padStart(8, '0');
    const part8 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
    
    return part1 + part2 + part3 + part4 + part5 + part6 + part7 + part8;
}

/**
 * Get or generate device ID
 * Returns a persistent device ID stored in localStorage
 */
export async function getDeviceId() {
    try {
        let deviceId = null;
        try {
            deviceId = localStorage.getItem(DEVICE_ID_KEY);
        } catch (storageErr) {
            console.warn('Failed to read from localStorage:', storageErr);
        }

        if (!deviceId) {
            deviceId = await generateFingerprint();

            try {
                localStorage.setItem(DEVICE_ID_KEY, deviceId);
            } catch (storageErr) {
                console.warn('Failed to write to localStorage:', storageErr);
            }

            console.log('🔐 New device ID generated:', deviceId.substring(0, 16) + '...');
        } else {
            console.log('🔐 Existing device ID loaded:', deviceId.substring(0, 16) + '...');
        }

        return deviceId;
    } catch (err) {
        console.error('Error in getDeviceId:', err);
        return 'dev_ultimate_fallback_' + Math.random().toString(36).substring(2, 10);
    }
}

/**
 * Clear device ID (for testing or logout)
 */
export function clearDeviceId() {
    localStorage.removeItem(DEVICE_ID_KEY);
    console.log('🗑️ Device ID cleared');
}

/**
 * Regenerate device ID
 */
export async function regenerateDeviceId() {
    clearDeviceId();
    return await getDeviceId();
}

export default {
    getDeviceId,
    clearDeviceId,
    regenerateDeviceId
};
