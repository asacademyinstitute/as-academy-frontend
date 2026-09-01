'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { paymentAnalyticsAPI, coursesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { formatCurrency, formatDateTime } from '@/lib/utils';

// ─── Icons ──────────────────────────────────────────────────────────────────
const TrendingUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
);
const ShoppingCartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);
const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
const AlertCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
const FilterIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);
const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);
const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
    { label: 'Today', key: 'today' },
    { label: 'This Month', key: 'thisMonth' },
    { label: 'Last Month', key: 'lastMonth' },
    { label: 'Last 3 Months', key: 'last3Months' },
    { label: 'This Year', key: 'thisYear' },
    { label: 'All Time', key: 'all' },
];

function getQuickDates(key) {
    const now = new Date();
    switch (key) {
        case 'today': {
            const d = now.toISOString().slice(0, 10);
            return { startDate: d, endDate: d, month: '' };
        }
        case 'thisMonth': {
            const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return { month: m, startDate: '', endDate: '' };
        }
        case 'lastMonth': {
            const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return { month: m, startDate: '', endDate: '' };
        }
        case 'last3Months': {
            const end = now.toISOString().slice(0, 10);
            const start3 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const start = start3.toISOString().slice(0, 10);
            return { startDate: start, endDate: end, month: '' };
        }
        case 'thisYear': {
            const start = `${now.getFullYear()}-01-01`;
            const end = now.toISOString().slice(0, 10);
            return { startDate: start, endDate: end, month: '' };
        }
        default:
            return { startDate: '', endDate: '', month: '' };
    }
}

function StatusBadge({ status }) {
    const cfg = {
        success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        failed: 'bg-red-500/15 text-red-400 border-red-500/30',
        pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        created: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${cfg[status] || cfg.pending}`}>
            {status}
        </span>
    );
}

function MethodBadge({ method }) {
    const cfg = {
        offline: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        razorpay: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${cfg[method] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
            {method || 'online'}
        </span>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient, delay = 0 }) {
    return (
        <div
            className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 opacity-10 ${gradient}`} />
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${gradient} opacity-80`}>
                        {icon}
                    </div>
                    <span className="text-sm text-gray-400 font-medium">{label}</span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminPaymentsContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // Filter state
    const [activeQuick, setActiveQuick] = useState('all');
    const [filterMode, setFilterMode] = useState('quick'); // 'quick' | 'custom' | 'month'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');

    // Data state
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({ totalAmount: 0, successCount: 0, totalCount: 0 });
    const [advStats, setAdvStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const handleLogout = async () => { await logout(); router.push('/'); };

    const buildParams = useCallback(() => {
        const params = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (methodFilter) params.paymentMethod = methodFilter;

        if (filterMode === 'quick') {
            const dates = getQuickDates(activeQuick);
            if (dates.month) params.month = dates.month;
            if (dates.startDate) params.startDate = dates.startDate;
            if (dates.endDate) params.endDate = dates.endDate;
        } else if (filterMode === 'month' && monthFilter) {
            params.month = monthFilter;
        } else if (filterMode === 'custom') {
            if (customStart) params.startDate = customStart;
            if (customEnd) params.endDate = customEnd;
        }
        return params;
    }, [activeQuick, filterMode, customStart, customEnd, monthFilter, statusFilter, methodFilter, page]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = buildParams();
            // Separate params for summary (all records in period, no pagination)
            const summaryParams = { ...params, page: 1, limit: 500 };

            const [filteredRes, summaryRes, advRes] = await Promise.all([
                paymentAnalyticsAPI.getFiltered(params),
                paymentAnalyticsAPI.getFiltered(summaryParams),
                paymentAnalyticsAPI.getAdvanced().catch(() => null),
            ]);

            const result = filteredRes.data.data;
            const summaryResult = summaryRes.data.data;

            setPayments(result.payments || []);
            setTotalPages(result.pagination?.totalPages || 1);

            // Compute summary from the full page (up to 500 records)
            const allPayments = summaryResult.payments || [];
            let totalAmount = 0;
            let successCount = 0;
            allPayments.forEach(p => {
                const isSuccess = p.status === 'success' || p.status === 'completed';
                if (isSuccess) {
                    totalAmount += parseFloat(p.amount) || 0;
                    successCount++;
                }
            });

            // Prefer backend summary, fallback to client-computed
            const backendSummary = summaryResult.summary;
            setSummary({
                totalAmount: backendSummary?.totalAmount ?? totalAmount,
                successCount: backendSummary?.successCount ?? successCount,
                totalCount: backendSummary?.totalCount ?? summaryResult.pagination?.total ?? allPayments.length,
            });

            if (advRes) setAdvStats(advRes.data.data);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { setPage(1); }, [activeQuick, filterMode, customStart, customEnd, monthFilter, statusFilter, methodFilter]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const applyQuick = (key) => {
        setActiveQuick(key);
        setFilterMode('quick');
    };

    const applyCustom = () => { setFilterMode('custom'); };
    const applyMonth = () => { setFilterMode('month'); };

    const periodLabel = () => {
        if (filterMode === 'month' && monthFilter) return `Month: ${monthFilter}`;
        if (filterMode === 'custom') {
            if (customStart && customEnd) return `${customStart} → ${customEnd}`;
            if (customStart) return `From ${customStart}`;
        }
        if (filterMode === 'quick') return QUICK_FILTERS.find(f => f.key === activeQuick)?.label || 'All Time';
        return 'All Time';
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0f1a 100%)' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { font-family: 'Inter', sans-serif; }
                .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
                .glass-dark { background: rgba(0,0,0,0.3); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); }
                .fade-in { animation: fadeIn 0.4s ease forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .pulse-dot { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                input[type='month']::-webkit-calendar-picker-indicator,
                input[type='date']::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.6); cursor: pointer; }
                .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
                .row-hover:hover { background: rgba(255,255,255,0.04); }
                .filter-pill { transition: all 0.2s ease; }
                .filter-pill:hover { transform: translateY(-1px); }
            `}</style>

            <AdminMobileNav user={user} onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ─── Header ───────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Payment Analytics</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track revenue, purchases & payment details</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/admin/payments/offline"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                        >
                            <PlusIcon /> Offline Enrollment
                        </Link>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 glass filter-pill"
                        >
                            <span className={loading ? 'animate-spin' : ''}><RefreshIcon /></span>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ─── All-time Stats Row ───────────────────────────── */}
                {advStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
                        <StatCard
                            icon={<TrendingUpIcon />}
                            label="All Time Revenue"
                            value={formatCurrency(advStats.totalRevenue || 0)}
                            sub={`${advStats.totalCount || 0} transactions`}
                            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                        />
                        <StatCard
                            icon={<CalendarIcon />}
                            label="This Month"
                            value={formatCurrency(advStats.thisMonthRevenue || 0)}
                            sub={`${advStats.thisMonthCount || 0} purchases`}
                            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                            delay={60}
                        />
                        <StatCard
                            icon={<ShoppingCartIcon />}
                            label="Last Month"
                            value={formatCurrency(advStats.lastMonthRevenue || 0)}
                            sub={`${advStats.lastMonthCount || 0} purchases`}
                            gradient="bg-gradient-to-br from-violet-500 to-purple-700"
                            delay={120}
                        />
                        <StatCard
                            icon={<CheckCircleIcon />}
                            label="Today"
                            value={formatCurrency(advStats.todayRevenue || 0)}
                            sub={`${advStats.todayCount || 0} today`}
                            gradient="bg-gradient-to-br from-orange-500 to-rose-600"
                            delay={180}
                        />
                    </div>
                )}

                {/* ─── Filters Panel ────────────────────────────────── */}
                <div className="glass rounded-2xl p-5 space-y-4 fade-in">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <FilterIcon /> Filter Payments
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => applyQuick(f.key)}
                                className={`filter-pill px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${filterMode === 'quick' && activeQuick === f.key
                                    ? 'text-white border-violet-500 bg-violet-500/20'
                                    : 'text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Specific Month */}
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">
                                <CalendarIcon className="inline w-3 h-3 mr-1" /> Specific Month
                            </label>
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={e => { setMonthFilter(e.target.value); applyMonth(); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                            />
                        </div>

                        {/* Custom Date From */}
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Custom From</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => { setCustomStart(e.target.value); applyCustom(); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                            />
                        </div>

                        {/* Custom Date To */}
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Custom To</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => { setCustomEnd(e.target.value); applyCustom(); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                            />
                        </div>

                        {/* Status filter */}
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Status</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                            >
                                <option value="">All Status</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                                <option value="created">Created</option>
                            </select>
                        </div>

                        {/* Method filter */}
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Payment Method</label>
                            <select
                                value={methodFilter}
                                onChange={e => setMethodFilter(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                            >
                                <option value="">All Methods</option>
                                <option value="offline">Offline</option>
                                <option value="razorpay">Razorpay</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ─── Filtered Summary ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in">
                    {/* Period label */}
                    <div className="sm:col-span-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Showing results for:</span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-violet-300 border border-violet-500/30" style={{ background: 'rgba(139,92,246,0.12)' }}>
                                {periodLabel()}
                            </span>
                            {loading && <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot" />Loading...</span>}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-5" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Total Revenue (filtered)</div>
                        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalAmount || 0)}</div>
                        <div className="text-xs text-gray-600 mt-1">successful payments only</div>
                    </div>

                    <div className="glass rounded-2xl p-5" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Successful Purchases</div>
                        <div className="text-2xl font-bold text-indigo-400">{summary.successCount || 0}</div>
                        <div className="text-xs text-gray-600 mt-1">completed transactions</div>
                    </div>

                    <div className="glass rounded-2xl p-5" style={{ borderColor: 'rgba(251,146,60,0.2)' }}>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Total Records</div>
                        <div className="text-2xl font-bold text-orange-400">{summary.totalCount || 0}</div>
                        <div className="text-xs text-gray-600 mt-1">all status included</div>
                    </div>
                </div>

                {/* ─── Payments Table ───────────────────────────────── */}
                <div className="glass rounded-2xl overflow-hidden fade-in">
                    <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Payment List</h2>
                        <span className="text-xs text-gray-500">{payments.length} records on this page</span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                            <p className="text-sm text-gray-500">Loading payments...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <AlertCircleIcon className="w-10 h-10 text-gray-600" />
                            <p className="text-gray-500 font-medium">No payments found for this period</p>
                            <p className="text-sm text-gray-600">Try changing the date range or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map((payment, idx) => (
                                        <tr key={payment.id} className="row-hover transition-colors duration-150">
                                            <td className="px-5 py-4 text-xs text-gray-600">
                                                {(page - 1) * 20 + idx + 1}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                        style={{ background: `hsl(${(payment.users?.name?.charCodeAt(0) || 65) * 5 % 360}, 60%, 40%)` }}>
                                                        {(payment.users?.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{payment.users?.name || '—'}</div>
                                                        <div className="text-xs text-gray-500">{payment.users?.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-sm text-gray-200 max-w-[180px] truncate" title={payment.courses?.title}>
                                                    {payment.courses?.title || '—'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className={`text-sm font-bold ${payment.status === 'success' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                    {formatCurrency(payment.amount || 0)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <MethodBadge method={payment.payment_method} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={payment.status} />
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                                                {formatDateTime(payment.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page
                                                ? 'text-white'
                                                : 'text-gray-500 glass hover:text-gray-200'
                                                }`}
                                            style={p === page ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : {}}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function AdminPaymentsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminPaymentsContent />
        </ProtectedRoute>
    );
}
