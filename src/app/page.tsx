'use client';

import { useUser } from '@/hooks/useUser';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';
import { KillSwitch } from '@/components/KillSwitch';

export default function Home() {
  const { user, profile, loading } = useUser();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--ng-pink)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const content = (!user || !profile) ? <AuthScreen /> : <Dashboard user={user} profile={profile} />;

  return <KillSwitch>{content}</KillSwitch>;
}
