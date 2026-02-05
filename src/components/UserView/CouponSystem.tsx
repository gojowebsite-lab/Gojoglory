'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, set, update, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { Ticket, Gift, Sparkles, ChevronDown, History } from 'lucide-react';

interface Coupon {
  code: string;
  basic_credits: number;
  premium_credits: number;
  status: string;
  created_at: string;
  used_by: string;
  used_at: string;
  created_by: string;
}

interface CouponSystemProps {
  profile: Profile;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger: number;
  onUpdate: () => void;
}

export function CouponSystem({ profile, isOpen, onToggle, refreshTrigger, onUpdate }: CouponSystemProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [basicGift, setBasicGift] = useState(0);
  const [premiumGift, setPremiumGift] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile.username) return;
    
    const couponsRef = ref(database, 'coupons');
    const couponsQuery = query(couponsRef, orderByChild('created_by'), equalTo(profile.username));

    const unsubscribe = onValue(couponsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const couponsList = Object.values(data) as Coupon[];
        setCoupons(couponsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        setCoupons([]);
      }
    });

    return () => unsubscribe();
  }, [profile.username, refreshTrigger]);

  const handleCreateCoupon = async () => {
    if (basicGift === 0 && premiumGift === 0) return;
    if (basicGift > profile.basic_credits || premiumGift > profile.premium_credits) {
      alert('Insufficient credits');
      return;
    }

    setLoading(true);
    try {
      const code = `CPN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Deduct credits from profile
      const profileRef = ref(database, `profiles/${profile.id}`);
      await update(profileRef, {
        basic_credits: profile.basic_credits - basicGift,
        premium_credits: profile.premium_credits - premiumGift,
        updated_at: new Date().toISOString()
      });

      // Create coupon
      await set(ref(database, `coupons/${code}`), {
        code,
        basic_credits: basicGift,
        premium_credits: premiumGift,
        created_by: profile.username,
        status: 'active',
        created_at: new Date().toISOString()
      });

      alert(`Coupon created: ${code}`);
      setBasicGift(0);
      setPremiumGift(0);
      onUpdate();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!redeemCode) return;
    const code = redeemCode.toUpperCase();
    setLoading(true);
    try {
      // Fetch coupon
      const couponRef = ref(database, `coupons/${code}`);
      const snapshot = await get(couponRef);
      const coupon = snapshot.val() as Coupon;

      if (!coupon || coupon.status !== 'active') throw new Error('Invalid or expired coupon');
      if (coupon.created_by === profile.username) throw new Error('Cannot redeem your own coupon');

      // Update coupon status
      await update(couponRef, {
        status: 'redeemed',
        used_by: profile.username,
        used_at: new Date().toISOString()
      });

      // Add credits to profile
      const profileRef = ref(database, `profiles/${profile.id}`);
      await update(profileRef, {
        basic_credits: profile.basic_credits + coupon.basic_credits,
        premium_credits: profile.premium_credits + coupon.premium_credits,
        updated_at: new Date().toISOString()
      });

      alert(`Redeemed ${coupon.basic_credits} basic and ${coupon.premium_credits} premium credits!`);
      setRedeemCode('');
      onUpdate();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ng-card relative overflow-visible">
      <div onClick={onToggle} className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-teal-500/20 border border-teal-500/30 text-teal-400">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-teal-400 font-bold">Gift Coupons</span>
          <span className="ng-badge text-xs ml-2 border-teal-500/30 text-teal-400">{coupons.length}</span>
        </h2>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>

      <div className={`px-4 md:px-6 pb-4 md:pb-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          {/* Redeem */}
          <div className="ng-card p-4 border border-teal-500/30">
            <h4 className="font-semibold text-teal-400 mb-3 flex items-center gap-2">
              <Gift size={16} />
              Redeem a Coupon
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono"
              />
              <button onClick={handleRedeemCoupon} disabled={loading} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-bold disabled:opacity-50">Redeem</button>
            </div>
          </div>

          {/* Create */}
          <div className="ng-card p-4 border border-cyan-500/30">
            <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Create a Coupon
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-blue-400 uppercase font-bold">🔵 Basic</label>
                <input type="number" value={basicGift} onChange={(e) => setBasicGift(parseInt(e.target.value) || 0)} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-amber-400 uppercase font-bold">⭐ Premium</label>
                <input type="number" value={premiumGift} onChange={(e) => setPremiumGift(parseInt(e.target.value) || 0)} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" />
              </div>
            </div>
            <button onClick={handleCreateCoupon} disabled={loading} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-bold disabled:opacity-50">Generate Coupon</button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <h4 className="font-semibold text-gray-400 mb-3 text-sm flex items-center gap-2">
            <History size={14} className="text-gray-500" />
            My Generated Coupons
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {coupons.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <Ticket className="w-10 h-10 text-gray-700" />
                <p className="text-gray-600 text-xs italic">No coupons created</p>
              </div>
            ) : (
              coupons.map((c) => (
                <div key={c.code} className="bg-white/5 p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <div>
                    <code className="text-sm text-white font-mono font-bold">{c.code}</code>
                    <p className="text-[10px] text-gray-500">
                      {c.basic_credits}B + {c.premium_credits}P • {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'}`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
