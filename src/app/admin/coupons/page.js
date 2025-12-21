'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMobileNav from '@/components/AdminMobileNav';
import { couponAPI, coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Ticket, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

function AdminCouponsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [coupons, setCoupons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        applicable_to: 'all',
        course_ids: [],
        expiry_date: '',
        usage_limit: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [couponsRes, coursesRes] = await Promise.all([
                couponAPI.getAll(),
                coursesAPI.getAll(),
            ]);
            setCoupons(couponsRes.data.data.coupons || []);
            setCourses(coursesRes.data.data.courses || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            };

            if (editingCoupon) {
                await couponAPI.update(editingCoupon.id, data);
            } else {
                await couponAPI.create(data);
            }

            setShowModal(false);
            setEditingCoupon(null);
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                applicable_to: 'all',
                course_ids: [],
                expiry_date: '',
                usage_limit: '',
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save coupon');
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applicable_to: coupon.applicable_to,
            course_ids: coupon.course_ids || [],
            expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
            usage_limit: coupon.usage_limit || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await couponAPI.delete(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete coupon');
        }
    };

    const handleToggle = async (id) => {
        try {
            await couponAPI.toggle(id);
            fetchData();
        } catch (error) {
            alert('Failed to toggle coupon status');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AdminMobileNav user={user} onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Ticket className="w-7 h-7" />
                            Discount Coupons
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">Manage discount coupons for courses</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            setFormData({
                                code: '',
                                discount_type: 'percentage',
                                discount_value: '',
                                applicable_to: 'all',
                                course_ids: [],
                                expiry_date: '',
                                usage_limit: '',
                            });
                            setShowModal(true);
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Coupon
                    </button>
                </div>

                {/* Coupons List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : coupons.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicable To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {coupons.map((coupon) => (
                                        <tr key={coupon.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-primary">{coupon.code}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {coupon.applicable_to === 'all' ? 'All Courses' : `${coupon.course_ids?.length || 0} Courses`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {coupon.usage_count} / {coupon.usage_limit || '∞'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {coupon.expiry_date ? formatDate(coupon.expiry_date) : 'No Expiry'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleToggle(coupon.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title={coupon.is_active ? 'Disable' : 'Enable'}
                                                    >
                                                        {coupon.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(coupon)}
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Ticket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No coupons created yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Coupon Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        required
                                        placeholder="e.g., SAVE20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Discount Type</label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Discount Value</label>
                                        <input
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                            required
                                            min="0"
                                            max={formData.discount_type === 'percentage' ? '100' : undefined}
                                            placeholder={formData.discount_type === 'percentage' ? '0-100' : 'Amount'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">Applicable To</label>
                                    <select
                                        value={formData.applicable_to}
                                        onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value, course_ids: [] })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                    >
                                        <option value="all">All Courses</option>
                                        <option value="specific">Specific Courses</option>
                                    </select>
                                </div>

                                {formData.applicable_to === 'specific' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Select Courses</label>
                                        <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto bg-white">
                                            {courses.map((course) => (
                                                <label key={course.id} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.course_ids.includes(course.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({ ...formData, course_ids: [...formData.course_ids, course.id] });
                                                            } else {
                                                                setFormData({ ...formData, course_ids: formData.course_ids.filter(id => id !== course.id) });
                                                            }
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm text-gray-900">{course.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-1">Usage Limit (Optional)</label>
                                        <input
                                            type="number"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                                            min="1"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all"
                                    >
                                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingCoupon(null);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminCoupons() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminCouponsContent />
        </ProtectedRoute>
    );
}
