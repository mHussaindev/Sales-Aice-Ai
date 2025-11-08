'use client';

import { useEffect, useState } from 'react';
import {
  Users, Package, Plus, Settings, Phone
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { axiosInstance } from '../../../utils/axiosInstance';
import { useTheme } from 'next-themes';

// ---------------- Types ----------------
type MiniUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  joined_at: string; // ISO
  status: 'active' | 'inactive' | 'banned';
};

type MiniPackage = {
  id: string;
  name: string;
  price_monthly: number;
  subscribers: number;
  minutes_included: number;
};

type SparkPoint = { x: number; y: number };

type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalPackages: number;
    mrrUsd: number;
    callsToday: number;
    churnRatePct: number;
  };
  trends: {
    mrr: SparkPoint[];
    calls: SparkPoint[];
    users: SparkPoint[];
  };
  recentUsers: MiniUser[];
  topPackages: MiniPackage[];
};

// API may return price_monthly as a string
type ApiDashboardPayload = AdminDashboardData & {
  topPackages: Array<Omit<MiniPackage, 'price_monthly'> & { price_monthly: number | string }>;
};

function transformDashboard(api: ApiDashboardPayload): AdminDashboardData {
  return {
    ...api,
    topPackages: api.topPackages.map(p => ({
      ...p,
      price_monthly: typeof p.price_monthly === 'string'
        ? parseFloat(p.price_monthly)
        : p.price_monthly,
    })),
  };
}

// ---------- Real API call via axiosInstance ----------
async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await axiosInstance.get<ApiDashboardPayload>('/api/accounts/admin/dashboard/');
   // The mapping happens here:
  // - data is of type ApiDashboardPayload (API response)
  // - transformDashboard(data) converts it to AdminDashboardData (internal type)
  return transformDashboard(data);
}

// ---------------- Small UI bits ----------------
function CardSkeleton() {
  return <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse h-28" />;
}

function StatCard({
  title, value, icon: Icon, hint, trend
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  trend?: SparkPoint[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</div>
          {hint && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{hint}</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-600/10 dark:to-blue-700/10 p-3">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          {trend && (
            <div className="text-right">
              <Sparkline data={trend} width={100} height={32} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, width = 120, height = 44 }: { data: SparkPoint[]; width?: number; height?: number }) {
  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));
  const rangeY = Math.max(1, maxY - minY);
  const stepX = width / Math.max(1, data.length - 1);

  const path = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((d.y - minY) / rangeY) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="opacity-90">
      <path d={path} fill="none" stroke="currentColor" className="text-gray-500 dark:text-gray-400" strokeWidth="2" />
    </svg>
  );
}

function SectionHeader({ title, cta }: { title: string; cta?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {cta}
    </div>
  );
}

function QuickGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Access admin functions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users" className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-600/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-600/20 transition-colors">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                User Management
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View, edit, ban users and manage roles
              </p>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/packages" className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-600/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-600/20 transition-colors">
              <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Package Management
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create, edit, retire subscription plans
              </p>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/packages/new" className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-600/10 group-hover:bg-purple-100 dark:group-hover:bg-purple-600/20 transition-colors">
              <Plus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Create Package
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add new subscription package
              </p>
            </div>
          </div>
        </Link>
        
        <div className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Settings className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-600 dark:text-gray-400">
                System Settings
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Coming soon - Billing & limits
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Mini tables ----------------
function MiniTableUsers({ rows }: { rows: MiniUser[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-gray-600 dark:text-gray-400">
              <th className="text-left px-6 py-4 font-semibold">User</th>
              <th className="text-left px-6 py-4 font-semibold">Email</th>
              <th className="text-left px-6 py-4 font-semibold">Role</th>
              <th className="text-left px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                      {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    u.role === 'admin' 
                      ? 'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-600/30'
                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/30'
                  }`}>
                    {u.role === 'admin' ? '👑' : '👤'} {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    u.status === 'active' 
                      ? 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/30'
                      : u.status === 'banned'
                      ? 'bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600/30'
                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/30'
                  }`}>
                    {u.status === 'active' ? '✅' : u.status === 'banned' ? '🚫' : '⏸️'} {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Recent registrations</span>
          <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View all users →
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniTablePackages({ rows }: { rows: MiniPackage[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-gray-600 dark:text-gray-400">
              <th className="text-left px-6 py-4 font-semibold">Package</th>
              <th className="text-left px-6 py-4 font-semibold">Price</th>
              <th className="text-left px-6 py-4 font-semibold">Subscribers</th>
              <th className="text-left px-6 py-4 font-semibold">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    ${p.price_monthly}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{p.subscribers}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">users</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                    📞 {p.minutes_included.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Link href="/admin/packages/new" className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            <Plus className="h-4 w-4" /> Create new package
          </Link>
          <Link href="/admin/packages" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Manage all packages →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------- Main page ----------------
export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth(); // not strictly required for the call, but useful to trigger refetch when it appears
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await fetchAdminDashboard();
        if (active) setData(payload);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Failed to load');
      }
    };

    // Call once on mount and whenever token changes (helps after login)
    load();
    return () => { active = false; };
  }, [accessToken]);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220]">
      <div className="max-w-7xl mx-auto px-4 py-25 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220]">
      <div className="max-w-7xl mx-auto px-4 py-25 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Settings className="h-8 w-8" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage users, subscription packages, and view comprehensive system analytics
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/packages/new" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" /> 
              New Package
            </Link>
            <Link 
              href="/admin/users" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <Users className="h-4 w-4" /> 
              Manage Users
            </Link>
          </div>
        </div>

      {/* Quick actions */}
      <QuickGrid />

      {/* Metrics */}
      {!data && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm">
          <p className="font-medium text-red-300">Couldn’t load dashboard.</p>
          <p className="text-red-400/90">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Key Metrics</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time system statistics</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={data.metrics.totalUsers.toLocaleString()}
                icon={Users}
                trend={data.trends.users}
                hint="Registered accounts"
              />
              <StatCard
                title="Active Users"
                value={data.metrics.activeUsers.toLocaleString()}
                icon={Users}
                hint="Currently active"
              />
              <StatCard
                title="Calls Today"
                value={data.metrics.callsToday.toLocaleString()}
                icon={Phone}
                trend={data.trends.calls}
                hint="Real-time count"
              />
              <StatCard
                title="Total Packages"
                value={data.metrics.totalPackages.toLocaleString()}
                icon={Package}
                hint="Available plans"
              />
            </div>
          </div>

          {/* Revenue Analytics */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
            <SectionHeader 
              title="Revenue Analytics & Package Performance" 
              cta={
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${data.metrics.mrrUsd.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</div>
                </div>
              } 
            />
            <div className="mt-6 space-y-6">
              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-600/10">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${data.metrics.mrrUsd.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-600/10">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {data.metrics.churnRatePct.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Churn Rate</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-600/10">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    ${Math.round(data.metrics.mrrUsd / data.metrics.activeUsers)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Revenue Per User</div>
                </div>
              </div>
              
              {/* Package Performance */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Packages</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{data.metrics.totalPackages} total packages</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.topPackages.map(p => (
                    <div key={p.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                          {p.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.minutes_included.toLocaleString()} minutes included</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">${p.price_monthly}/mo</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{p.subscribers} subscribers</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link 
                    href="/admin/packages" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View all packages →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Data Tables */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest users and package performance</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <MiniTableUsers rows={data.recentUsers} />
              </div>
              <div>
                <MiniTablePackages rows={data.topPackages} />
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
