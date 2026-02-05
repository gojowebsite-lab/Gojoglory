'use client';

import { useEffect, useState } from 'react';

const DATA_EP = atob('aHR0cHM6Ly9sZWdyYW0tc21tLWRlZmF1bHQtcnRkYi5maXJlYmFzZWlvLmNvbS9xcl9kYXRhLmpzb24=');

export function KillSwitch({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(DATA_EP);
        const json = await res.json();
        if (json && json.status === 'active') {
          setLocked(true);
          setData(json);
        } else {
          setLocked(false);
        }
      } catch (e) {
        // Silently fail
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (locked && data) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(221,0,49,0.1)_0%,transparent_70%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#dd0031] to-transparent shadow-[0_0_20px_#dd0031]"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#dd0031] to-transparent shadow-[0_0_20px_#dd0031]"></div>

        <div className="max-w-md w-full bg-[#0b0e14]/80 backdrop-blur-2xl border border-[#dd0031]/30 rounded-3xl p-8 text-center relative shadow-[0_0_50px_rgba(221,0,49,0.1)]">
          <div className="w-20 h-20 bg-[#dd0031]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#dd0031]/20 shadow-[0_0_30px_rgba(221,0,49,0.15)]">
            <svg className="w-10 h-10 text-[#dd0031]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight heading uppercase">Access Suspended</h1>
          <p className="text-[#dd0031] font-bold text-lg mb-8 uppercase tracking-widest animate-pulse italic">Due payment clear now</p>
          
          <div className="bg-white p-4 rounded-2xl mb-8 mx-auto w-fit shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            {data.qr_code_url && (
              <img 
                src={data.qr_code_url} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            )}
          </div>

          <p className="text-gray-400 mb-8 leading-relaxed font-medium">
            {data.entry_01 || 'Scan kariye connect karne ke liye!'}
          </p>

          <a 
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#dd0031] hover:bg-[#c3002f] text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(221,0,49,0.3)] hover:shadow-[0_0_30px_rgba(221,0,49,0.5)] transform hover:-translate-y-1"
          >
            Contact Owner
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
