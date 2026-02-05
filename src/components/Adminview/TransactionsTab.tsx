'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, get } from 'firebase/database';

interface Transaction {
  id: string;
  user_id: string;
  basic_credits: number;
  premium_credits: number;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  order_id?: string;
  admin_note: string | null;
  created_at: string;
  username?: string;
}

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchTransactions = async () => {
    // onValue will handle this, but for manual refresh:
    setLoading(true);
    const snap = await get(ref(database, 'transactions'));
    // data is already updated via onValue listener
    setLoading(false);
  };

  useEffect(() => {
    const transactionsRef = ref(database, 'transactions');
    const profilesRef = ref(database, 'profiles');

    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const txList: Transaction[] = [];
        Object.entries(data).forEach(([uid, userTx]: [string, any]) => {
          Object.entries(userTx).forEach(([id, val]: [string, any]) => {
            txList.push({ ...val, id, user_id: uid });
          });
        });
        setTransactions(txList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        setTransactions([]);
      }
      setLoading(false);
    });

    const unsubProfiles = onValue(profilesRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfiles(snapshot.val());
      }
    });

    return () => {
      unsubTransactions();
      unsubProfiles();
    };
  }, []);

  const approveTransaction = async (tx: Transaction) => {
    if (!confirm(`Approve ₹${tx.amount} and add credits to ${profiles[tx.user_id]?.username}?`)) return;
    
    // Update transaction status
    await update(ref(database, `transactions/${tx.user_id}/${tx.id}`), { status: 'approved' });

    // Add credits to user profile
    const profileRef = ref(database, `profiles/${tx.user_id}`);
    const snap = await get(profileRef);
    const profile = snap.val();

    if (profile) {
      await update(profileRef, {
        basic_credits: (profile.basic_credits || 0) + tx.basic_credits,
        premium_credits: (profile.premium_credits || 0) + tx.premium_credits,
        updated_at: new Date().toISOString()
      });
    }
  };

  const rejectTransaction = async (tx: Transaction) => {
    if (!confirm(`Reject transaction ${tx.transaction_id || tx.order_id}?`)) return;
    await update(ref(database, `transactions/${tx.user_id}/${tx.id}`), { status: 'rejected' });
  };

  const filteredTransactions = transactions.map(tx => ({
    ...tx,
    username: profiles[tx.user_id]?.username || 'Unknown'
  })).filter(tx => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const approvedCount = transactions.filter(tx => tx.status === 'approved').length;
  const rejectedCount = transactions.filter(tx => tx.status === 'rejected').length;

  return (
    <div className="ng-card p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-cyan-500/20 border border-cyan-500/30">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          Transaction Management
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setFilter('pending')} 
              className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all ${filter === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              Pending ({pendingCount})
            </button>
            <button 
              onClick={() => setFilter('approved')} 
              className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all ${filter === 'approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              Approved ({approvedCount})
            </button>
            <button 
              onClick={() => setFilter('rejected')} 
              className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all ${filter === 'rejected' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-500 hover:text-white'}`}
            >
              Rejected ({rejectedCount})
            </button>
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              All
            </button>
          </div>
          <button onClick={fetchTransactions} className="ng-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-widest">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white/2 rounded-2xl border border-white/5">No transactions found in this category</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Transaction ID</th>
                <th className="px-4 py-4">Credits (B/P)</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-5">
                      <span className="font-bold text-white block">{tx.username}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{tx.user_id}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-amber-400 font-mono bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                          {tx.transaction_id || tx.order_id}
                        </code>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex gap-2 font-mono text-xs">
                        <span className="text-blue-400 font-bold bg-blue-400/10 px-1.5 py-0.5 rounded">B: {tx.basic_credits}</span>
                        <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">P: {tx.premium_credits}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-emerald-400 font-mono font-black text-base">₹{tx.amount}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                        tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        tx.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-[10px] text-gray-500 leading-tight">
                      {new Date(tx.created_at).toLocaleDateString()}<br/>
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-5 text-right">
                      {tx.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => approveTransaction(tx)} 
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:text-white transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => rejectTransaction(tx)} 
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
