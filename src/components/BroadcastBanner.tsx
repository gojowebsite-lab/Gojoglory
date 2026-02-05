import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  created_at: string;
}

export function BroadcastBanner() {
  const [activeBroadcasts, setActiveBroadcasts] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const broadcastsRef = ref(database, 'broadcasts');
    const unsubscribe = onValue(broadcastsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date().getTime();
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ ...val, id }))
          // Only show broadcasts from the last 24 hours if no expiry set
          .filter(b => {
            const age = now - new Date(b.created_at).getTime();
            return age < 24 * 60 * 60 * 1000;
          })
          .sort((a, b) => b.priority - a.priority || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActiveBroadcasts(list);
      } else {
        setActiveBroadcasts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const dismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const visibleBroadcasts = activeBroadcasts.filter(b => !dismissed.includes(b.id));

  if (visibleBroadcasts.length === 0) return null;

  const styles: Record<string, any> = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    error: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  };

  return (
    <div className="space-y-2 mb-6 animate-slideDown">
      {visibleBroadcasts.map((b) => {
        const config = styles[b.type] || styles.info;
        const Icon = config.icon;
        
        return (
          <div 
            key={b.id} 
            className={`relative overflow-hidden p-4 rounded-2xl border ${config.bg} ${config.border} backdrop-blur-md group transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 p-2 rounded-xl ${config.bg} border ${config.border}`}>
                <Icon size={18} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">{b.title}</h3>
                  {b.priority >= 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-500 text-white animate-pulse">URGENT</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{b.content}</p>
                <p className="text-[9px] text-gray-500 mt-2 font-medium">{new Date(b.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => dismiss(b.id)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Animated background line */}
            <div className={`absolute bottom-0 left-0 h-0.5 ${config.color.replace('text', 'bg')} opacity-30 animate-progress`} style={{ width: '100%' }}></div>
          </div>
        );
      })}
    </div>
  );
}
