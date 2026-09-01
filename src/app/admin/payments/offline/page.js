'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { paymentAPI, coursesAPI, userAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import AdminMobileNav from '@/components/AdminMobileNav';
import { showToast } from '@/components/ui/toast';
import PaymentResultModal from '@/components/ui/PaymentResultModal';

// ─── Icons ──────────────────────────────────────────────────────────────────
const BookIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const CoinsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);
const ArrowLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

function OfflineEnrollmentContent() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [formData, setFormData] = useState({
        studentEmail: '',
        courseId: '',
        amount: '',
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);

    // Result modal state
    const [resultModal, setResultModal] = useState({ type: null, title: '', message: '' });

    const searchCourses = async (search) => {
        if (!search) {
            setCourses([]);
            return;
        }
        try {
            const response = await coursesAPI.getAll({ search, limit: 10 });
            setCourses(response.data.data.courses || []);
        } catch (error) {
            console.error('Error searching courses:', error);
        }
    };

    const searchStudents = async (search) => {
        if (!search) {
            setStudents([]);
            setSelectedStudent(null);
            return;
        }
        try {
            const response = await userAPI.getAll({ role: 'student', search, limit: 10 });
            setStudents(response.data.data.users || []);
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Show loading modal
        setResultModal({
            type: 'loading',
            title: 'Creating Enrollment',
            message: 'Processing offline enrollment for the student...',
        });

        try {
            let studentId = selectedStudent?.id;

            // If no student selected from dropdown, search by email
            if (!studentId) {
                const studentsRes = await userAPI.getAll({ search: formData.studentEmail });
                const found = studentsRes.data.data.users?.find(u => u.email === formData.studentEmail);
                if (!found) {
                    setResultModal({
                        type: 'error',
                        title: 'Student Not Found',
                        message: `No student account found with email "${formData.studentEmail}". Please check the email address and try again.`,
                    });
                    setLoading(false);
                    return;
                }
                studentId = found.id;
            }

            await paymentAPI.offlineEnroll({
                studentId,
                courseId: formData.courseId,
                amount: parseFloat(formData.amount),
            });

            // Success!
            setResultModal({
                type: 'success',
                title: 'Enrollment Created! ✅',
                message: `${selectedStudent?.name || formData.studentEmail} has been successfully enrolled in "${selectedCourseTitle}" with an offline payment of ₹${formData.amount}.`,
            });

            // Reset form
            setFormData({ studentEmail: '', courseId: '', amount: '' });
            setSelectedStudent(null);
            setSelectedCourseTitle('');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create offline enrollment. Please try again.';
            setResultModal({
                type: 'error',
                title: 'Enrollment Failed',
                message: errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const closeModal = () => setResultModal({ type: null, title: '', message: '' });

    const isFormValid = formData.studentEmail && formData.courseId && formData.amount && !loading;

    return (
        <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0f1a 100%)' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { font-family: 'Inter', sans-serif; }
                .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
                .glass-dark { background: rgba(0,0,0,0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); }
                .fade-in { animation: fadeIn 0.4s ease forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .focus-ring:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2); }
            `}</style>

            <AdminMobileNav user={user} onLogout={handleLogout} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 fade-in">
                {/* Back Button */}
                <div>
                    <Link
                        href="/admin/payments"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon /> Back to Payments
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass rounded-2xl p-6 sm:p-8 shadow-premium">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white">Create Offline Enrollment</h2>
                        <p className="text-sm text-gray-400 mt-1">Enroll a student manually and record their cash/bank payment</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Search */}
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                                <UserIcon /> Student Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.studentEmail}
                                onChange={(e) => {
                                    setFormData({ ...formData, studentEmail: e.target.value });
                                    setSelectedStudent(null);
                                    searchStudents(e.target.value);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus-ring outline-none transition-all"
                                placeholder="Search student by email..."
                            />
                            {/* Selected student badge */}
                            {selectedStudent && (
                                <div className="mt-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {selectedStudent.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-violet-300 truncate">{selectedStudent.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{selectedStudent.email}</p>
                                    </div>
                                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold border border-emerald-500/20">✓ Selected</span>
                                </div>
                            )}
                            {students.length > 0 && !selectedStudent && (
                                <div className="absolute z-10 w-full mt-2 glass-dark rounded-xl max-h-52 overflow-y-auto shadow-2xl divide-y divide-white/5">
                                    {students.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, studentEmail: s.email });
                                                setSelectedStudent(s);
                                                setStudents([]);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {s.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-white text-sm truncate">{s.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5 truncate">{s.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Course Search */}
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                                <BookIcon /> Select Course *
                            </label>
                            <input
                                type="text"
                                placeholder="Search course by title..."
                                onChange={(e) => searchCourses(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus-ring outline-none transition-all mb-2"
                            />
                            {courses.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 glass-dark rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-white/5">
                                    {courses.map((course) => (
                                        <button
                                            key={course.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    courseId: course.id,
                                                    amount: course.price.toString()
                                                });
                                                setSelectedCourseTitle(course.title);
                                                setCourses([]);
                                                showToast(`Course selected: ${course.title}`, 'info', 2000);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            <div className="font-semibold text-white text-sm">{course.title}</div>
                                            <div className="text-xs text-violet-400 mt-0.5 font-bold">Standard Price: ₹{course.price}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {formData.courseId && (
                                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                                    ✓ Selected: {selectedCourseTitle}
                                </div>
                            )}
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                                <CoinsIcon /> Amount Paid (₹) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus-ring outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            {formData.amount && parseFloat(formData.amount) > 0 && (
                                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                    Amount: <span className="text-violet-300 font-bold">₹{parseFloat(formData.amount).toLocaleString('en-IN')}</span>
                                </p>
                            )}
                        </div>

                        {/* Enrollment Summary */}
                        {isFormValid && (
                            <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 rounded-xl p-4">
                                <h4 className="font-semibold text-violet-300 text-sm mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Enrollment Summary
                                </h4>
                                <div className="space-y-1.5 text-xs text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Student</span>
                                        <span className="text-white font-medium">{selectedStudent?.name || formData.studentEmail}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Course</span>
                                        <span className="text-white font-medium truncate max-w-[180px] text-right">{selectedCourseTitle}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
                                        <span className="font-semibold text-gray-300">Amount Collected</span>
                                        <span className="text-emerald-400 font-bold">₹{parseFloat(formData.amount).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Note Alert Panel */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                            <h4 className="font-semibold text-blue-400 text-sm flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Offline Enrollment Notice
                            </h4>
                            <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4">
                                <li>Allows entering a custom fee amount matching offline cash/receipt deals.</li>
                                <li>Creates a corresponding transaction record with "offline" status.</li>
                                <li>Enrolls student automatically starting from today.</li>
                            </ul>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 text-sm shadow-lg shadow-purple-900/20"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                            >
                                {loading ? 'Enrolling Student...' : 'Confirm Offline Enrollment'}
                            </button>
                            <Link
                                href="/admin/payments"
                                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3.5 rounded-xl text-center font-bold border border-white/10 transition-colors text-sm"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Result Modal */}
            <PaymentResultModal
                type={resultModal.type}
                title={resultModal.title}
                message={resultModal.message}
                onClose={closeModal}
                onAction={resultModal.type === 'success' ? () => router.push('/admin/payments') : null}
                actionLabel="View All Payments"
                secondaryLabel={resultModal.type === 'success' ? 'Enroll Another Student' : undefined}
                onSecondary={resultModal.type === 'success' ? closeModal : undefined}
            />
        </div>
    );
}

export default function OfflineEnrollmentPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <OfflineEnrollmentContent />
        </ProtectedRoute>
    );
}
