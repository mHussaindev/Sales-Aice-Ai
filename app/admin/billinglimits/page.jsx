"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Save, Loader, X } from "lucide-react";
import { axiosInstance } from "@/utils/axiosInstance";
import Link from "next/link";

export default function BillingLimitsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Global billing/limits state
  const [limits, setLimits] = useState({
    monthly_price_usd: 0,
    monthly_minutes_limit: 10000,
    max_concurrent_calls: 10,
    overage_price_per_minute_usd: 0.01,
    allow_overage: true,
  });

  // Subscriptions list (mock)
  const [subscriptions, setSubscriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Real API call (uncomment when API ready):
        // const { data: limitsData } = await axiosInstance.get('/api/admin/billing-limits');
        // if (!mounted) return; setLimits(limitsData);

        // Mock limits
        const mockLimits = {
          monthly_price_usd: 99,
          monthly_minutes_limit: 10000,
          max_concurrent_calls: 50,
          overage_price_per_minute_usd: 0.05,
          allow_overage: true,
        };
        if (!mounted) return;
        setLimits(mockLimits);

        // Real API call to fetch subscriptions (uncomment later):
        // const { data: subs } = await axiosInstance.get('/api/admin/subscriptions');
        // setSubscriptions(subs);

        // Mock subscriptions
        const mockSubs = [
          { id: 'sub_1', user: 'alice', email: 'alice@example.com', package: 'Pro', status: 'active', minutes_used: 1200, minutes_limit: 3000, price: 99 },
          { id: 'sub_2', user: 'bob', email: 'bob@example.com', package: 'Enterprise', status: 'trialing', minutes_used: 200, minutes_limit: 10000, price: 299 },
          { id: 'sub_3', user: 'carol', email: 'carol@example.com', package: 'Starter', status: 'past_due', minutes_used: 900, minutes_limit: 1000, price: 29 },
        ];
        setSubscriptions(mockSubs);

      } catch (err) {
        setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const saveLimits = async () => {
    setError(null);
    setMessage(null);
    try {
      setSaving(true);
      // Real API save (uncomment when available):
      // const { data } = await axiosInstance.post('/api/admin/billing-limits', limits);
      // setLimits(data);

      // simulate
      await new Promise(r => setTimeout(r, 500));
      setMessage('Billing & limits saved (mock)');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openManage = (sub) => {
    setSelected({ ...sub });
    setModalOpen(true);
  };

  const closeManage = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const saveSubscription = async (updated) => {
    setModalSaving(true);
    try {
      // Real API (uncomment):
      // await axiosInstance.post(`/api/admin/subscriptions/${updated.id}`, updated);
      await new Promise(r => setTimeout(r, 400));
      setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s));
      setMessage('Subscription updated (mock)');
      setTimeout(() => setMessage(null), 3000);
      closeManage();
    } catch (err) {
      setError(err?.message || 'Failed to save subscription');
    } finally {
      setModalSaving(false);
    }
  };

  const cancelSubscription = async (id) => {
    // Real API: await axiosInstance.post(`/api/admin/subscriptions/${id}/cancel`)
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'canceled' } : s));
    setMessage('Subscription canceled (mock)');
    setTimeout(() => setMessage(null), 3000);
  };

  const renewSubscription = async (id) => {
    // Real API: await axiosInstance.post(`/api/admin/subscriptions/${id}/renew`)
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    setMessage('Subscription renewed (mock)');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Limits</h1>
          <p className="text-sm text-gray-400">Configure global billing settings and manage user subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/packages/new" className="rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 flex items-center gap-2">New Package</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-lg border border-gray-800 bg-[#0E1627] p-4">
          <h3 className="text-lg font-semibold mb-2">Global Billing & Limits</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-300"><Loader className="animate-spin" /> Loading...</div>
          ) : (
            <div className="space-y-3">
              {error && <div className="text-red-400">{error}</div>}
              {message && <div className="text-green-400">{message}</div>}

              <div>
                <label className="text-sm text-gray-300">Monthly base price (USD)</label>
                <input type="number" step="0.01" value={limits.monthly_price_usd} onChange={(e) => setLimits({ ...limits, monthly_price_usd: Number(e.target.value) })} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>

              <div>
                <label className="text-sm text-gray-300">Monthly minutes included</label>
                <input type="number" value={limits.monthly_minutes_limit} onChange={(e) => setLimits({ ...limits, monthly_minutes_limit: Number(e.target.value) })} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>

              <div>
                <label className="text-sm text-gray-300">Max concurrent calls</label>
                <input type="number" value={limits.max_concurrent_calls} onChange={(e) => setLimits({ ...limits, max_concurrent_calls: Number(e.target.value) })} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>

              <div>
                <label className="text-sm text-gray-300">Overage price (per minute, USD)</label>
                <input type="number" step="0.01" value={limits.overage_price_per_minute_usd} onChange={(e) => setLimits({ ...limits, overage_price_per_minute_usd: Number(e.target.value) })} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>

              <div className="flex items-center gap-2">
                <input id="allow_overage" type="checkbox" checked={limits.allow_overage} onChange={(e) => setLimits({ ...limits, allow_overage: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="allow_overage" className="text-sm text-gray-300">Allow overage charges</label>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={saveLimits} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50">
                  {saving ? (<><Loader className="animate-spin" /> Saving...</>) : (<><Save className="h-4 w-4" /> Save</>)}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-gray-800 bg-[#0E1627] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">All Subscriptions</h3>
              <div className="text-sm text-gray-400">{subscriptions.length} total</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Package</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Minutes</th>
                    <th className="text-left px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(s => (
                    <tr key={s.id} className="border-b border-gray-900/40">
                      <td className="px-4 py-3">{s.id}</td>
                      <td className="px-4 py-3">{s.user} <div className="text-xs text-gray-400">{s.email}</div></td>
                      <td className="px-4 py-3">{s.package}</td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3">{s.minutes_used}/{s.minutes_limit}</td>
                      <td className="px-4 py-3">${s.price}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => openManage(s)} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm">Manage</button>
                        {s.status !== 'canceled' && <button onClick={() => cancelSubscription(s.id)} className="px-2 py-1 bg-red-700 text-white rounded text-sm">Cancel</button>}
                        {s.status !== 'active' && <button onClick={() => renewSubscription(s.id)} className="px-2 py-1 bg-green-700 text-white rounded text-sm">Renew</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#081021] p-6 rounded-lg w-11/12 max-w-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Subscription {selected.id}</h3>
              <button onClick={closeManage} className="text-gray-400"><X /></button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-gray-300">User</label>
                <div className="text-white">{selected.user} ({selected.email})</div>
              </div>

              <div>
                <label className="text-sm text-gray-300">Package</label>
                <div className="text-white">{selected.package} — ${selected.price}/mo</div>
              </div>

              <div>
                <label className="text-sm text-gray-300">Status</label>
                <select value={selected.status} onChange={(e) => setSelected(prev => ({ ...prev, status: e.target.value }))} className="w-full bg-gray-800 text-white px-2 py-1 rounded">
                  <option value="active">active</option>
                  <option value="trialing">trialing</option>
                  <option value="past_due">past_due</option>
                  <option value="canceled">canceled</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">Minutes used</label>
                <input type="number" value={selected.minutes_used} onChange={(e) => setSelected(prev => ({ ...prev, minutes_used: Number(e.target.value) }))} className="w-full bg-gray-800 text-white px-2 py-1 rounded" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => saveSubscription(selected)} disabled={modalSaving} className="bg-blue-600 px-3 py-2 rounded">{modalSaving ? 'Saving...' : 'Save'}</button>
                <button onClick={closeManage} className="border border-gray-700 px-3 py-2 rounded text-gray-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
