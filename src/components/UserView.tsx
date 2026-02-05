'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { Profile } from '@/hooks/useUser';
import { LaunchGroup } from './UserView/LaunchGroup';
import { ActiveGroups } from './UserView/ActiveGroups';
import { BuyCredits } from './UserView/BuyCredits';
import { TransactionHistory } from './UserView/TransactionHistory';
import { CouponSystem } from './UserView/CouponSystem';
import { GroupHistory } from './UserView/GroupHistory';
import { InboxSection } from './UserView/InboxSection';

interface UserViewProps {
  user: User;
  profile: Profile;
}

export function UserView({ user, profile }: UserViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'buy-credits': false,
    'transactions': false,
    'history': false,
    'coupons': false,
    'inbox': true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div id="user-view" className="space-y-6 md:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <InboxSection 
        profile={profile} 
        isOpen={openSections['inbox']} 
        onToggle={() => toggleSection('inbox')}
        onUpdate={handleUpdate}
      />

      <BuyCredits 
        profile={profile} 
        isOpen={openSections['buy-credits']} 
        onToggle={() => toggleSection('buy-credits')}
        onSuccess={handleUpdate}
      />

      <TransactionHistory 
        profile={profile} 
        isOpen={openSections['transactions']} 
        onToggle={() => toggleSection('transactions')}
        refreshTrigger={refreshTrigger}
      />

      <CouponSystem 
        profile={profile} 
        isOpen={openSections['coupons']} 
        onToggle={() => toggleSection('coupons')}
        refreshTrigger={refreshTrigger}
        onUpdate={handleUpdate}
      />

      <GroupHistory 
        profile={profile} 
        isOpen={openSections['history']} 
        onToggle={() => toggleSection('history')}
        refreshTrigger={refreshTrigger}
      />

      <LaunchGroup 
        profile={profile} 
        onLaunch={handleUpdate}
      />

      <ActiveGroups 
        profile={profile} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
