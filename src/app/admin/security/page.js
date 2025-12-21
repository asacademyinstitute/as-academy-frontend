'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import useAuthStore from '@/store/authStore';

function AdminSecurityContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [deviceActivity, setDeviceActivity] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            const [activityRes, settingsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/activity?studentsOnly=true`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const activityData = await activityRes.json();
            const settingsData = await settingsRes.json();

            // Check if responses are successful and have expected structure
            if (!activityRes.ok) {
                console.error('Activity API error:', activityData);
                alert(`Failed to fetch device activity: ${activityData.message || 'Unknown error'}`);
            } else if (activityData.success && activityData.data) {
                setDeviceActivity(activityData.data.devices || []);
            } else {
                console.error('Unexpected activity response structure:', activityData);
                setDeviceActivity([]);
            }

            if (!settingsRes.ok) {
                console.error('Settings API error:', settingsData);
                alert(`Failed to fetch device settings: ${settingsData.message || 'Unknown error'}`);
            } else if (settingsData.success && settingsData.data) {
                setSettings(settingsData.data);
            } else {
                console.error('Unexpected settings response structure:', settingsData);
                setSettings(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load security data. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceLimitChange = async (limit) => {
        if (!confirm(`Change global device limit to ${limit} device(s) for ALL students?`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ maxDevicesPerStudent: limit })
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Failed to update device limit');
            }
        } catch (error) {
            console.error('Error updating device limit:', error);
            alert('Error updating device limit');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetAllDevices = async () => {
        if (!confirm('⚠️ WARNING: This will reset devices for ALL students and force them to re-login. Continue?')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/reset-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                alert(`${data.message} (${data.data.count} students affected)`);
                fetchData();
            } else {
                alert('Failed to reset devices');
            }
        } catch (error) {
            console.error('Error resetting devices:', error);
            alert('Error resetting devices');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceLogout = async (userId, userName) => {
        if (!confirm(`Force logout ${userName}?`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}/force-logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Failed to force logout');
            }
        } catch (error) {
            console.error('Error forcing logout:', error);
            alert('Error forcing logout');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetDevices = async (userId, userName) => {
        if (!confirm(`Reset devices for ${userName}?`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Failed to reset devices');
            }
        } catch (error) {
            console.error('Error resetting devices:', error);
            alert('Error resetting devices');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlockUser = async (userId, userName) => {
        if (!confirm(`Block ${userName}? This will prevent them from accessing the platform.`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'blocked' })
            });

            const data = await res.json();
            if (data.success) {
                alert(`${userName} has been blocked`);
                fetchData();
            } else {
                alert('Failed to block user');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Error blocking user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleEnforcement = async (enabled) => {
        const action = enabled ? 'ENABLE' : 'DISABLE';
        if (!confirm(`${action} device restriction for ALL students? ${enabled ? 'Students will be limited to registered devices.' : 'Device checks will be bypassed.'}`)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/enforcement`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled })
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Failed to toggle enforcement');
            }
        } catch (error) {
            console.error('Error toggling enforcement:', error);
            alert('Error toggling enforcement');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Global Device Control */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Global Device Control</h2>

                    {settings && (
                        <div className="space-y-4">
                            {/* Enforcement Toggle */}
                            <div className="bg-gray-50 rounded-lg p-4 border">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900">
                                            Device Restriction Enforcement
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {settings.deviceTrackingEnabled
                                                ? '🔒 Active - Students are restricted to registered devices'
                                                : '🔓 Disabled - Device checks are bypassed for all students'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${settings.deviceTrackingEnabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {settings.deviceTrackingEnabled ? 'ENABLED' : 'DISABLED'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleEnforcement(!settings.deviceTrackingEnabled)}
                                            disabled={actionLoading}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${settings.deviceTrackingEnabled
                                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                                }`}
                                        >
                                            {settings.deviceTrackingEnabled ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Device Limit - only show when enforcement is enabled */}
                            <div className={settings.deviceTrackingEnabled ? '' : 'opacity-50 pointer-events-none'}>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Student Device Limit (Lifetime)
                                </label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                    <button
                                        onClick={() => handleDeviceLimitChange(1)}
                                        disabled={actionLoading || settings.maxDevicesPerStudent === 1}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${settings.maxDevicesPerStudent === 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } disabled:opacity-50`}
                                    >
                                        1 Device Only
                                    </button>
                                    <button
                                        onClick={() => handleDeviceLimitChange(2)}
                                        disabled={actionLoading || settings.maxDevicesPerStudent === 2}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${settings.maxDevicesPerStudent === 2
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } disabled:opacity-50`}
                                    >
                                        2 Devices Only
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Current limit: <strong>{settings.maxDevicesPerStudent} device(s)</strong> per student
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={handleResetAllDevices}
                                    disabled={actionLoading}
                                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                                >
                                    🔄 Reset All Student Devices
                                </button>
                                <p className="text-sm text-red-600 mt-2">
                                    ⚠️ Warning: This will force all students to re-login
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Device Activity Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">Security & Device Activity</h2>
                        <p className="text-sm text-gray-600 mt-1">Monitor student device usage and detect suspicious activity</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Devices</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {deviceActivity.map((item) => (
                                            <tr
                                                key={item.user.id}
                                                className={item.suspicious ? 'bg-red-50' : 'hover:bg-gray-50'}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                                                    <div className="text-sm text-gray-500">{item.user.email}</div>
                                                    <div className="text-xs text-gray-400">{item.user.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-sm rounded ${item.totalDevices > (settings?.maxDevicesPerStudent || 1)
                                                        ? 'bg-red-100 text-red-800 font-bold'
                                                        : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {item.totalDevices}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.loginCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.suspicious ? (
                                                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 font-bold">
                                                            ⚠️ Suspicious
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                                            ✓ Normal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <button
                                                        onClick={() => handleForceLogout(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                                                    >
                                                        Force Logout
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetDevices(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                                    >
                                                        Reset Devices
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockUser(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                                    >
                                                        Block
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {deviceActivity.map((item) => (
                                    <div
                                        key={item.user.id}
                                        className={`p-4 ${item.suspicious ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900">{item.user.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{item.user.email}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{item.user.phone}</p>
                                            </div>
                                            {item.suspicious ? (
                                                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 font-bold whitespace-nowrap">
                                                    ⚠️ Suspicious
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 whitespace-nowrap">
                                                    ✓ Normal
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xs text-gray-600 mb-1">Devices</div>
                                                <div className={`text-lg font-bold ${item.totalDevices > (settings?.maxDevicesPerStudent || 1)
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                                    }`}>
                                                    {item.totalDevices}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xs text-gray-600 mb-1">Logins</div>
                                                <div className="text-lg font-bold text-blue-600">{item.loginCount}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xs text-gray-600 mb-1">Last Login</div>
                                                <div className="text-xs font-medium text-gray-900">
                                                    {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleForceLogout(item.user.id, item.user.name)}
                                                    disabled={actionLoading}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    Force Logout
                                                </button>
                                                <button
                                                    onClick={() => handleResetDevices(item.user.id, item.user.name)}
                                                    disabled={actionLoading}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    Reset Devices
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleBlockUser(item.user.id, item.user.name)}
                                                disabled={actionLoading}
                                                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Block User
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminSecurityPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminSecurityContent />
        </ProtectedRoute>
    );
}
