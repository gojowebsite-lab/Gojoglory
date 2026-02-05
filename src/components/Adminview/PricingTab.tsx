'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

interface Pricing {
  basic_credit_inr: number;
  premium_credit_inr: number;
  upi_id: string;
  updated_at: string;
}

export function PricingTab() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    basic_credit_inr: '',
    premium_credit_inr: '',
    upi_id: '',
  });

  const fetchPricing = async () => {
    setLoading(true);
    const pricingRef = ref(database, 'pricing');
    const snapshot = await get(pricingRef);
    const data = snapshot.val();
    if (data) {
      setPricing(data);
      setFormData({
        basic_credit_inr: (data.basic_credit_inr || data.basic_credit_usd || 0).toString(),
        premium_credit_inr: (data.premium_credit_inr || data.premium_credit_usd || 0).toString(),
        upi_id: data.upi_id || data.binance_pay_id || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      basic_credit_inr: parseFloat(formData.basic_credit_inr) || 0,
      premium_credit_inr: parseFloat(formData.premium_credit_inr) || 0,
      upi_id: formData.upi_id,
      updated_at: new Date().toISOString(),
    };

    await set(ref(database, 'pricing'), updates);

    fetchPricing();
    setSaving(false);
  };

  return (
    <div className="ng-card p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="ng-section-title">
          <div className="ng-section-icon bg-emerald-500/20 border border-emerald-500/30">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          Credit & Payment Settings (INR)
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Basic Credit Price (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    value={formData.basic_credit_inr}
                    onChange={(e) => setFormData({ ...formData, basic_credit_inr: e.target.value })}
                    className="ng-input py-3 !pl-8 pr-4 w-full text-lg font-mono"
                    placeholder="0"
                  />
              </div>
              <p className="text-xs text-gray-500">Price per basic credit in INR</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Premium Credit Price (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1"
                    value={formData.premium_credit_inr}
                    onChange={(e) => setFormData({ ...formData, premium_credit_inr: e.target.value })}
                    className="ng-input py-3 !pl-8 pr-4 w-full text-lg font-mono"
                    placeholder="0"
                  />
              </div>
              <p className="text-xs text-gray-500">Price per premium credit in INR</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">UPI ID</label>
            <input
              type="text"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              className="ng-input py-3 px-4 w-full font-mono"
              placeholder="example@upi"
            />
            <p className="text-xs text-gray-500">Users will send UPI payments to this ID. A QR code will be generated automatically.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            {pricing && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(pricing.updated_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ng-btn bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-8 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
