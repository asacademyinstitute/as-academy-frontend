'use client';

import { useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { showToast } from './ui/toast';

// Helper to convert VAPID public key base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Register Service Worker and subscribe user if logged in
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        const registerAndSubscribe = async () => {
            try {
                // 1. Register sw.js
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered successfully:', registration.scope);

                // 2. Only subscribe if user is authenticated
                if (!isAuthenticated || !user) {
                    return;
                }

                // 3. Check existing subscription
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Check if permission is already denied
                    if (Notification.permission === 'denied') {
                        console.warn('Push permission is denied by user');
                        return;
                    }

                    // Request permission
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        console.warn('Push permission not granted');
                        return;
                    }

                    // Fetch VAPID public key from backend
                    const vapidRes = await api.get('/push/vapid-public-key');
                    const vapidPublicKey = vapidRes.data.publicKey;

                    if (!vapidPublicKey) {
                        throw new Error('VAPID public key not found');
                    }

                    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                    // Subscribe to push service
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });

                    console.log('Push subscription created:', subscription);

                    // Send subscription details to backend
                    const keysObj = subscription.toJSON();
                    await api.post('/push/subscribe', {
                        subscription: {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: keysObj.keys.p256dh,
                                auth: keysObj.keys.auth
                            }
                        },
                        deviceType: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                    });

                    showToast('Notifications enabled successfully!', 'success');
                }
            } catch (error) {
                console.error('❌ Push registration/subscription failed:', error);
            }
        };

        registerAndSubscribe();
    }, [isAuthenticated, user]);

    return null; // Silent component
}
