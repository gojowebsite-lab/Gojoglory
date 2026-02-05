'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { Clock, Shield, ChevronDown } from 'lucide-react';

interface GroupLog {
  group_id: string;
  clan_id: string;
  region: string;
  status: string;
  created_at: string;
  stopped_at: string;
  glory_farmed: number;
}

interface GroupHistoryProps {
  profile: Profile;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger: number;
}

export function GroupHistory({ profile, isOpen, onToggle, refreshTrigger }: GroupHistoryProps) {
  const [history, setHistory] = useState<GroupLog[]>([]);

  useEffect(() => {
    if (!profile.id) return;
    
    const groupsRef = ref(database, 'groups');
    const groupsQuery = query(groupsRef, orderByChild('user_id'), equalTo(profile.id));

    const unsubscribe = onValue(groupsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
          const historyList = Object.values(data)
            .filter((g: any) => g.status !== 'running' && g.status !== 'pending')
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as GroupLog[];
          setHistory(historyList);

      } else {
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, [profile.id, refreshTrigger]);

  return (
    <div className="ng-card relative overflow-visible">
      <div onClick={onToggle} className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-amber-500/20 border border-amber-500/30">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-amber-400 font-bold">Group History</span>
          <span className="ng-badge text-xs ml-2 border-amber-500/30 text-amber-400">{history.length}</span>
        </h2>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>

      <div className={`px-4 md:px-6 pb-4 md:pb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3 max-h-96 overflow-y-auto pt-4">
          {history.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Clock className="w-12 h-12 text-gray-700" />
              <div className="text-gray-500 font-medium">No group history yet</div>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.group_id} className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-500/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-600/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white font-mono">{h.group_id}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Clan: {h.clan_id} • {h.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Glory</p>
                    <p className="text-green-400 font-bold font-mono">+{h.glory_farmed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-medium">{new Date(h.created_at).toLocaleDateString()}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        h.status === 'stopped' ? 'bg-gray-500/10 text-gray-500' :
                        h.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        h.status === 'canceled' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {h.status}
                      </span>

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
