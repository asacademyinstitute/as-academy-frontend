/**
 * SEO Content Management Admin Panel
 * Allows admins to create, edit, and manage SEO pages
 */

'use client';

import { useState, useEffect } from 'react';

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
    const [pages, setPages] = useState<SeoPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        category: '',
        page_type: ''
    });

    useEffect(() => {
        fetchPages();
    }, [filter]);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const params = new URLSearchParams();
            if (filter.category) params.append('category_id', filter.category);
            if (filter.page_type) params.append('page_type', filter.page_type);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/seo/analytics?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPages(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching pages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pageId: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/seo/pages/${pageId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                alert('Page deleted successfully');
                fetchPages();
            } else {
                alert('Failed to delete page');
            }
        } catch (err) {
            console.error('Error deleting page:', err);
            alert('Error deleting page');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    SEO Content Management
                </h1>
                <p className="text-gray-600">
                    Manage educational content for MSBTE, BCA, and DBATU
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">All Categories</option>
                            <option value="msbte">MSBTE</option>
                            <option value="bca">BCA</option>
                            <option value="dbatu">DBATU</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Page Type
                        </label>
                        <select
                            value={filter.page_type}
                            onChange={(e) => setFilter({ ...filter, page_type: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center"
                        >
                            + Create New Page
                        </a>
                    </div>
                </div>
            </div>

            {/* Pages Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pages found. Create your first SEO page!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Downloads
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pages.map((page) => (
                                    <tr key={page.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {page.title}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {page.url_slug}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900 capitalize">
                                                {page.page_type.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${page.is_published
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {page.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {page.view_count.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {page.download_count.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                <a
                                                    href={page.url_slug}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    View
                                                </a>
                                                <a
                                                    href={`/admin/seo/edit/${page.id}`}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    Edit
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(page.id)}
                                                    className="text-red-600 hover:text-red-800"
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
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Pages</div>
                    <div className="text-3xl font-bold text-gray-900">{pages.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Views</div>
                    <div className="text-3xl font-bold text-gray-900">
                        {pages.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Downloads</div>
                    <div className="text-3xl font-bold text-gray-900">
                        {pages.reduce((sum, p) => sum + p.download_count, 0).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
