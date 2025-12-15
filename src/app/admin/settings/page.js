'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { settingsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function AdminSettingsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [deviceLimit, setDeviceLimit] = useState('1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getByKey('student_device_limit');
            setDeviceLimit(response.data.data.setting_value);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await settingsAPI.update('student_device_limit', deviceLimit);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AS ACADEMY - Admin
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Admin: {user?.name}</span>
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <Link href="/admin/dashboard" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Dashboard
                        </Link>
                        <Link href="/admin/users" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Users
                        </Link>
                        <Link href="/admin/courses" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Courses
                        </Link>
                        <Link href="/admin/payments" className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1">
                            Payments
                        </Link>
                        <Link href="/admin/settings" className="border-b-2 border-blue-600 text-blue-600 py-4 px-1 font-medium">
                            Settings
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>

                    {/* Success/Error Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Student Device Limit Setting */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Device Login Mode</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Control how many devices students can use to access their accounts. This setting applies to all students globally.
                        </p>

                        <div className="space-y-3">
                            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="deviceLimit"
                                    value="1"
                                    checked={deviceLimit === '1'}
                                    onChange={(e) => setDeviceLimit(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <div className="font-medium text-gray-900">1 Device Only</div>
                                    <div className="text-sm text-gray-500">Students can only login from one device at a time</div>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="deviceLimit"
                                    value="2"
                                    checked={deviceLimit === '2'}
                                    onChange={(e) => setDeviceLimit(e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <div className="font-medium text-gray-900">2 Devices Only</div>
                                    <div className="text-sm text-gray-500">Students can login from up to two different devices</div>
                                </div>
                            </label>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Admin and Teacher accounts are exempt from device restrictions and can login from unlimited devices.
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettingsContent />
        </ProtectedRoute>
    );
}
