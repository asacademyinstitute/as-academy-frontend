'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { certificateAPI } from '@/lib/api';
import { ResponsiveNav } from '@/components/ui/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Shield, CheckCircle2, XCircle, Search, Copy, Check, Award, ExternalLink, Calendar, User, BookOpen, Hash } from 'lucide-react';

interface CertificateData {
    studentName: string;
    courseTitle: string;
    issuedDate: string;
    certificateNumber: string;
}

function VerifyCertificateContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get('id') || searchParams.get('cert') || searchParams.get('number') || '';

    const [certificateId, setCertificateId] = useState(initialId);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        searched: boolean;
        valid: boolean;
        certificate?: CertificateData;
        message?: string;
    }>({ searched: false, valid: false });
    const [copied, setCopied] = useState(false);

    const handleVerify = async (idToVerify?: string) => {
        const id = (idToVerify || certificateId).trim();
        if (!id) return;

        setLoading(true);
        setResult({ searched: false, valid: false });

        try {
            const res = await certificateAPI.verify(id);
            const data = res?.data?.data;

            if (data?.valid && data?.certificate) {
                setResult({
                    searched: true,
                    valid: true,
                    certificate: data.certificate,
                });
            } else {
                setResult({
                    searched: true,
                    valid: false,
                    message: data?.message || 'Certificate not found in official records.',
                });
            }
        } catch (error: any) {
            console.error('Certificate verification error:', error);
            setResult({
                searched: true,
                valid: false,
                message: error.response?.data?.message || 'Certificate not found or invalid format.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto verify if query parameter is present on page load
    useEffect(() => {
        if (initialId) {
            handleVerify(initialId);
        }
    }, [initialId]);

    const handleCopyLink = () => {
        const currentUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/verify-certificate?id=${encodeURIComponent(certificateId)}`
            : '';
        if (currentUrl) {
            navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setCertificateId(text.trim());
            }
        } catch (e) {}
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return dateString;
        }
    };

    const navItems = [
        { label: 'Courses', href: '/courses' },
        { label: 'Verify Certificate', href: '/verify-certificate' },
        { label: 'Login', href: '/login' },
    ];

    const navActions = (
        <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-4 md:px-5 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all text-xs sm:text-sm"
            >
                Get Started
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 text-gray-900 dark:text-gray-100 flex flex-col">
            {/* Header Navigation */}
            <ResponsiveNav
                brand={{ name: 'AS ACADEMY', href: '/' }}
                items={navItems}
                actions={navActions}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
                {/* Hero Header */}
                <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 shadow-xs">
                        <Shield className="w-4 h-4" />
                        <span>Official Credential Verification</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                        Verify AS Academy <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Certificate</span>
                    </h1>

                    <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                        Enter the Certificate Number printed on any AS Academy certificate to instantly authenticate student completion records.
                    </p>
                </div>

                {/* Search Box Card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl shadow-xl shadow-blue-500/5 p-4 sm:p-7 mb-10">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleVerify();
                        }}
                        className="space-y-3"
                    >
                        <label htmlFor="certificateId" className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                            Certificate Number / ID
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <input
                                    id="certificateId"
                                    type="text"
                                    value={certificateId}
                                    onChange={(e) => setCertificateId(e.target.value)}
                                    placeholder="e.g. AS-1766064042563-5FD0FC88"
                                    className="w-full pl-10 pr-20 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={handlePaste}
                                    title="Paste from clipboard"
                                    className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-gray-200/60 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center gap-1 transition"
                                >
                                    Paste
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !certificateId.trim()}
                                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" />
                                        <span>Verify Now</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Quick Test Demo Helper */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>💡 Try demo certificate ID:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setCertificateId('AS-1766064042563-5FD0FC88');
                                handleVerify('AS-1766064042563-5FD0FC88');
                            }}
                            className="font-mono text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                            AS-1766064042563-5FD0FC88 ↗
                        </button>
                    </div>
                </div>

                {/* ── Verification Result ────────────────────────────────────────── */}
                {result.searched && (
                    <div className="mb-12 animate-in fade-in duration-300">
                        {result.valid && result.certificate ? (
                            /* VALID CERTIFICATE CARD */
                            <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/15 to-white dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900 shadow-2xl p-6 sm:p-9 text-left">
                                {/* Top Banner Badge */}
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <CheckCircle2 className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold uppercase tracking-wider mb-1">
                                                ✓ 100% Authentic & Original
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                                Verified Certificate of Completion
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Security Watermark Stamp */}
                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <Award className="w-4 h-4 text-emerald-500" />
                                        <span>AS Academy Verified</span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                                    {/* Student Name */}
                                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <span>ISSUED TO</span>
                                        </div>
                                        <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white capitalize">
                                            {result.certificate.studentName}
                                        </div>
                                    </div>

                                    {/* Course Name */}
                                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            <span>COURSE TITLE</span>
                                        </div>
                                        <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                                            {result.certificate.courseTitle}
                                        </div>
                                    </div>

                                    {/* Certificate Number */}
                                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                            <Hash className="w-4 h-4 text-emerald-500" />
                                            <span>CERTIFICATE NUMBER</span>
                                        </div>
                                        <div className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all">
                                            {result.certificate.certificateNumber}
                                        </div>
                                    </div>

                                    {/* Issue Date */}
                                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                            <Calendar className="w-4 h-4 text-purple-500" />
                                            <span>ISSUED DATE</span>
                                        </div>
                                        <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                            {formatDate(result.certificate.issuedDate)}
                                        </div>
                                    </div>
                                </div>

                                {/* Accredited Issuing Platform Footer */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
                                        <strong className="text-gray-700 dark:text-gray-300 font-semibold">Issuer:</strong> AS Academy Education Management Portal
                                        <br />This document serves as primary proof of successful completion of coursework and assessments.
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Link Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Share Verification Link</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* INVALID CERTIFICATE CARD */
                            <div className="rounded-3xl border-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 p-6 sm:p-8 text-center shadow-lg">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-4">
                                    <XCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mb-2">
                                    Certificate Not Found or Invalid
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed mb-6">
                                    No certificate record matched ID <code className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded">{certificateId}</code> in our database.
                                </p>
                                <div className="bg-white/80 dark:bg-gray-900/80 p-4 rounded-2xl border border-rose-200/50 dark:border-rose-900/30 max-w-md mx-auto text-xs text-gray-500 dark:text-gray-400 text-left space-y-1.5">
                                    <div className="font-bold text-gray-800 dark:text-gray-200">Please Check:</div>
                                    <div>• Ensure the certificate number includes the <span className="font-mono font-bold">AS-</span> prefix.</div>
                                    <div>• Verify that there are no accidental spaces or typographical errors.</div>
                                    <div>• If you completed the course recently, ensure you have generated your certificate from the student dashboard.</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Features & Trust Pillars ───────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
                    <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-3">
                            🛡️
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                            Tamper-Proof Records
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Each certificate receives a unique, unalterable identifier upon 100% course lecture completion.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-3">
                            ⚡
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                            Instant Verification
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Employers, universities, and institutions can authenticate student credentials in seconds.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-3">
                            🎓
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                            MSBTE Engineering
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Recognized diploma curriculum covering MSBTE Computer Engineering and practical solutions.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-10 mt-auto border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                    <div>
                        &copy; 2026 AS Academy. All rights reserved. Official Certificate Verification Portal.
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/courses" className="hover:text-white transition">Courses</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-white transition">Terms</Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                        <span>•</span>
                        <Link href="/help" className="hover:text-white transition">Help Center</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function VerifyCertificatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        }>
            <VerifyCertificateContent />
        </Suspense>
    );
}
