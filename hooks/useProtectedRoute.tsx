'use client';
import { useAuth } from '../context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type UserRole = 'admin' | 'user';

interface UseProtectedRouteOptions {
  allowedRoles?: UserRole[];
  requireSubscription?: boolean;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { allowedRoles = ['user'], requireSubscription = true } = options;
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Not logged in
      if (!accessToken) {
        router.push('/login');
        return;
      }

      // No user data yet - still loading
      if (!user) {
        setIsLoading(true);
        return;
      }

      // If user is admin, redirect to admin dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        router.push('/login');
        return;
      }

      // If subscription is required, check subscription status
      if (requireSubscription && user.role === 'user') {
        if (user.has_subscription !== true || user.subscription_status !== 'active') {
          router.push('/usersubscription');
          return;
        }
      }

      // User is authorized
      setIsAuthorized(true);
      setIsLoading(false);
    };

    // Small delay to allow auth context to initialize
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, accessToken, router, allowedRoles, requireSubscription]);

  return { isAuthorized, isLoading, user };
}

// Specific hooks for common use cases
export function useAdminRoute() {
  return useProtectedRoute({ allowedRoles: ['admin'], requireSubscription: false });
}

export function useUserRoute() {
  return useProtectedRoute({ allowedRoles: ['user'], requireSubscription: true });
}

export function useAnyAuthenticatedRoute() {
  return useProtectedRoute({ allowedRoles: ['admin', 'user'], requireSubscription: false });
}