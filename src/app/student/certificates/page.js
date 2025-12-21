'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { certificateAPI, enrollmentAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { DashboardNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Award, User, ShoppingBag } from 'lucide-react';

function CertificatesContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [certificates, setCertificates] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState({});

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [certsRes, enrollRes] = await Promise.all([
                certificateAPI.getStudentCertificates(user.id),
                enrollmentAPI.getStudentEnrollments(user.id)
            ]);

            setCertificates(certsRes.data.data || []);
            setEnrollments(enrollRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (certificateId) => {
        try {
            const response = await certificateAPI.getDownloadUrl(certificateId);
            window.open(response.data.data.url, '_blank');
        } catch (error) {
            alert('Failed to download certificate');
        }
    };

    const handleGenerateCertificate = async (courseId) => {
        setGenerating(prev => ({ ...prev, [courseId]: true }));
        try {
            await certificateAPI.generate(courseId);
            alert('Certificate generated successfully!');
            await fetchData(); // Refresh data
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate certificate');
        } finally {
            setGenerating(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const hasCertificate = (courseId) => {
        return certificates.some(cert => cert.course_id === courseId);
    };

    const getCertificate = (courseId) => {
        return certificates.find(cert => cert.course_id === courseId);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const navItems = [
        { label: 'My Courses', href: '/student/dashboard', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Certificates', href: '/student/certificates', icon: <Award className="w-5 h-5" /> },
        { label: 'Profile', href: '/student/profile', icon: <User className="w-5 h-5" /> },
        { label: 'Browse Courses', href: '/courses', icon: <ShoppingBag className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background">
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/student/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Earned Certificates */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Certificates</h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : certificates.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates.map((certificate) => (
                                <div key={certificate.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="h-40 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                        <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            {certificate.courses?.title || 'Course Certificate'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Issued: {formatDate(certificate.issued_date)}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-4 font-mono">
                                            {certificate.certificate_number}
                                        </p>
                                        <button
                                            onClick={() => handleDownload(certificate.id)}
                                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Download Certificate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-gray-500 mb-2">No certificates yet</p>
                            <p className="text-sm text-gray-400">
                                Complete all lectures in a course to earn a certificate
                            </p>
                        </div>
                    )}
                </div>

                {/* Enrolled Courses - Generate Certificates */}
                {enrollments.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Certificates</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment) => {
                                const cert = getCertificate(enrollment.courses.id);
                                const hasCert = hasCertificate(enrollment.courses.id);

                                return (
                                    <div key={enrollment.id} className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            {enrollment.courses.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Enrolled: {formatDate(enrollment.enrolled_at)}
                                        </p>

                                        {hasCert ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center text-green-600 text-sm mb-2">
                                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Certificate Generated
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(cert.id)}
                                                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Download Certificate
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateCertificate(enrollment.courses.id)}
                                                disabled={generating[enrollment.courses.id]}
                                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {generating[enrollment.courses.id] ? 'Generating...' : 'Generate Certificate'}
                                            </button>
                                        )}

                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            {hasCert ? 'Certificate ready' : 'Complete all lectures to generate'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CertificatesPage() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <CertificatesContent />
        </ProtectedRoute>
    );
}
