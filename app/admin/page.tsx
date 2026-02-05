'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/lib/user-context';
import { AdminConsole } from '@/components/admin-console';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useTeam();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for user data to load
    if (isLoading) return;

    // Check if user exists and is admin
    if (!user) {
      // Not logged in - redirect to home
      setIsAuthorized(false);
      router.replace('/');
      return;
    }

    if (!user.is_admin) {
      // Logged in but not admin - redirect to home
      setIsAuthorized(false);
      router.replace('/');
      return;
    }

    // User is admin
    setIsAuthorized(true);
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authorized, show nothing (redirect is happening)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive text-sm">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authorized - render admin console
  return (
    <div className="min-h-screen bg-background">
      <AdminConsole 
        onBack={() => router.push('/')} 
        onResetFlow={() => router.push('/')}
      />
    </div>
  );
}
