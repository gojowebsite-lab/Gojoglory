'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { Inbox, Mail, Trash2, CheckCircle, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface InboxSectionProps {
  profile: Profile;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}

export function InboxSection({ profile, isOpen, onToggle, onUpdate }: InboxSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile.id) return;
    
    const messagesRef = ref(database, `inbox_messages/${profile.id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ ...val, id }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMessages(messagesList);
        setUnreadCount(messagesList.filter(m => !m.is_read).length);
      } else {
        setMessages([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [profile.id]);

  const markRead = async (id: string) => {
    await update(ref(database, `inbox_messages/${profile.id}/${id}`), { is_read: true });
    onUpdate();
  };

  const dismiss = async (id: string) => {
    await remove(ref(database, `inbox_messages/${profile.id}/${id}`));
    onUpdate();
  };

  if (messages.length === 0) return null;

  return (
    <div className="ng-card relative overflow-visible">
      <div onClick={onToggle} className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-blue-500/20 border border-blue-500/30">
            <Inbox className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-blue-400 font-bold">Inbox</span>
          {unreadCount > 0 && <span className="ng-badge-danger text-[10px] ml-2 px-2 py-0.5">{unreadCount} new</span>}
        </h2>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>

      <div className={`px-4 md:px-6 pb-4 md:pb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3 pt-4">
          {messages.map((m) => (
            <div key={m.id} className={`p-4 rounded-xl border transition-all ${m.is_read ? 'bg-white/2 border-white/5 opacity-60' : 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_-5px_rgba(59,130,246,0.1)]'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Mail size={14} className={m.is_read ? 'text-gray-500' : 'text-blue-400'} />
                    {m.title}
                    {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">{m.content}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
                    <div className="flex gap-4">
                      {!m.is_read && (
                        <button onClick={() => markRead(m.id)} className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider transition-colors">
                          <CheckCircle size={12} />
                          Mark Read
                        </button>
                      )}
                      <button onClick={() => dismiss(m.id)} className="flex items-center gap-1.5 text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider transition-colors">
                        <Trash2 size={12} />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
