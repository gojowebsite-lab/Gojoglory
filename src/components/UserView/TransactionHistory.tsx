'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { History, Receipt, ChevronDown } from 'lucide-react';

interface Transaction {
  id: string;
  basic_credits: number;
  premium_credits: number;
  amount: number;
  status: string;
  transaction_id?: string;
  order_id?: string;
  created_at: string;
}

interface TransactionHistoryProps {
  profile: Profile;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger: number;
}

export function TransactionHistory({ profile, isOpen, onToggle, refreshTrigger }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile.id) return;
    setLoading(true);
    
    const transactionsRef = ref(database, `transactions/${profile.id}`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const txList = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ ...val, id }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(txList);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.id, refreshTrigger]);

  return (
    <div className="ng-card relative overflow-visible border border-violet-500/10">
      <div onClick={onToggle} className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-violet-500/20 border border-violet-500/30">
            <History className="w-5 h-5 text-violet-400" />
          </div>
          <span className="text-violet-400 font-black uppercase tracking-widest text-lg">Transaction History</span>
          <span className="bg-violet-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-3 border border-violet-400/30 shadow-lg shadow-violet-500/20">{transactions.length}</span>
        </h2>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>

      <div className={`px-4 md:px-6 pb-4 md:pb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3 pt-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white/2 rounded-3xl border border-white/5">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-50" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No transaction data found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-black/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center border border-violet-500/20 shadow-inner">
                      <Receipt className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction ID:</span>
                        <code className="text-xs text-amber-400 font-mono font-bold">{tx.transaction_id || tx.order_id || tx.id.substring(0, 12)}</code>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-emerald-400 font-mono">₹{tx.amount}</span>
                        <div className="flex gap-2 text-[10px] font-bold">
                          <span className="text-blue-400 uppercase">🔵 {tx.basic_credits} Basic</span>
                          <span className="text-amber-400 uppercase">⭐ {tx.premium_credits} Premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-[0.15em] border ${
                      tx.status === 'approved' || tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      tx.status === 'rejected' || tx.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {tx.status}
                    </span>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
