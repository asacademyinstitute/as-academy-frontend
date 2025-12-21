'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeacherMobileNav from '@/components/TeacherMobileNav';
import { userAPI, authAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

function TeacherProfileContent() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        college_name: user?.college_name || '',
        semester: user?.semester || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userAPI.update(user.id, formData);
            updateUser(formData);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Password changed successfully!');
        } catch (error) {
            alert('Failed to change password');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <TeacherMobileNav user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Profile Information */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {editing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                                    <input
                                        type="text"
                                        name="college_name"
                                        value={formData.college_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Save Changes
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-600">Name</div>
                                    <div className="text-gray-900 font-medium">{user?.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Email</div>
                                    <div className="text-gray-900 font-medium">{user?.email}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Phone</div>
                                    <div className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">College</div>
                                    <div className="text-gray-900 font-medium">{user?.college_name || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Role</div>
                                    <div className="text-gray-900 font-medium capitalize">{user?.role}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

                        {changingPassword ? (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChangingPassword(false)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setChangingPassword(true)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                            >
                                Change Password
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeacherProfilePage() {
    return (
        <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherProfileContent />
        </ProtectedRoute>
    );
}
