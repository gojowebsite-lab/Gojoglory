'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, remove } from 'firebase/database';

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const profilesRef = ref(database, 'profiles');
    const unsubscribe = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const adjustCredits = async (userId: string, type: 'basic_credits' | 'premium_credits', delta: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newValue = Math.max(0, user[type] + delta);
    await update(ref(database, `profiles/${userId}`), { [type]: newValue });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await remove(ref(database, `profiles/${userId}`));
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="ng-card p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-violet-500/20 border border-violet-500/30">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          User Management
        </h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..." 
              className="ng-input py-2 px-4 w-full sm:w-64" 
            />
          </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Basic Credits</th>
              <th className="px-4 py-3">Premium Credits</th>
              <th className="px-4 py-3">Max Groups</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center font-bold text-xs">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-white">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustCredits(u.id, 'basic_credits', -1)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10">-</button>
                    <span className="w-8 text-center text-blue-400 font-mono font-bold">{u.basic_credits}</span>
                    <button onClick={() => adjustCredits(u.id, 'basic_credits', 1)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10">+</button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustCredits(u.id, 'premium_credits', -1)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10">-</button>
                    <span className="w-8 text-center text-amber-400 font-mono font-bold">{u.premium_credits}</span>
                    <button onClick={() => adjustCredits(u.id, 'premium_credits', 1)} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10">+</button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-white font-mono">{u.max_groups}</span>
                </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider">Delete</button>
                  </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
