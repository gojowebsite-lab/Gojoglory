'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, set, push, update, query, orderByChild, equalTo } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { Rocket, Globe, Users, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LaunchGroupProps {
  profile: Profile;
  onLaunch: () => void;
}

export function LaunchGroup({ profile, onLaunch }: LaunchGroupProps) {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [clanId, setClanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    async function fetchRegions() {
      const regionsRef = ref(database, 'regions');
      const snapshot = await get(regionsRef);
      const data = snapshot.val();
      if (data) {
        const regionsList = Object.values(data).filter((r: any) => r.enabled);
        setRegions(regionsList);
        if (regionsList.length > 0) setSelectedRegion(regionsList[0].accounts_file);
      }
    }
    fetchRegions();
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: 'Launching...', type: 'info' });

    try {
      const region = regions.find(r => r.accounts_file === selectedRegion);
      const creditType = region?.tier === 'premium' ? 'premium_credits' : 'basic_credits';

      if (profile[creditType as keyof Profile] < 1) {
        setMsg({ text: `Insufficient ${region?.tier} credits`, type: 'error' });
        setLoading(false);
        return;
      }

      // Check max groups
      const groupsRef = ref(database, 'groups');
      const groupsQuery = query(groupsRef, orderByChild('user_id'), equalTo(profile.id));
      const snapshot = await get(groupsQuery);
      const groupsData = snapshot.val();
      const activeCount = groupsData ? Object.values(groupsData).filter((g: any) => g.status === 'running').length : 0;

      if (activeCount >= profile.max_groups) {
        setMsg({ text: `Maximum active groups reached (${profile.max_groups})`, type: 'error' });
        setLoading(false);
        return;
      }

      const groupId = `GRP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Deduct credit
      const profileRef = ref(database, `profiles/${profile.id}`);
      await update(profileRef, {
        [creditType]: profile[creditType as keyof Profile] - 1,
        updated_at: new Date().toISOString()
      });

      // Create group
      const newGroupRef = push(ref(database, 'groups'));
      await set(newGroupRef, {
        group_id: groupId,
        user_id: profile.id,
        clan_id: clanId,
        region: region?.region_name,
        status: 'pending',
        created_at: new Date().toISOString(),
        glory_farmed: 0
      });

      // Log history
      const historyRef = ref(database, `history/${profile.id}`);
      await push(historyRef, {
        username: profile.username,
        action: 'request',
        group_id: groupId,
        clan_id: clanId,
        details: `Requested launch in ${region?.region_name} (Pending Approval)`,
        timestamp: new Date().toISOString()
      });

      setMsg({ text: 'Launch request sent! Waiting for admin approval.', type: 'success' });
      setClanId('');
      onLaunch();
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to launch group', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedRegionData = regions.find(r => r.accounts_file === selectedRegion);

  return (
    <div className="ng-card p-5 md:p-8 relative group overflow-visible border border-emerald-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
      
      <h2 className="ng-section-title mb-8 relative z-10">
        <div className="ng-section-icon bg-emerald-500/20 border border-emerald-500/30">
          <Rocket className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-emerald-400 font-black uppercase tracking-widest text-lg">Launch New Group</span>
      </h2>

      <form onSubmit={handleLaunch} className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="ng-form-group">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2.5 block ml-1">
              Accounts Region
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <Globe size={18} />
              </span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="ng-input !pl-12 pr-10 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em_1.2em] py-3.5 font-bold tracking-wide"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                  required
                >
                  {regions.map(r => (
                    <option key={r.accounts_file} value={r.accounts_file} className="bg-[#0b0e14] py-2">
                      {r.accounts_file.toUpperCase()} {r.region_name} {r.tier === 'premium' ? '★ PREMIUM' : '● BASIC'}
                    </option>
                  ))}
                </select>

            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ml-1">
              <span className="text-gray-500">Launch Cost:</span>
              <span className={`px-2 py-0.5 rounded-full ${selectedRegionData?.tier === 'premium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                1 {selectedRegionData?.tier} credit
              </span>
            </div>
          </div>

          <div className="ng-form-group">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2.5 block ml-1">
              Clan ID
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <Users size={18} />
              </span>
                <input
                  type="text"
                  value={clanId}
                  onChange={(e) => setClanId(e.target.value)}
                  placeholder="Enter Clan ID"
                  className="ng-input !pl-12 py-3.5 focus:border-emerald-500"
                  required
                />
            </div>
            <p className="text-[9px] text-gray-600 mt-2 ml-1 font-medium tracking-wide">Enter the numeric ID of the clan you want to farm.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale hover:scale-[1.01] active:scale-[0.99] group/btn shadow-inner"
        >
          <Zap className={`w-5 h-5 transition-transform group-hover/btn:scale-125 ${loading ? 'animate-pulse' : ''}`} />
          <span className="uppercase tracking-[0.15em]">{loading ? 'Processing Launch...' : 'Initialize Group Launch'}</span>
        </button>
      </form>

      {msg.text && (
        <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 animate-slideDown ${
          msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
          msg.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <p className="text-xs font-bold uppercase tracking-wider">{msg.text}</p>
        </div>
      )}
    </div>
  );
}
