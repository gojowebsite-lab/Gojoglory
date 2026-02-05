'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, push, query, orderByChild, equalTo, get } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { Activity, RefreshCcw, StopCircle, Info, LayoutGrid, Clock, Hash, Zap } from 'lucide-react';

interface Group {
  id: string;
  group_id: string;
  clan_id: string;
  region: string;
  status: string;
  created_at: string;
  glory_farmed: number;
}

interface ActiveGroupsProps {
  profile: Profile;
  refreshTrigger: number;
}

export function ActiveGroups({ profile, refreshTrigger }: ActiveGroupsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    const groupsRef = ref(database, 'groups');
    const q = query(groupsRef, orderByChild('user_id'), equalTo(profile.id));
    const snap = await get(q);
    if (snap.exists()) {
      const groupsList = Object.entries(snap.val())
        .map(([id, val]: [string, any]) => ({ ...val, id }))
          .filter(g => g.status === 'running' || g.status === 'pending');
        setGroups(groupsList);
      }
      setLoading(false);
    };

    useEffect(() => {
      const groupsRef = ref(database, 'groups');
      const groupsQuery = query(groupsRef, orderByChild('user_id'), equalTo(profile.id));

      const unsubscribe = onValue(groupsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const groupsList = Object.entries(data)
            .map(([id, val]: [string, any]) => ({ ...val, id }))
            .filter(g => g.status === 'running' || g.status === 'pending')

          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setGroups(groupsList);
      } else {
        setGroups([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.id, refreshTrigger]);

    const handleStop = async (groupId: string) => {
      const groupToStop = groups.find(g => g.group_id === groupId);
      if (!groupToStop) return;

      const action = groupToStop.status === 'pending' ? 'Cancel Request' : 'Stop Group';
      if (!confirm(`Are you sure you want to ${action.toLowerCase()}?`)) return;
      
      if (groupToStop.status === 'pending') {
        // Refund credit
        const regionsRef = ref(database, 'regions');
        const regionsSnap = await get(regionsRef);
        const regionsData = regionsSnap.val();
        const region = Object.values(regionsData || {}).find((r: any) => r.region_name === groupToStop.region) as any;
        const creditType = region?.tier === 'premium' ? 'premium_credits' : 'basic_credits';

        const profileRef = ref(database, `profiles/${profile.id}`);
        const profileSnap = await get(profileRef);
        const profileData = profileSnap.val();
        
        if (profileData) {
          await update(profileRef, {
            [creditType]: (profileData[creditType] || 0) + 1
          });
        }

        await update(ref(database, `groups/${groupToStop.id}`), {
          status: 'canceled',
          canceled_at: new Date().toISOString()
        });
      } else {
        await update(ref(database, `groups/${groupToStop.id}`), {
          status: 'stopped',
          stopped_at: new Date().toISOString()
        });
      }
      
      const historyRef = ref(database, `history/${profile.id}`);
      await push(historyRef, {
        username: profile.username,
        action: groupToStop.status === 'pending' ? 'cancel' : 'stop',
        group_id: groupId,
        details: groupToStop.status === 'pending' ? 'Request canceled by user' : 'Group stopped by user',
        timestamp: new Date().toISOString()
      });
    };

  const getUptime = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (loading && groups.length === 0) {
    return (
      <div className="ng-card p-12 flex justify-center items-center border border-white/5">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="ng-card p-5 md:p-8 relative border border-blue-500/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-blue-500/20 border border-blue-500/30">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-blue-400 font-black uppercase tracking-widest text-lg">My Active Groups</span>
          <span className="bg-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full ml-3 border border-blue-400/30 shadow-lg shadow-blue-500/20">{groups.length}</span>
        </h2>
        <button onClick={fetchGroups} className="ng-btn-primary text-[10px] px-5 py-3 flex items-center gap-2 uppercase tracking-[0.2em] font-black">
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white/2 rounded-3xl border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 text-gray-700 shadow-inner">
            <LayoutGrid size={36} className="opacity-50" />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active groups detected</p>
          <p className="text-gray-600 text-[10px] mt-2 font-medium uppercase tracking-wider">Launch a new group from the panel above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div key={g.group_id} className="ng-card p-5 rounded-3xl relative overflow-hidden group-card border border-white/10 hover:border-blue-500/40 transition-all hover:scale-[1.02] bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="flex justify-between items-start mb-5 relative z-10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash size={12} className="text-blue-500/50" />
                      <h3 className="font-black text-white tracking-wider font-mono truncate">{g.group_id}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">CLAN: {g.clan_id}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/10">{g.region}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {g.status === 'running' ? (
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        Running
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                        Pending
                      </span>
                    )}
                  </div>
                </div>

              
              <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                <div className="bg-black/60 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={10} className="text-gray-600" />
                    <p className="text-gray-600 text-[8px] uppercase font-black tracking-widest">Uptime</p>
                  </div>
                  <p className="text-white font-mono text-sm font-black">{getUptime(g.created_at)}</p>
                </div>
                <div className="bg-black/60 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={10} className="text-amber-500/50" />
                    <p className="text-gray-600 text-[8px] uppercase font-black tracking-widest">Farmed</p>
                  </div>
                  <p className="text-blue-400 font-black font-mono text-sm">{g.glory_farmed || 0}</p>
                </div>
              </div>

                <div className="flex gap-2 relative z-10">
                  {g.status === 'running' ? (
                    <>
                      <button onClick={() => handleStop(g.group_id)} className="flex-1 py-3 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 text-white transition-all flex items-center justify-center gap-2 group/stop">
                        <StopCircle size={14} className="group-hover/stop:scale-110 transition-transform" />
                        Stop
                      </button>
                      <button className="flex-1 py-3 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 group/info">
                        <Info size={14} className="group-hover/info:scale-110 transition-transform" />
                        Details
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleStop(g.group_id)} className="w-full py-3 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-2 group/cancel">
                      <StopCircle size={14} className="group-hover/cancel:scale-110 transition-transform" />
                      Cancel Request
                    </button>
                  )}
                </div>


              {/* Decorative background element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
