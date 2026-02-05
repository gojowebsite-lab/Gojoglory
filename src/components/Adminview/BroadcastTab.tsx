'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  target_all: boolean;
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export function BroadcastTab() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 1,
  });

  useEffect(() => {
    const broadcastsRef = ref(database, 'broadcasts');
    const unsubscribe = onValue(broadcastsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const broadcastsList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setBroadcasts(broadcastsList);
      } else {
        setBroadcasts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendBroadcast = async () => {
    setSending(true);
    try {
      const broadcastsRef = ref(database, 'broadcasts');
      const newBroadcastRef = push(broadcastsRef);
      await set(newBroadcastRef, {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        target_all: true,
        created_by: 'admin',
        created_at: new Date().toISOString()
      });

      setFormData({ title: '', content: '', type: 'info', priority: 1 });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const deleteBroadcast = async (id: string) => {
    await remove(ref(database, `broadcasts/${id}`));
  };

  const typeStyles: Record<string, string> = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="ng-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="ng-section-title">
            <div className="ng-section-icon bg-pink-500/20 border border-pink-500/30">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
            </div>
            Broadcast System
          </h2>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="ng-btn bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-4"
            >
              {showForm ? 'Cancel' : 'New Broadcast'}
            </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="ng-input py-2 px-4 w-full"
                  placeholder="Broadcast title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="ng-input py-2 px-4 w-full"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="ng-input py-2 px-4 w-full"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="ng-input py-2 px-4 w-full h-24 resize-none"
                placeholder="Enter your message..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={sendBroadcast}
                disabled={sending || !formData.title || !formData.content}
                className="ng-btn bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-6 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No broadcasts sent yet</div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div 
                key={b.id} 
                className={`p-4 rounded-xl border ${typeStyles[b.type] || typeStyles.info}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{b.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${typeStyles[b.type]}`}>
                        {b.type}
                      </span>
                      {b.priority >= 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-rose-500/20 text-rose-400">
                          HIGH
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{b.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => deleteBroadcast(b.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
