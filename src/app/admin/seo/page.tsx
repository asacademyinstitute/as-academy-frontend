/**
 * SEO Content Management Admin Panel
 * Allows admins to create, edit, and manage SEO pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminMobileNav from '@/components/AdminMobileNav';
import useAuthStore from '@/store/authStore';
import { showToast } from '@/components/ui/toast';
import { customConfirm } from '@/components/ui/custom-modal';
import api from '@/lib/api';

interface SeoPage {
    id: string;
    title: string;
    url_slug: string;
    page_type: string;
    is_published: boolean;
    view_count: number;
    download_count: number;
    created_at: string;
}

export default function SeoManagementPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [pages, setPages] = useState<SeoPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        category: '',
        page_type: ''
    });

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    useEffect(() => {
        fetchPages();
    }, [filter]);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filter.category) params.category_id = filter.category;
            if (filter.page_type) params.page_type = filter.page_type;

            const response = await api.get('/seo/analytics', { params });
            setPages(response.data.data || []);
        } catch (err) {
            console.error('Error fetching pages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pageId: string) => {
        const confirmed = await customConfirm('Are you sure you want to delete this page?');
        if (!confirmed) return;

        try {
            await api.delete(`/seo/pages/${pageId}`);
            showToast('Page deleted successfully', 'success');
            fetchPages();
        } catch (err) {
            console.error('Error deleting page:', err);
            showToast('Error deleting page', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        SEO Content Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage educational content for MSBTE, BCA, and DBATU
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={filter.category}
                                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                <option value="msbte">MSBTE</option>
                                <option value="bca">BCA</option>
                                <option value="dbatu">DBATU</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Page Type
                            </label>
                            <select
                                value={filter.page_type}
                                onChange={(e) => setFilter({ ...filter, page_type: e.target.value })}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-650 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="notes">Notes</option>
                                <option value="pyq">Question Papers</option>
                                <option value="practical">Practical</option>
                                <option value="project">Projects</option>
                                <option value="career">Career</option>
                                <option value="exam-tips">Exam Tips</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <a
                                href="/admin/seo/create"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors"
                            >
                                + Create New Page
                            </a>
                        </div>
                    </div>
                </div>

                {/* Pages Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                        </div>
                    ) : pages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No pages found. Create your first SEO page!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Views
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Downloads
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {pages.map((page) => (
                                        <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {page.title}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {page.url_slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900 dark:text-gray-300 capitalize">
                                                    {page.page_type.replace('-', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${page.is_published
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {page.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                                {page.view_count.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                                {page.download_count.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-4">
                                                    <a
                                                        href={`/${page.url_slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                    >
                                                        View
                                                    </a>
                                                    <a
                                                        href={`/admin/seo/edit/${page.id}`}
                                                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                                    >
                                                        Edit
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(page.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stats Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Pages</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{pages.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Views</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {pages.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Downloads</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {pages.reduce((sum, p) => sum + p.download_count, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
