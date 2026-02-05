'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, remove, get } from 'firebase/database';

interface Group {
  id: string;
  group_id: string;
  user_id: string;
  clan_id: string;
  region: string;
  status: string;
  created_at: string;
  stopped_at: string | null;
  glory_farmed: number;
  username?: string;
}

export function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const groupsRef = ref(database, 'groups');
    const profilesRef = ref(database, 'profiles');

    const unsubGroups = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groupsList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setGroups(groupsList);
      } else {
        setGroups([]);
      }
      setLoading(false);
    });

    const unsubProfiles = onValue(profilesRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfiles(snapshot.val());
      }
    });

    return () => {
      unsubGroups();
      unsubProfiles();
    };
  }, []);

  const approveGroup = async (groupId: string) => {
    await update(ref(database, `groups/${groupId}`), {
      status: 'running',
      approved_at: new Date().toISOString()
    });
  };

  const rejectGroup = async (groupId: string, userId: string, regionName: string) => {
    if (!confirm('Reject this request and refund credits?')) return;
    
    try {
      // Find the region to know which credit type to refund
      const regionsRef = ref(database, 'regions');
      const regionsSnap = await get(regionsRef);
      const regionsData = regionsSnap.val();
      const region = Object.values(regionsData || {}).find((r: any) => r.region_name === regionName) as any;
      const creditType = region?.tier === 'premium' ? 'premium_credits' : 'basic_credits';
      
      const profileRef = ref(database, `profiles/${userId}`);
      const profileSnap = await get(profileRef);
      const profile = profileSnap.val();
      
      if (profile) {
        await update(profileRef, {
          [creditType]: (profile[creditType] || 0) + 1
        });
      }

      await update(ref(database, `groups/${groupId}`), {
        status: 'rejected',
        rejected_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error rejecting group:', err);
      alert('Failed to reject group');
    }
  };

  const stopGroup = async (groupId: string) => {
    await update(ref(database, `groups/${groupId}`), {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    });
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    await remove(ref(database, `groups/${groupId}`));
  };

  const filteredGroups = groups.map(g => ({
    ...g,
    username: profiles[g.user_id]?.username || 'Unknown'
  })).filter(g => {
    if (filter === 'all') return true;
    return g.status === filter;
  });

  const runningCount = groups.filter(g => g.status === 'running').length;
  const stoppedCount = groups.filter(g => g.status === 'stopped').length;

  return (
    <div className="ng-card p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-emerald-500/20 border border-emerald-500/30">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          Group Monitoring
        </h2>
        <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter('all')} 
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                All ({groups.length})
              </button>
              <button 
                onClick={() => setFilter('pending')} 
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
              >
                Pending ({groups.filter(g => g.status === 'pending').length})
              </button>
              <button 
                onClick={() => setFilter('running')} 
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-emerald-400'}`}
              >
                Running ({groups.filter(g => g.status === 'running').length})
              </button>
              <button 
                onClick={() => setFilter('stopped')} 
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter === 'stopped' ? 'bg-rose-500/20 text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
              >
                Stopped ({groups.filter(g => g.status === 'stopped').length})
              </button>
            </div>


        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No groups found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Group ID</th>
                <th className="px-4 py-3">Clan ID</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Glory</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGroups.map((g) => (
                <tr key={g.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-medium text-violet-400">{g.username}</span>
                    </td>

                  <td className="px-4 py-4">
                    <code className="text-xs text-gray-400 font-mono">{g.group_id}</code>
                  </td>
                  <td className="px-4 py-4">
                    <code className="text-xs text-amber-400 font-mono">{g.clan_id}</code>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-cyan-400 uppercase font-bold">{g.region}</span>
                  </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        g.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 
                        g.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        g.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-yellow-400 font-mono font-bold">{g.glory_farmed}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(g.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {g.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => approveGroup(g.id)} 
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => rejectGroup(g.id, g.user_id, g.region)} 
                              className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {g.status === 'running' && (
                          <button 
                            onClick={() => stopGroup(g.id)} 
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
                          >
                            Stop
                          </button>
                        )}
                        <button 
                          onClick={() => deleteGroup(g.id)} 
                          className="text-xs text-gray-500 hover:text-rose-400 font-bold uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
