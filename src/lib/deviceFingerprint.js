/**
 * Device Fingerprinting Library
 * Generates a unique, persistent device ID for browser-based device binding
 */

const DEVICE_ID_KEY = 'device_fingerprint_id';

/**
 * Generate a unique device fingerprint based on browser characteristics
 */
async function generateFingerprint() {
    const components = [];

    // 1. Canvas Fingerprinting
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
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
    } catch (e) {
        components.push('canvas-error');
    }

    // 2. WebGL Fingerprinting
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

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
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // 4. Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // 5. Language
    components.push(navigator.language || navigator.userLanguage);

    // 6. Platform
    components.push(navigator.platform);

    // 7. Hardware Concurrency (CPU cores)
    components.push(navigator.hardwareConcurrency || 'unknown');

    // 8. Device Memory (if available)
    components.push(navigator.deviceMemory || 'unknown');

    // 9. User Agent
    components.push(navigator.userAgent);

    // 10. Installed Fonts Detection (sample)
    const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino'];
    const detectedFonts = fonts.filter(font => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `12px ${font}`;
        const width = ctx.measureText('mmmmmmmmmmlli').width;
        return width > 0;
    });
    components.push(detectedFonts.join(','));

    // 11. Touch Support
    components.push(navigator.maxTouchPoints || 0);

    // 12. Browser Plugins (limited in modern browsers)
    components.push(navigator.plugins.length);

    // Combine all components and hash
    const fingerprint = components.join('|||');
    const hash = await hashString(fingerprint);

    return hash;
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Get or generate device ID
 * Returns a persistent device ID stored in localStorage
 */
export async function getDeviceId() {
    // Check if device ID already exists in localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate new device ID
        deviceId = await generateFingerprint();

        // Store in localStorage for persistence
        localStorage.setItem(DEVICE_ID_KEY, deviceId);

        console.log('🔐 New device ID generated:', deviceId.substring(0, 16) + '...');
    } else {
        console.log('🔐 Existing device ID loaded:', deviceId.substring(0, 16) + '...');
    }

    return deviceId;
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
