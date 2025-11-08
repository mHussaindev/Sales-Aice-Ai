'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Pencil, 
  Eye, 
  Archive, 
  RotateCcw, 
  Package, 
  DollarSign, 
  Users, 
  CheckCircle, 
  XCircle, 
  EyeOff, 
  Search, 
  Filter, 
  MoreVertical, 
  Star,
  Clock,
  Shield,
  TrendingUp,
  Settings,
  Crown,
  Zap,
  Edit3
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { axiosInstance } from '../../../utils/axiosInstance';
import { toast } from 'sonner';

// Types
type PackageStatus = 'active' | 'inactive' | 'retired';
type PackageType = 'basic' | 'pro' | 'enterprise' | 'custom';

type ApiResponse = {
  success: boolean;
  message: string;
  packages: AdminPackage[];
};

type AdminPackage = {
  id: number | string;
  name: string;
  description?: string;
  type?: PackageType;
  price_monthly: number | string;
  price_yearly?: number | string;
  minutes_inbound_limit: number;
  minutes_outbound_limit: number;
  minutes_total_limit: number;
  agents_allowed: number;
  analytics_access: boolean;
  features: Record<string, any>;
  is_active: boolean;
  status?: PackageStatus;
  created_at: string;
  updated_at?: string;
  subscribers?: number;
  total_revenue?: number;
  conversion_rate?: number;
  popular_tag?: boolean;
};

function normalize(p: AdminPackage) {
  return {
    ...p,
    price_monthly:
      typeof p.price_monthly === 'string' ? parseFloat(p.price_monthly) : p.price_monthly,
  };
}

// Helper Functions
function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function formatDate(dateISO: string) {
  return new Date(dateISO).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusColor(status: PackageStatus | boolean) {
  if (typeof status === 'boolean') {
    status = status ? 'active' : 'inactive';
  }
  
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'retired':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
}

function getTypeIcon(type: PackageType | string) {
  switch (type) {
    case 'basic':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'pro':
      return <Zap className="h-4 w-4 text-purple-500" />;
    case 'enterprise':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'custom':
      return <Settings className="h-4 w-4 text-gray-500" />;
    default:
      return <Package className="h-4 w-4 text-gray-500" />;
  }
}

// Components
function StatsCard({ title, value, icon: Icon, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-700/50 p-2">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
      </div>
    </div>
  );
}

function PackageActionsDropdown({ pkg, onEdit, onToggleStatus, onRetire, onView, onDelete }: {
  pkg: AdminPackage;
  onEdit: (pkg: AdminPackage) => void;
  onToggleStatus: (pkg: AdminPackage) => void;
  onRetire: (pkg: AdminPackage) => void;
  onView: (pkg: AdminPackage) => void;
  onDelete: (pkg: AdminPackage) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const status = pkg.status || (pkg.is_active ? 'active' : 'inactive');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg">
            <button
              onClick={() => { onView(pkg); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button
              onClick={() => { onEdit(pkg); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit Package
            </button>
            <button
              onClick={() => { onToggleStatus(pkg); setIsOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                status === 'active' ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => { onRetire(pkg); setIsOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                status === 'retired' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {status === 'retired' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {status === 'retired' ? 'Restore' : 'Retire'}
            </button>
            <hr className="my-1 border-gray-200 dark:border-gray-600" />
            <button
              onClick={() => { onDelete(pkg); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Package
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PackagesListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = async () => {
    try {debugger
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<ApiResponse>('/api/subscriptions/admin/packages/');
      const packages = response.data.packages || [];
      setRows(packages.map(normalize));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter packages
  const filteredPackages = rows.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = pkg.status || (pkg.is_active ? 'active' : 'inactive');
    return matchesSearch && status === statusFilter;
  });

  // Action handlers
  const handleViewPackage = (pkg: AdminPackage) => {
    router.push(`/admin/packages/${pkg.id}`);
  };

  const handleEditPackage = (pkg: AdminPackage) => {
    router.push(`/admin/packages/${pkg.id}/edit`);
  };

  const handleToggleStatus = async (pkg: AdminPackage) => {
    const currentStatus = pkg.status || (pkg.is_active ? 'active' : 'inactive');
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const confirmed = confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} "${pkg.name}"?\n\nThis will ${newStatus === 'active' ? 'make it available for new subscriptions' : 'hide it from new customers'}.`);
    
    if (confirmed) {
      try {
        // Update locally for now - replace with API call when backend is ready
        setRows(prev => prev.map(p => 
          p.id === pkg.id 
            ? { ...p, is_active: newStatus === 'active', status: newStatus }
            : p
        ));
        
        toast.success(`Package "${pkg.name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        
        // Uncomment when API endpoint is ready:
        // await axiosInstance.patch(`/api/subscriptions/admin/packages/${pkg.id}/status/`, { 
        //   status: newStatus 
        // });
        
      } catch (error) {
        console.error('Error updating package status:', error);
        toast.error('Failed to update package status. Please try again.');
      }
    }
  };

  const handleRetirePackage = async (pkg: AdminPackage) => {
    const currentStatus = pkg.status || (pkg.is_active ? 'active' : 'inactive');
    
    if (currentStatus === 'retired') {
      // Restore package
      const confirmed = confirm(`Are you sure you want to restore "${pkg.name}"?\n\nThis will make it available again for new subscriptions.`);
      
      if (confirmed) {
        try {
          setRows(prev => prev.map(p => 
            p.id === pkg.id 
              ? { ...p, is_active: true, status: 'active' }
              : p
          ));
          toast.success(`Package "${pkg.name}" has been restored successfully!`);
        } catch (error) {
          toast.error('Failed to restore package. Please try again.');
        }
      }
    } else {
      // Retire package
      const confirmed = confirm(`⚠️ Retire Package: "${pkg.name}"\n\nThis will:\n- Keep existing subscriptions active\n- Hide package from new customers\n- Mark as legacy/retired\n\nConfirm retirement?`);
      
      if (confirmed) {
        try {
          setRows(prev => prev.map(p => 
            p.id === pkg.id 
              ? { ...p, is_active: false, status: 'retired' }
              : p
          ));
          toast.success(`Package "${pkg.name}" has been retired successfully!`);
        } catch (error) {
          toast.error('Failed to retire package. Please try again.');
        }
      }
    }
  };

  const handleDelete = async (pkg: AdminPackage) => {
    const confirmed = confirm(`⚠️ DANGER: Delete Package\n\nAre you sure you want to permanently delete "${pkg.name}"?\n\nThis action cannot be undone and will:\n- Cancel active subscriptions\n- Remove all package data\n- Delete billing history\n\nType "DELETE" to confirm this is what you want to do.`);
    
    if (confirmed) {
      const doubleConfirm = prompt('Please type "DELETE" to confirm:');
      if (doubleConfirm === 'DELETE') {
        try {
          setDeletingId(pkg.id);
          await axiosInstance.delete(`/api/subscriptions/admin/packages/${pkg.id}/`);
          toast.success('Package deleted permanently');
          setRows(prev => prev.filter(r => r.id !== pkg.id));
        } catch (e: any) {
          toast.error(e?.response?.data?.detail ?? 'Delete failed');
        } finally {
          setDeletingId(null);
        }
      } else {
        toast.error('Deletion cancelled - incorrect confirmation.');
      }
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-4 py-25 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-25 dark:bg-[#0B1220]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
              <Package className="h-8 w-8 text-gray-600 dark:text-gray-300" />
              Subscription Packages
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create, edit, and manage subscription packages for your users
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition-colors text-gray-700 dark:text-gray-200"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin/packages/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Package
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition-colors text-gray-700 dark:text-gray-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-4">
            <StatsCard
              title="Total Packages"
              value={rows.length}
              icon={Package}
              subtitle="All packages"
            />
            <StatsCard
              title="Active Packages"
              value={rows.filter(p => p.is_active).length}
              icon={CheckCircle}
              subtitle="Available for signup"
            />
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(rows.reduce((sum, p) => sum + (p.total_revenue || 0), 0))}
              icon={DollarSign}
              subtitle="All time"
            />
            <StatsCard
              title="Total Subscribers"
              value={rows.reduce((sum, p) => sum + (p.subscribers || 0), 0)}
              icon={Users}
              subtitle="Active users"
            />
          </div>
        )}

        {/* Filters and Search */}
        {!loading && !error && (
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search packages by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="retired">Retired</option>
                </select>
                
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 text-sm rounded-l-md transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 text-sm rounded-r-md transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {loading && (
        <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-4 animate-pulse h-24" />
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm">
          <p className="font-medium text-red-300">Couldn’t load packages.</p>
          <p className="text-red-400/90">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPackages.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No packages found</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Create your first subscription package to get started'
                    }
                  </p>
                </div>
              ) : (
                filteredPackages.map((pkg) => {
                  const normalizedPkg = normalize(pkg);
                  const status = pkg.status || (pkg.is_active ? 'active' : 'inactive');
                  const type = pkg.type || 'basic';
                  
                  return (
                    <div key={pkg.id} className={`rounded-xl border bg-white dark:bg-[#0E1627] p-6 transition-all hover:shadow-lg relative ${
                      status === 'active' ? 'border-gray-300 dark:border-gray-600' :
                      status === 'inactive' ? 'border-yellow-300 dark:border-yellow-800' :
                      'border-gray-400 dark:border-gray-500 opacity-75'
                    }`}>
                      {/* Package Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(type)}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              {pkg.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <PackageActionsDropdown
                          pkg={pkg}
                          onView={handleViewPackage}
                          onEdit={handleEditPackage}
                          onToggleStatus={handleToggleStatus}
                          onRetire={handleRetirePackage}
                          onDelete={() => handleDelete(pkg)}
                        />
                      </div>

                      {/* Pricing */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(normalizedPkg.price_monthly)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>
                        </div>
                      </div>

                      {/* Key Features */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {pkg.minutes_total_limit 
                              ? `${pkg.minutes_total_limit} total minutes`
                              : `${pkg.minutes_inbound_limit}/${pkg.minutes_outbound_limit} in/out minutes`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Up to {pkg.agents_allowed} agents
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {pkg.analytics_access ? 'Analytics included' : 'Basic support'}
                          </span>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Subscribers</span>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {pkg.subscribers || 0}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(pkg.total_revenue || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-left text-gray-600 dark:text-gray-400">
                      <th className="px-6 py-4">Package</th>
                      <th className="px-6 py-4">Price (Monthly)</th>
                      <th className="px-6 py-4">Minutes/Agents</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Subscribers</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No packages found</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filters' 
                              : 'Create your first subscription package to get started'
                            }
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredPackages.map((pkg) => {
                        const normalizedPkg = normalize(pkg);
                        const status = pkg.status || (pkg.is_active ? 'active' : 'inactive');
                        const type = pkg.type || 'basic';
                        
                        return (
                          <tr key={pkg.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {getTypeIcon(type)}
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {pkg.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {type} package
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {formatCurrency(normalizedPkg.price_monthly)}
                            </td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                              <div className="text-sm">
                                {pkg.minutes_total_limit 
                                  ? `${pkg.minutes_total_limit} min`
                                  : `${pkg.minutes_inbound_limit}/${pkg.minutes_outbound_limit}`
                                }
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {pkg.agents_allowed} agents
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {pkg.subscribers || 0}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <PackageActionsDropdown
                                pkg={pkg}
                                onView={handleViewPackage}
                                onEdit={handleEditPackage}
                                onToggleStatus={handleToggleStatus}
                                onRetire={handleRetirePackage}
                                onDelete={() => handleDelete(pkg)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
