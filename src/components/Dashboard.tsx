'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { User } from 'firebase/auth';
import { Profile } from '@/hooks/useUser';
import { AdminView } from './AdminView';
import { UserView } from './UserView';
import { useSettings } from '@/hooks/useSettings';
import { MessageCircle, Send } from 'lucide-react';
import { BroadcastBanner } from './BroadcastBanner';

interface DashboardProps {
  user: User;
  profile: Profile;
}

export function Dashboard({ user, profile }: DashboardProps) {
  const { settings } = useSettings();
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div id="dashboard-screen" className="flex-grow flex flex-col min-h-screen relative">
      <nav className="sticky top-0 z-50 px-4 py-3 bg-[#0b0e14]/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-9 h-9 object-contain rounded-xl bg-black/40 border border-white/10 p-1" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#dd0031] to-[#c3002f] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-semibold text-white heading">{settings.name || 'FFGlory'}</h1>
                <div className="live-indicator hidden sm:flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400 font-medium tracking-wider">LIVE</span>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="sm:hidden text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors">
              Logout
            </button>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="ng-badge text-xs px-2.5 py-1">
                {profile.username} ({profile.role})
              </span>
              <span className="ng-badge-success text-xs px-2.5 py-1 flex items-center gap-1.5">
                <span>🔵</span> Basic: <span className="font-bold">{profile.basic_credits}</span>
              </span>
              <span className="ng-badge-warning text-xs px-2.5 py-1 flex items-center gap-1.5">
                <span>⭐</span> Premium: <span className="font-bold">{profile.premium_credits}</span>
              </span>
            </div>
            <button onClick={handleLogout} className="hidden sm:block ng-btn-outline text-xs px-4 py-1.5 font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-grow p-4 md:p-6 overflow-auto relative z-10">
        <BroadcastBanner />
        {profile.role === 'admin' ? (
          <AdminView user={user} profile={profile} />
        ) : (
          <UserView user={user} profile={profile} />
        )}
      </div>

      {/* Floating Support Buttons */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
        {settings.telegram_enabled && settings.telegram_link && (
          <a
            href={settings.telegram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-110 transition-transform duration-300"
          >
            <Send size={24} />
          </a>
        )}
        {settings.whatsapp_enabled && settings.whatsapp_link && (
          <a
            href={settings.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 transition-transform duration-300"
          >
            <MessageCircle size={24} />
          </a>
        )}
      </div>
    </div>
  );
}
