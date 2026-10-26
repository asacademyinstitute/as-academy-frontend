'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
    const [showConfetti, setShowConfetti] = useState(false);
    const canvasRef = useRef(null);

    // ── Confetti Animation ──────────────────────────────────────────────
    const fireConfetti = useCallback(() => {
        setShowConfetti(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
        const particles = Array.from({ length: 150 }, () => ({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 16,
            vy: Math.random() * -18 - 4,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            gravity: 0.3 + Math.random() * 0.2,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
        }));

        let frame = 0;
        const maxFrames = 120;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            particles.forEach(p => {
                p.x += p.vx;
                p.vy += p.gravity;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.opacity = Math.max(0, 1 - frame / maxFrames);
                if (p.opacity > 0) alive = true;

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });
            frame++;
            if (alive && frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setShowConfetti(false);
            }
        };
        requestAnimationFrame(animate);
    }, []);

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
            fireConfetti();
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
        <div className="min-h-screen bg-background dark:bg-gray-950 pb-24 md:pb-0">
            {/* Confetti Canvas */}
            {showConfetti && <canvas ref={canvasRef} className="confetti-canvas" />}
            {/* Navigation */}
            <DashboardNav
                brand={{ name: 'AS ACADEMY', href: '/student/dashboard' }}
                user={{ name: user?.name || '', email: user?.email }}
                navItems={navItems}
                onLogout={handleLogout}
                actions={<ThemeToggle />}
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto container-padding py-6 md:py-8">
                {/* Earned Certificates */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Certificates</h2>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                                    <div className="skeleton h-40" style={{ borderRadius: 0 }}></div>
                                    <div className="p-6 space-y-3">
                                        <div className="skeleton h-5 w-3/4"></div>
                                        <div className="skeleton h-4 w-1/2"></div>
                                        <div className="skeleton h-3 w-2/3"></div>
                                        <div className="skeleton h-10 w-full rounded-lg"></div>
                                    </div>
                                </div>
                            ))}
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
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleDownload(certificate.id)}
                                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                                            >
                                                Download Certificate
                                            </button>
                                            <Link
                                                href={`/verify-certificate?id=${encodeURIComponent(certificate.certificate_number)}`}
                                                target="_blank"
                                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition text-xs font-bold"
                                            >
                                                <span>✓ Verify Authenticity</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                            </Link>
                                        </div>
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
