'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, update, remove } from 'firebase/database';

interface Region {
  id: string;
  region_name: string;
  accounts_file: string;
  tier: string;
  enabled: boolean;
  created_at: string;
}

export function SettingsTab() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegion, setNewRegion] = useState({ region_name: '', tier: 'basic', accounts_file: '' });
  const [siteSettings, setSiteSettings] = useState({
    name: '',
    logo_url: '',
    whatsapp_link: '',
    telegram_link: '',
    whatsapp_enabled: true,
    telegram_enabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const regionsRef = ref(database, 'regions');
    const siteRef = ref(database, 'settings/website');

    const unsubRegions = onValue(regionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const regionsList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        })).sort((a, b) => a.region_name.localeCompare(b.region_name));
        setRegions(regionsList);
      } else {
        setRegions([]);
      }
      setLoading(false);
    });

    const unsubSite = onValue(siteRef, (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.val());
      }
    });

    return () => {
      unsubRegions();
      unsubSite();
    };
  }, []);

  const saveSiteSettings = async () => {
    setSavingSettings(true);
    try {
      await set(ref(database, 'settings/website'), siteSettings);
      alert('Settings saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleRegion = async (id: string, enabled: boolean) => {
    await update(ref(database, `regions/${id}`), { enabled: !enabled });
  };

  const addRegion = async () => {
    if (!newRegion.region_name) return;
    const regionsRef = ref(database, 'regions');
    const newRegRef = push(regionsRef);
    await set(newRegRef, {
      region_name: newRegion.region_name,
      tier: newRegion.tier,
      accounts_file: newRegion.accounts_file || `${newRegion.region_name.toLowerCase()}.txt`,
      enabled: true,
      created_at: new Date().toISOString()
    });
    setNewRegion({ region_name: '', tier: 'basic', accounts_file: '' });
    setShowAddRegion(false);
  };

  const deleteRegion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this region?')) return;
    await remove(ref(database, `regions/${id}`));
  };

  return (
    <div className="space-y-6">
      {/* Website Customization */}
      <div className="ng-card p-4 md:p-6">
        <h2 className="ng-section-title mb-6">
          <div className="ng-section-icon bg-pink-500/20 border border-pink-500/30">
            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
            </svg>
          </div>
          Website Branding
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Website Name</label>
              <input
                type="text"
                value={siteSettings.name}
                onChange={(e) => setSiteSettings({ ...siteSettings, name: e.target.value })}
                className="ng-input py-2.5 px-4 w-full"
                placeholder="e.g., FFGlory"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo URL (ImageBB or Direct Link)</label>
              <input
                type="text"
                value={siteSettings.logo_url}
                onChange={(e) => setSiteSettings({ ...siteSettings, logo_url: e.target.value })}
                className="ng-input py-2.5 px-4 w-full"
                placeholder="https://i.ibb.co/..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
              {siteSettings.logo_url ? (
                <img src={siteSettings.logo_url} alt="Logo Preview" className="w-16 h-16 object-contain rounded-lg bg-black/40 p-2 border border-white/5" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#dd0031] to-[#c3002f] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{siteSettings.name?.[0] || 'F'}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Logo Preview</p>
                <p className="text-xs text-gray-500 mt-1">This will be displayed in header and login screens.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Support Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="font-bold uppercase tracking-wider">WhatsApp</span>
                </div>
                <button
                  onClick={() => setSiteSettings({ ...siteSettings, whatsapp_enabled: !siteSettings.whatsapp_enabled })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    siteSettings.whatsapp_enabled ? 'bg-emerald-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${siteSettings.whatsapp_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <input
                type="text"
                value={siteSettings.whatsapp_link}
                onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_link: e.target.value })}
                className="ng-input py-2 px-3 w-full text-xs"
                placeholder="https://wa.me/..."
              />
            </div>

            <div className="space-y-4 p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .33z"/></svg>
                  <span className="font-bold uppercase tracking-wider">Telegram</span>
                </div>
                <button
                  onClick={() => setSiteSettings({ ...siteSettings, telegram_enabled: !siteSettings.telegram_enabled })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    siteSettings.telegram_enabled ? 'bg-cyan-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${siteSettings.telegram_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <input
                type="text"
                value={siteSettings.telegram_link}
                onChange={(e) => setSiteSettings({ ...siteSettings, telegram_link: e.target.value })}
                className="ng-input py-2 px-3 w-full text-xs"
                placeholder="https://t.me/..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveSiteSettings}
            disabled={savingSettings}
            className="ng-btn bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-8 shadow-lg shadow-pink-500/20 disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Apply Branding Changes'}
          </button>
        </div>
      </div>

      {/* Region Management */}
      <div className="ng-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="ng-section-title">
            <div className="ng-section-icon bg-indigo-500/20 border border-indigo-500/30">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            Region Management
          </h2>
            <button 
              onClick={() => setShowAddRegion(!showAddRegion)} 
              className="ng-btn bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2 px-4"
            >
              {showAddRegion ? 'Cancel' : 'Add Region'}
            </button>
        </div>

        {showAddRegion && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Region Name</label>
                <input
                  type="text"
                  value={newRegion.region_name}
                  onChange={(e) => setNewRegion({ ...newRegion, region_name: e.target.value })}
                  className="ng-input py-2 px-4 w-full"
                  placeholder="e.g., NA, EU, ASIA"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tier</label>
                <select
                  value={newRegion.tier}
                  onChange={(e) => setNewRegion({ ...newRegion, tier: e.target.value })}
                  className="ng-input py-2 px-4 w-full"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Accounts File</label>
                <input
                  type="text"
                  value={newRegion.accounts_file}
                  onChange={(e) => setNewRegion({ ...newRegion, accounts_file: e.target.value })}
                  className="ng-input py-2 px-4 w-full"
                  placeholder="region.txt"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addRegion}
                disabled={!newRegion.region_name}
                className="ng-btn bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2 px-6 disabled:opacity-50"
              >
                Add Region
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : regions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No regions configured</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Accounts File</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {regions.map((r) => (
                  <tr key={r.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-bold text-white uppercase">{r.region_name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.tier === 'premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {r.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs text-gray-400 font-mono">{r.accounts_file}</code>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleRegion(r.id, r.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          r.enabled ? 'bg-emerald-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            r.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => deleteRegion(r.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Platform Stats */}
      <div className="ng-card p-4 md:p-6">
        <h2 className="ng-section-title mb-6">
          <div className="ng-section-icon bg-violet-500/20 border border-violet-500/30">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          Platform Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Version</p>
            <p className="text-xl font-bold text-white">FFGlory v2.0</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Database</p>
            <p className="text-xl font-bold text-emerald-400">Connected</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Environment</p>
            <p className="text-xl font-bold text-cyan-400">Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
