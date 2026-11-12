import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FiSettings, FiSave, FiCheckCircle } from 'react-icons/fi';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    minimumStockThreshold: 5,
    weightToleranceGrams: 50,
    currency: 'INR (₹)',
    defaultGstPercentage: 18,
    companyName: 'Smart MSME Mart',
    companyAddress: '123 SaaS Tower, Tech Park, India',
    companyPhone: '+91 98765 43210',
    companyEmail: 'support@smartmsme.com',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.data) setSettings(res.data.data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System & Hardware Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure ESP32 Weight Tolerance, Stock Reorder Thresholds, Currency & Business Info
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center space-x-2 font-bold border border-emerald-300">
          <FiCheckCircle className="w-4 h-4" />
          <span>System Settings Saved Successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl space-y-6 shadow-xl border">
        {/* Hardware Settings */}
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 pb-2 border-b">
            Hardware & Stock Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                Minimum Low-Stock Reorder Threshold
              </label>
              <input
                type="number"
                value={settings.minimumStockThreshold}
                onChange={(e) => setSettings({ ...settings, minimumStockThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                Load Cell Weight Discrepancy Tolerance (grams)
              </label>
              <input
                type="number"
                value={settings.weightToleranceGrams}
                onChange={(e) => setSettings({ ...settings, weightToleranceGrams: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Company Settings */}
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 pb-2 border-b">
            Company & POS Receipt Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Company Phone</label>
              <input
                type="text"
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all"
        >
          <FiSave className="w-4 h-4" />
          <span>Save Admin Settings</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
