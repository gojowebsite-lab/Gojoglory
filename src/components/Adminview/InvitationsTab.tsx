'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';

export function InvitationsTab() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(1);

  useEffect(() => {
    const invitationsRef = ref(database, 'invitations');
    const unsubscribe = onValue(invitationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const invitesList = Object.values(data).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setInvitations(invitesList);
      } else {
        setInvitations([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateCodes = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < count; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        await set(ref(database, `invitations/${code}`), {
          code,
          created_by: 'admin',
          is_used: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="ng-card p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-amber-500/20 border border-amber-500/30">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>
          Invitations
        </h2>
          <div className="flex gap-2">
            <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} min="1" max="50" className="ng-input py-2 px-4 w-20" />
            <button onClick={generateCodes} disabled={loading} className="ng-btn bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4">Generate</button>
          </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Used By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invitations.map((inv) => (
              <tr key={inv.code} className={`hover:bg-white/2 transition-colors ${inv.is_used ? 'opacity-50' : ''}`}>
                <td className="px-4 py-4"><code className="text-amber-400 font-mono font-bold tracking-widest">{inv.code}</code></td>
                <td className="px-4 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${inv.is_used ? 'bg-white/5 text-gray-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {inv.is_used ? 'Used' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500">{new Date(inv.created_at).toLocaleString()}</td>
                <td className="px-4 py-4 text-xs text-violet-400 font-medium">{inv.used_by || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
