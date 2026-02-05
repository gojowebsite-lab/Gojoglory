'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { User } from 'firebase/auth';
import { Profile } from '@/hooks/useUser';
import { UsersTab } from './AdminView/UsersTab';
import { InvitationsTab } from './AdminView/InvitationsTab';
import { GroupsTab } from './AdminView/GroupsTab';
import { TransactionsTab } from './AdminView/TransactionsTab';
import { PricingTab } from './AdminView/PricingTab';
import { BroadcastTab } from './AdminView/BroadcastTab';
import { SettingsTab } from './AdminView/SettingsTab';

interface AdminViewProps {
  user: User;
  profile: Profile;
}

export function AdminView({ user, profile }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [usersCount, setUsersCount] = useState(0);
  const [invitesCount, setInvitesCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [pendingTxCount, setPendingTxCount] = useState(0);

  useEffect(() => {
    const unsubProfiles = onValue(ref(database, 'profiles'), (snap) => {
      setUsersCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    const unsubInvites = onValue(ref(database, 'invitations'), (snap) => {
      if (snap.exists()) {
        const invites = Object.values(snap.val());
        setInvitesCount(invites.filter((i: any) => !i.is_used).length);
      } else {
        setInvitesCount(0);
      }
    });

    const unsubGroups = onValue(ref(database, 'groups'), (snap) => {
      if (snap.exists()) {
        const groups = Object.values(snap.val());
        setGroupsCount(groups.filter((g: any) => g.status === 'running').length);
      } else {
        setGroupsCount(0);
      }
    });

    const unsubTransactions = onValue(ref(database, 'transactions'), (snap) => {
      if (snap.exists()) {
        let pendingCount = 0;
        const allUserTx = snap.val();
        Object.values(allUserTx).forEach((userTx: any) => {
          Object.values(userTx).forEach((tx: any) => {
            if (tx.status === 'pending') pendingCount++;
          });
        });
        setPendingTxCount(pendingCount);
      } else {
        setPendingTxCount(0);
      }
    });

    return () => {
      unsubProfiles();
      unsubInvites();
      unsubGroups();
      unsubTransactions();
    };
  }, []);

  const tabs = [
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', badge: usersCount },
    { id: 'invitations', label: 'Invitations', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', badge: invitesCount },
    { id: 'groups', label: 'Groups', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', badge: groupsCount },
    { id: 'transactions', label: 'Transactions', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', badge: pendingTxCount > 0 ? pendingTxCount : undefined },
    { id: 'pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'broadcast', label: 'Broadcast', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div id="admin-view" className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="ng-card p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent text-[var(--ng-text-muted)] border border-[var(--ng-border)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
              </svg>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-violet-500/10 text-violet-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-section">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'invitations' && <InvitationsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
