'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, push, set } from 'firebase/database';
import { Profile } from '@/hooks/useUser';
import { ShoppingCart, Plus, Minus, CreditCard, ExternalLink, Copy } from 'lucide-react';

interface Pricing {
  basic_credit_inr: number;
  premium_credit_inr: number;
  upi_id: string;
}

interface BuyCreditsProps {
  profile: Profile;
  isOpen: boolean;
  onToggle: () => void;
  onSuccess: () => void;
}

export function BuyCredits({ profile, isOpen, onToggle, onSuccess }: BuyCreditsProps) {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [basicAmount, setBasicAmount] = useState(0);
  const [premiumAmount, setPremiumAmount] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const pricingRef = ref(database, 'pricing');
      const pricingSnap = await get(pricingRef);
      const pData = pricingSnap.val();

      if (pData) {
        setPricing({
          basic_credit_inr: pData.basic_credit_inr || pData.basic_credit_usd || 90,
          premium_credit_inr: pData.premium_credit_inr || pData.premium_credit_usd || 1500,
          upi_id: pData.upi_id || pData.binance_pay_id || ''
        });
      }
    }
    fetchData();
  }, []);

  const totalAmount = (basicAmount * (pricing?.basic_credit_inr || 90)) + (premiumAmount * (pricing?.premium_credit_inr || 1500));
  const upiLink = pricing?.upi_id ? `upi://pay?pa=${pricing.upi_id}&pn=FFGlory&am=${totalAmount}&cu=INR` : '';
  const qrCodeUrl = totalAmount > 0 && upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}` : '';

  const handlePurchase = async () => {
    if (basicAmount === 0 && premiumAmount === 0) return;
    if (!transactionId) {
      alert('Please enter your UPI Transaction ID');
      return;
    }

    setLoading(true);
    try {
      const transactionsRef = ref(database, `transactions/${profile.id}`);
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, {
        user_id: profile.id,
        username: profile.username,
        basic_credits: basicAmount,
        premium_credits: premiumAmount,
        amount: totalAmount,
        currency: 'INR',
        status: 'pending',
        transaction_id: transactionId,
        created_at: new Date().toISOString()
      });

      alert('Payment request submitted successfully! Admin will verify your transaction shortly.');
      setBasicAmount(0);
      setPremiumAmount(0);
      setTransactionId('');
      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ng-card relative group overflow-visible border border-amber-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
      
      <div onClick={onToggle} className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl relative z-10">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-amber-500/20 border border-amber-500/30">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-amber-400 font-bold">Buy Credits</span>
            <div className="flex gap-2">
              <span className="ng-badge text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                Basic: ₹{pricing?.basic_credit_inr}
              </span>
              <span className="ng-badge text-[10px] px-2 py-0.5 border-amber-500/30 text-amber-400 flex items-center gap-1">
                Premium: ₹{pricing?.premium_credit_inr}
              </span>
            </div>
          </div>
        </h2>
        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      <div className={`px-4 md:px-6 pb-4 md:pb-6 overflow-hidden transition-all duration-300 relative z-10 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Basic Credits */}
          <div className="ng-card p-4 border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl shadow-inner">🔵</div>
              <div>
                <h3 className="font-bold text-blue-400">Basic</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Standard Regions</p>
              </div>
            </div>
            <div className="ng-form-group">
              <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block tracking-wider">Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setBasicAmount(Math.max(0, basicAmount - 1))} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center"><Minus size={16} /></button>
                <input type="number" value={basicAmount} onChange={(e) => setBasicAmount(Math.max(0, parseInt(e.target.value) || 0))} className="ng-input text-center font-bold flex-1 py-2" />
                <button onClick={() => setBasicAmount(basicAmount + 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center"><Plus size={16} /></button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-black/40 rounded-xl text-center border border-white/5">
              <span className="text-[10px] text-gray-500 uppercase font-bold mr-2">Subtotal:</span>
              <span className="font-bold text-blue-400">₹{(basicAmount * (pricing?.basic_credit_inr || 90))}</span>
            </div>
          </div>

          {/* Premium Credits */}
          <div className="ng-card p-4 border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shadow-inner">⭐</div>
              <div>
                <h3 className="font-bold text-amber-400">Premium</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Premium Regions</p>
              </div>
            </div>
            <div className="ng-form-group">
              <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block tracking-wider">Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setPremiumAmount(Math.max(0, premiumAmount - 1))} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center"><Minus size={16} /></button>
                <input type="number" value={premiumAmount} onChange={(e) => setPremiumAmount(Math.max(0, parseInt(e.target.value) || 0))} className="ng-input text-center font-bold flex-1 py-2" />
                <button onClick={() => setPremiumAmount(premiumAmount + 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center"><Plus size={16} /></button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-black/40 rounded-xl text-center border border-white/5">
              <span className="text-[10px] text-gray-500 uppercase font-bold mr-2">Subtotal:</span>
              <span className="font-bold text-amber-400">₹{(premiumAmount * (pricing?.premium_credit_inr || 1500))}</span>
            </div>
          </div>

          {/* Order Summary & UPI Payment */}
          <div className="space-y-4">
            <div className="ng-card p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShoppingCart size={16} />
                Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-blue-400 font-medium">Basic:</span>
                  <span className="font-bold text-white">{basicAmount} × ₹{pricing?.basic_credit_inr}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-amber-400 font-medium">Premium:</span>
                  <span className="font-bold text-white">{premiumAmount} × ₹{pricing?.premium_credit_inr}</span>
                </div>
                <div className="flex justify-between items-center pt-2 px-2">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Amount:</span>
                  <span className="text-2xl font-black text-emerald-400">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {totalAmount > 0 && pricing?.upi_id && (
              <div className="ng-card p-5 bg-black/40 border border-white/10 text-center animate-fadeIn">
                <h4 className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-widest flex items-center justify-center gap-2">
                  <CreditCard size={14} />
                  Scan to Pay (UPI)
                </h4>
                <div className="bg-white p-2 rounded-xl inline-block shadow-lg shadow-white/5">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-32 h-32 md:w-40 md:h-40" />
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">UPI ID</p>
                  <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between border border-white/10 group/copy">
                    <span className="font-mono text-cyan-400 text-xs font-bold truncate mr-2">{pricing.upi_id}</span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(pricing.upi_id);
                    }} className="text-gray-500 hover:text-white transition-colors p-1">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block ml-1">Transaction ID</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500">
                  <ExternalLink size={14} />
                </span>
                  <input 
                    type="text" 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)} 
                    placeholder="Enter UPI Ref / UTR No." 
                    className="ng-input !pl-10 py-3 text-sm" 
                  />
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={loading || (basicAmount === 0 && premiumAmount === 0)}
              className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard size={18} />
              {loading ? 'Processing...' : 'Submit Payment Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
