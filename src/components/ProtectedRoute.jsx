import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
                // Redirect to appropriate dashboard based on role
                if (user?.role === 'student') {
                    router.push('/student/dashboard');
                } else if (user?.role === 'teacher') {
                    router.push('/teacher/dashboard');
                } else if (user?.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/');
                }
            }
        }
    }, [isAuthenticated, user, isLoading, allowedRoles, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!isAuthenticated || (allowedRoles.length > 0 && !allowedRoles.includes(user?.role))) {
        return null;
    }

    // Render children if authenticated and authorized
    return <>{children}</>;
}
