/**
 * Admin User Details Page
 * 
 * Comprehensive user profile view for administrators with:
 * - Full profile information
 * - Call history and analytics
 * - Billing details and transaction history
 * - Activity logs and system events
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  TrendingUp,
  DollarSign,
  PhoneCall,
  MessageSquare,
  Shield,
  Eye,
  Edit3,
  Ban,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { axiosInstance } from '../../../../utils/axiosInstance';
import { useTheme } from 'next-themes';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  phone?: string;
  company?: string;
  joinedAt: string;
  lastLoginAt?: string;
  totalCalls: number;
  minutesUsed: number;
  currentPlan: string;
  billingStatus: 'active' | 'overdue' | 'cancelled';
  avatar?: string;
  profile: {
    bio?: string;
    timezone?: string;
    language?: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

interface CallRecord {
  id: string;
  date: string;
  duration: number; // in seconds
  type: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'failed';
  phoneNumber: string;
  cost: number;
  transcript?: string;
}

interface BillingTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'charge' | 'refund' | 'credit';
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoice?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'warning' | 'error';
}

interface UserDetailData {
  user: User;
  callHistory: CallRecord[];
  billingHistory: BillingTransaction[];
  activityLogs: ActivityLog[];
  analytics: {
    totalSpent: number;
    avgCallDuration: number;
    successRate: number;
    mostActiveDay: string;
    callsByMonth: { month: string; calls: number }[];
  };
}

// API Configuration
const USE_MOCK_DATA = false; // Set to false for real API

// Mock Data
const mockUserDetailData: UserDetailData = {
  user: {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'user',
    status: 'active',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    joinedAt: '2024-08-15T10:30:00Z',
    lastLoginAt: '2025-10-03T14:20:00Z',
    totalCalls: 245,
    minutesUsed: 1250,
    currentPlan: 'Pro - 2000 min',
    billingStatus: 'active',
    profile: {
      bio: 'Senior Sales Manager at Tech Corp with 8 years of experience in B2B sales.',
      timezone: 'America/New_York',
      language: 'English',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  callHistory: [
    {
      id: 'call_1',
      date: '2025-10-24T15:30:00Z',
      duration: 420,
      type: 'outbound',
      status: 'completed',
      phoneNumber: '+1 (555) 987-6543',
      cost: 2.10,
      transcript: 'Sales call with potential client about enterprise package...'
    },
    {
      id: 'call_2',
      date: '2025-10-24T11:15:00Z',
      duration: 180,
      type: 'inbound',
      status: 'completed',
      phoneNumber: '+1 (555) 456-7890',
      cost: 0.90
    },
    {
      id: 'call_3',
      date: '2025-10-23T16:45:00Z',
      duration: 0,
      type: 'outbound',
      status: 'missed',
      phoneNumber: '+1 (555) 321-0987',
      cost: 0
    }
  ],
  billingHistory: [
    {
      id: 'txn_1',
      date: '2025-10-01T00:00:00Z',
      amount: 49.99,
      type: 'charge',
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription',
      invoice: 'INV-2025-001'
    },
    {
      id: 'txn_2',
      date: '2025-09-15T12:30:00Z',
      amount: 15.50,
      type: 'charge',
      status: 'paid',
      description: 'Additional minutes usage',
    },
    {
      id: 'txn_3',
      date: '2025-09-01T00:00:00Z',
      amount: 49.99,
      type: 'charge',
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription',
      invoice: 'INV-2025-002'
    }
  ],
  activityLogs: [
    {
      id: 'log_1',
      timestamp: '2025-10-25T09:30:00Z',
      action: 'Login',
      details: 'User logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: 'log_2',
      timestamp: '2025-10-24T18:45:00Z',
      action: 'Call Initiated',
      details: 'Outbound call to +1 (555) 987-6543',
      status: 'success'
    },
    {
      id: 'log_3',
      timestamp: '2025-10-24T16:20:00Z',
      action: 'Profile Updated',
      details: 'Changed notification preferences',
      status: 'success'
    }
  ],
  analytics: {
    totalSpent: 195.47,
    avgCallDuration: 315,
    successRate: 92.5,
    mostActiveDay: 'Tuesday',
    callsByMonth: [
      { month: 'Aug', calls: 45 },
      { month: 'Sep', calls: 67 },
      { month: 'Oct', calls: 89 }
    ]
  }
};

// Helper Functions
function formatDate(dateISO: string) {
  return new Date(dateISO).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateISO: string) {
  return new Date(dateISO).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getCallStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'missed':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'failed':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

function getActivityStatusColor(status: string) {
  switch (status) {
    case 'success':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    case 'error':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-2">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'calls' | 'billing' | 'activity'>('profile');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (USE_MOCK_DATA) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          setData(mockUserDetailData);
        } else {debugger
          // Real API call
          const response = await axiosInstance.get(`/api/accounts/admin/users/${parseInt(userId)}/details/`);
          setData(response.data);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load User Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'User not found'}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-25 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details: {data.user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete profile and activity information
            </p>
          </div>
          <div className="flex gap-2">
            {/* <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Edit3 className="h-4 w-4 mr-2 inline" />
              Edit
            </button> */}
            {/* <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Download className="h-4 w-4 mr-2 inline" />
              Export
            </button> */}
          </div>
        </div>

        {/* User Summary Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-start gap-6">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white font-bold text-xl w-16 h-16 flex items-center justify-center">
              {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1 grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.user.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{data.user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{data.user.company}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{data.user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Joined {formatDate(data.user.joinedAt)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    data.user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    data.user.status === 'banned' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {data.user.status.charAt(0).toUpperCase() + data.user.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Plan: {data.user.currentPlan}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Calls"
            value={data.user.totalCalls}
            icon={PhoneCall}
            subtitle={`${data.analytics.successRate}% success rate`}
          />
          <StatsCard
            title="Minutes Used"
            value={data.user.minutesUsed}
            icon={Clock}
            subtitle={`Avg: ${Math.round(data.analytics.avgCallDuration / 60)}min per call`}
          />
          <StatsCard
            title="Total Spent"
            value={`$${data.analytics.totalSpent}`}
            icon={DollarSign}
            subtitle="All time"
          />
          <StatsCard
            title="Most Active"
            value={data.analytics.mostActiveDay}
            icon={TrendingUp}
            subtitle="Day of week"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'profile', label: 'Profile Information', icon: User },
              { key: 'calls', label: 'Call History', icon: PhoneCall },
              { key: 'billing', label: 'Billing Details', icon: CreditCard },
              { key: 'activity', label: 'Activity Logs', icon: Activity }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {data.user.profile.bio || 'No bio provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timezone
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {data.user.profile.timezone || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Language
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {data.user.profile.language || 'English'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notification Preferences
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${data.user.profile.notifications.email ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span className="text-gray-900 dark:text-white">Email Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${data.user.profile.notifications.sms ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span className="text-gray-900 dark:text-white">SMS Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${data.user.profile.notifications.push ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span className="text-gray-900 dark:text-white">Push Notifications</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Login
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {data.user.lastLoginAt ? formatDateTime(data.user.lastLoginAt) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Call History
                </h3>
                <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  Export All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                      <th className="pb-3">Date & Time</th>
                      <th className="pb-3">Phone Number</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Cost</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.callHistory.map((call) => (
                      <tr key={call.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 text-gray-900 dark:text-white">
                          {formatDateTime(call.date)}
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          {call.phoneNumber}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            call.type === 'outbound' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          }`}>
                            {call.type}
                          </span>
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          {call.duration > 0 ? formatDuration(call.duration) : '-'}
                        </td>
                        <td className="py-3">
                          <span className={`capitalize ${getCallStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          ${call.cost.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Billing History
                </h3>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.user.billingStatus === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    data.user.billingStatus === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {data.user.billingStatus}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.billingHistory.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 text-gray-900 dark:text-white">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            transaction.type === 'charge' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            transaction.type === 'refund' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            transaction.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                            transaction.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {transaction.invoice ? (
                            <button className="text-blue-600 dark:text-blue-400 hover:underline">
                              {transaction.invoice}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activity Logs
              </h3>
              <div className="space-y-3">
                {data.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className={`p-2 rounded-full ${getActivityStatusColor(log.status)}`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {log.action}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {log.details}
                      </p>
                      {log.ipAddress && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}