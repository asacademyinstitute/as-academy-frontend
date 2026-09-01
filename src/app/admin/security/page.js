'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import useAuthStore from '@/store/authStore';
import { deviceAPI, userAPI } from '@/lib/api';
import { customConfirm } from '@/components/ui/custom-modal';
import { showToast } from '@/components/ui/toast';

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
            const [activityRes, settingsRes] = await Promise.all([
                deviceAPI.getActivity({ studentsOnly: true }),
                deviceAPI.getSettings()
            ]);

            const activityData = activityRes.data;
            const settingsData = settingsRes.data;

            // Check if responses are successful and have expected structure
            if (activityData.success && activityData.data) {
                setDeviceActivity(activityData.data.devices || []);
            } else {
                console.error('Unexpected activity response structure:', activityData);
                setDeviceActivity([]);
            }

            if (settingsData.success && settingsData.data) {
                setSettings(settingsData.data);
            } else {
                console.error('Unexpected settings response structure:', settingsData);
                setSettings(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load security data. Please check console for details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceLimitChange = async (limit) => {
        const confirmed = await customConfirm(`Change global device limit to ${limit} device(s) for ALL students?`, 'Change Device Limit');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await deviceAPI.updateSettings({ maxDevicesPerStudent: limit });
            const data = res.data;
            if (data.success) {
                showToast(data.message, 'success');
                fetchData();
            } else {
                showToast('Failed to update device limit', 'error');
            }
        } catch (error) {
            console.error('Error updating device limit:', error);
            showToast('Error updating device limit', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetAllDevices = async () => {
        const confirmed = await customConfirm('⚠️ WARNING: This will reset devices for ALL students and force them to re-login. Continue?', 'Reset All Devices');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await deviceAPI.resetAll();
            const data = res.data;
            if (data.success) {
                showToast(`${data.message} (${data.data.count} students affected)`, 'success');
                fetchData();
            } else {
                showToast('Failed to reset devices', 'error');
            }
        } catch (error) {
            console.error('Error resetting devices:', error);
            showToast('Error resetting devices', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceLogout = async (userId, userName) => {
        const confirmed = await customConfirm(`Force logout "${userName}"? This will end their current session.`, 'Force Logout');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await deviceAPI.forceLogout(userId);
            const data = res.data;
            if (data.success) {
                showToast(data.message, 'success');
                fetchData();
            } else {
                showToast('Failed to force logout', 'error');
            }
        } catch (error) {
            console.error('Error forcing logout:', error);
            showToast('Error forcing logout', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetDevices = async (userId, userName) => {
        const confirmed = await customConfirm(`Reset devices for "${userName}"? They will need to login again on their device.`, 'Reset Devices');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await deviceAPI.resetUserDevices(userId);
            const data = res.data;
            if (data.success) {
                showToast(data.message, 'success');
                fetchData();
            } else {
                showToast('Failed to reset devices', 'error');
            }
        } catch (error) {
            console.error('Error resetting devices:', error);
            showToast('Error resetting devices', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlockUser = async (userId, userName) => {
        const confirmed = await customConfirm(`Block "${userName}"? This will prevent them from accessing the platform.`, 'Block User');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await userAPI.updateStatus(userId, 'blocked');
            const data = res.data;
            if (data.success) {
                showToast(`${userName} has been blocked`, 'success');
                fetchData();
            } else {
                showToast('Failed to block user', 'error');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            showToast('Error blocking user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleEnforcement = async (enabled) => {
        const action = enabled ? 'ENABLE' : 'DISABLE';
        const confirmed = await customConfirm(`${action} device restriction for ALL students? ${enabled ? 'Students will be limited to registered devices.' : 'Device checks will be bypassed.'}`, `${action} Device Enforcement`);
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await deviceAPI.toggleEnforcement(enabled);
            const data = res.data;
            if (data.success) {
                showToast(data.message, 'success');
                fetchData();
            } else {
                showToast('Failed to toggle enforcement', 'error');
            }
        } catch (error) {
            console.error('Error toggling enforcement:', error);
            showToast('Error toggling enforcement', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Global Device Control */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Global Device Control</h2>

                    {settings && (
                        <div className="space-y-4">
                            {/* Enforcement Toggle */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white">
                                            Device Restriction Enforcement
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {settings.deviceTrackingEnabled
                                                ? '🔒 Active - Students are restricted to registered devices'
                                                : '🔓 Disabled - Device checks are bypassed for all students'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${settings.deviceTrackingEnabled
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                                            }`}>
                                            {settings.deviceTrackingEnabled ? 'ENABLED' : 'DISABLED'}
                                        </span>
                                        <button
                                            onClick={() => handleToggleEnforcement(!settings.deviceTrackingEnabled)}
                                            disabled={actionLoading}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 ${settings.deviceTrackingEnabled
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Student Device Limit (Lifetime)
                                </label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                    <button
                                        onClick={() => handleDeviceLimitChange(1)}
                                        disabled={actionLoading || settings.maxDevicesPerStudent === 1}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${settings.maxDevicesPerStudent === 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-750 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                                            } disabled:opacity-50`}
                                    >
                                        1 Device Only
                                    </button>
                                    <button
                                        onClick={() => handleDeviceLimitChange(2)}
                                        disabled={actionLoading || settings.maxDevicesPerStudent === 2}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${settings.maxDevicesPerStudent === 2
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-750 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                                            } disabled:opacity-50`}
                                    >
                                        2 Devices Only
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Current limit: <strong>{settings.maxDevicesPerStudent} device(s)</strong> per student
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleResetAllDevices}
                                    disabled={actionLoading}
                                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors cursor-pointer"
                                >
                                    🔄 Reset All Student Devices
                                </button>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                    ⚠️ Warning: This will force all students to re-login
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Device Activity Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security &amp; Device Activity</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor student device usage and detect suspicious activity</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Devices</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Login Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Login</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {deviceActivity.map((item) => (
                                            <tr
                                                key={item.user.id}
                                                className={item.suspicious ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.user.email}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">{item.user.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-sm rounded ${item.totalDevices > (settings?.maxDevicesPerStudent || 1)
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 font-bold'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                        }`}>
                                                        {item.totalDevices}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                    {item.loginCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.suspicious ? (
                                                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 font-bold">
                                                            ⚠️ Suspicious
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                                                            ✓ Normal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    <button
                                                        onClick={() => handleForceLogout(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        Force Logout
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetDevices(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        Reset Devices
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockUser(item.user.id, item.user.name)}
                                                        disabled={actionLoading}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
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
                            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                {deviceActivity.map((item) => (
                                    <div
                                        key={item.user.id}
                                        className={`p-4 ${item.suspicious ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} transition-colors`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{item.user.name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.user.email}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{item.user.phone}</p>
                                            </div>
                                            {item.suspicious ? (
                                                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 font-bold whitespace-nowrap">
                                                    ⚠️ Suspicious
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">
                                                    ✓ Normal
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Devices</div>
                                                <div className={`text-lg font-bold ${item.totalDevices > (settings?.maxDevicesPerStudent || 1)
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {item.totalDevices}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Logins</div>
                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.loginCount}</div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Login</div>
                                                <div className="text-xs font-medium text-gray-900 dark:text-gray-300">
                                                    {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleForceLogout(item.user.id, item.user.name)}
                                                    disabled={actionLoading}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Force Logout
                                                </button>
                                                <button
                                                    onClick={() => handleResetDevices(item.user.id, item.user.name)}
                                                    disabled={actionLoading}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Reset Devices
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleBlockUser(item.user.id, item.user.name)}
                                                disabled={actionLoading}
                                                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
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
