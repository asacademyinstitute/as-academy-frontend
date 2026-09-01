/**
 * Admin SEO Page Editing Form
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminMobileNav from '@/components/AdminMobileNav';
import useAuthStore from '@/store/authStore';
import { showToast } from '@/components/ui/toast';
import api from '@/lib/api';

interface Category {
    id: string;
    name: string;
    display_name: string;
}

interface Subject {
    id: string;
    name: string;
    display_name: string;
    subject_code?: string;
}

export default function SeoEditPage() {
    const router = useRouter();
    const params = useParams();
    const pageId = params.id as string;
    const { user, logout } = useAuthStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        title: '',
        url_slug: '',
        page_type: 'notes',
        h1_tag: '',
        content: '',
        meta_description: '',
        pdf_url: '',
        thumbnail_url: '',
        category_id: '',
        subject_id: '',
        schema_markup: '',
        is_published: false
    });

    // Subject creation modal/inline form states
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: '',
        display_name: '',
        subject_code: '',
        semester: '',
        scheme: '',
        branch: ''
    });
    const [isCreatingSubject, setIsCreatingSubject] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // 1. Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/seo/categories');
                const result = response.data;
                setCategories(result.data || []);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // 2. Fetch the page details to edit
    useEffect(() => {
        if (!pageId) return;

        const fetchPageDetails = async () => {
            try {
                setLoadingPage(true);
                const response = await api.get(`/seo/pages/${pageId}`);
                const result = response.data;
                const page = result.data;
                
                setFormData({
                    title: page.title || '',
                    url_slug: page.url_slug || '',
                    page_type: page.page_type || 'notes',
                    h1_tag: page.h1_tag || '',
                    content: page.content || '',
                    meta_description: page.meta_description || '',
                    pdf_url: page.pdf_url || '',
                    thumbnail_url: page.thumbnail_url || '',
                    category_id: page.category_id || '',
                    subject_id: page.subject_id || '',
                    schema_markup: page.schema_markup ? JSON.stringify(page.schema_markup, null, 2) : '',
                    is_published: page.is_published || false
                });
            } catch (error) {
                console.error('Failed to fetch page details:', error);
                showToast('Error loading page details', 'error');
                router.push('/admin/seo');
            } finally {
                setLoadingPage(false);
            }
        };

        fetchPageDetails();
    }, [pageId, router]);

    // 3. Fetch subjects dynamically when category changes
    useEffect(() => {
        if (!formData.category_id) return;

        const selectedCat = categories.find(c => c.id === formData.category_id);
        if (!selectedCat) return;

        const fetchSubjects = async () => {
            try {
                setLoadingSubjects(true);
                const response = await api.get(
                    `/seo/category/${selectedCat.name}/subjects`
                );
                const result = response.data;
                setSubjects(result.data || []);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchSubjects();
    }, [formData.category_id, categories]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Create New Subject
    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.name || !newSubject.display_name) {
            showToast('Subject name and display name are required', 'error');
            return;
        }

        try {
            setIsCreatingSubject(true);
            const response = await api.post('/seo/subjects', {
                ...newSubject,
                category_id: formData.category_id,
                semester: newSubject.semester ? parseInt(newSubject.semester) : undefined
            });

            const result = response.data;
            showToast('Subject created successfully!', 'success');
            
            const createdSub = result.data;
            setSubjects(prev => [...prev, createdSub]);
            setFormData(prev => ({ ...prev, subject_id: createdSub.id }));
            
            setNewSubject({
                name: '',
                display_name: '',
                subject_code: '',
                semester: '',
                scheme: '',
                branch: ''
            });
            setShowAddSubject(false);
        } catch (error: any) {
            console.error('Create subject error:', error);
            const errMsg = error.response?.data?.message || 'Failed to create subject';
            showToast(errMsg, 'error');
        } finally {
            setIsCreatingSubject(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.url_slug || !formData.h1_tag || !formData.content) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            let schemaJson = null;
            if (formData.schema_markup.trim()) {
                try {
                    schemaJson = JSON.parse(formData.schema_markup);
                } catch (jsonErr) {
                    showToast('Invalid JSON in schema markup', 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            await api.put(`/seo/pages/${pageId}`, {
                ...formData,
                schema_markup: schemaJson,
                subject_id: formData.subject_id || null
            });

            showToast('SEO Page updated successfully!', 'success');
            router.push('/admin/seo');
        } catch (error: any) {
            console.error('Failed to submit SEO page:', error);
            const errMsg = error.response?.data?.message || 'Network error updating SEO page';
            showToast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingPage) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <AdminMobileNav user={user} onLogout={handleLogout} />
                <div className="max-w-4xl mx-auto px-4 py-32 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-650">Loading page details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <AdminMobileNav user={user} onLogout={handleLogout} />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            Edit SEO Page
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Modify study materials, metadata, or structured schema definitions
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/seo')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Metadata */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white border-b pb-2">Page Settings & Meta</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Page Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. MSBTE Applied Mathematics Notes"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">H1 Tag Title *</label>
                                <input
                                    type="text"
                                    name="h1_tag"
                                    value={formData.h1_tag}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Download MSBTE Diploma Applied Mathematics Notes"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">URL Slug *</label>
                            <input
                                type="text"
                                name="url_slug"
                                value={formData.url_slug}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. msbte/notes/applied-mathematics"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Must be unique. Matches dynamic router base folder name.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Meta Description</label>
                            <textarea
                                name="meta_description"
                                value={formData.meta_description}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="A brief search snippet summarizing page contents..."
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Category *</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.display_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Page Type *</label>
                                <select
                                    name="page_type"
                                    value={formData.page_type}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="notes">Notes</option>
                                    <option value="pyq">Question Papers</option>
                                    <option value="practical">Practical</option>
                                    <option value="project">Projects</option>
                                    <option value="career">Career</option>
                                    <option value="exam-tips">Exam Tips</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-semibold">Subject</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSubject(!showAddSubject)}
                                        className="text-[10px] text-blue-600 hover:underline font-bold"
                                    >
                                        + New Subject
                                    </button>
                                </div>
                                <select
                                    name="subject_id"
                                    value={formData.subject_id}
                                    onChange={handleInputChange}
                                    disabled={loadingSubjects}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="">None / General Category Page</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.display_name} {s.subject_code ? `(${s.subject_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Inline Add Subject Form */}
                    {showAddSubject && (
                        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900 rounded-xl p-5 space-y-4">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400">Add New Subject to Selected Category</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    placeholder="Subject Code (e.g. 22224)"
                                    value={newSubject.subject_code}
                                    onChange={e => setNewSubject({ ...newSubject, subject_code: e.target.value })}
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    placeholder="Display Name * (e.g. Applied Math)"
                                    value={newSubject.display_name}
                                    onChange={e => setNewSubject({ ...newSubject, display_name: e.target.value })}
                                    required
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    placeholder="URL Key * (e.g. applied-math)"
                                    value={newSubject.name}
                                    onChange={e => setNewSubject({ ...newSubject, name: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                                    required
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    placeholder="Branch (e.g. Computer)"
                                    value={newSubject.branch}
                                    onChange={e => setNewSubject({ ...newSubject, branch: e.target.value })}
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                                <input
                                    type="number"
                                    placeholder="Semester Number"
                                    value={newSubject.semester}
                                    onChange={e => setNewSubject({ ...newSubject, semester: e.target.value })}
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    placeholder="Scheme (e.g. I-Scheme)"
                                    value={newSubject.scheme}
                                    onChange={e => setNewSubject({ ...newSubject, scheme: e.target.value })}
                                    className="px-3 py-2 text-xs border rounded-lg dark:bg-gray-800"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSubject(false)}
                                    className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateSubject}
                                    disabled={isCreatingSubject}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                >
                                    {isCreatingSubject ? 'Creating...' : 'Create Subject'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Resources & media */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white border-b pb-2">Media & Assets</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">PDF Download URL (Optional)</label>
                                <input
                                    type="url"
                                    name="pdf_url"
                                    value={formData.pdf_url}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/materials/math-notes.pdf"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Thumbnail Image URL (Optional)</label>
                                <input
                                    type="url"
                                    name="thumbnail_url"
                                    value={formData.thumbnail_url}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/thumbnails/math-notes.jpg"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* HTML Content Editor */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white border-b pb-2">Content Body (HTML) *</h3>
                        <div>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                required
                                rows={10}
                                placeholder="<h2>Overview</h2><p>Write your detailed educational resource here...</p>"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* JSON Schema Markup */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white border-b pb-2">Custom JSON-LD Schema (Optional)</h3>
                        <div>
                            <textarea
                                name="schema_markup"
                                value={formData.schema_markup}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder='{ "@context": "https://schema.org", "@type": "TechArticle", "name": "..." }'
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Publish Actions */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_published"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:outline-none transition"
                            />
                            <label htmlFor="is_published" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer select-none">
                                Published
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3.5 rounded-xl font-bold transition shadow-medium disabled:opacity-50"
                        >
                            {isSubmitting ? 'Updating SEO Page...' : 'Update Page'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
