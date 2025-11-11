/**
 * Admin Users Management Page
 * 
 * This page provides comprehensive user management functionality for administrators.
 * 
 * API Integration:
 * - Set USE_MOCK_DATA to false to enable real API calls
 * - Uncomment the API functions and import statements when ready
 * - The page will automatically switch between mock and real data
 * 
 * Features:
 * - View all users with filtering and search
 * - Ban/unban users
 * - Delete users (with confirmation)
 * - Export user data to CSV
 * - Real-time user statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Phone,
  Crown,
  User,
  MoreVertical,
  Eye,
  Shield,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { axiosInstance } from '../../../utils/axiosInstance';
import { useTheme } from 'next-themes';
import { useAdminRoute } from '../../../hooks/useProtectedRoute';

// ---------------- Types ----------------
type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';
type UserRole = 'admin' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  company?: string;
  joinedAt: string; // ISO date
  lastLoginAt?: string; // ISO date
  totalCalls: number;
  minutesUsed: number;
  currentPlan: string;
  billingStatus: 'active' | 'overdue' | 'cancelled';
  avatar?: string;
}

interface UsersData {
  users: User[];
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  stats: {
    newUsersThisMonth: number;
    totalRevenue: number;
    avgCallsPerUser: number;
  };
}

// ---------------- API Configuration ----------------
/**
 * API Integration Toggle
 * 
 * To switch from mock data to real API:
 * 1. Set USE_MOCK_DATA = false
 * 2. Uncomment the import: import { axiosInstance } from '../../../utils/axiosInstance';
 * 3. Uncomment the API functions below (fetchUsersFromAPI, updateUserStatusAPI, deleteUserAPI)
 * 4. Update the API endpoints to match your backend
 */
const USE_MOCK_DATA = false; // Set to false to use real API

// ---------------- API Functions ----------------
const fetchUsersFromAPI = async (): Promise<UsersData> => {
  try {
    const response = await axiosInstance.get('/api/accounts/admin/users/');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users from server');
  }
};

const updateUserStatusAPI = async (userId: string, status: UserStatus): Promise<User> => {
  try {
    const response = await axiosInstance.patch(`/api/accounts/admin/users/${userId}/status/`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
};

const deleteUserAPI = async (userId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/accounts/admin/users/${userId}/`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// ---------------- Mock Data ----------------
const mockUsersData: UsersData = {
  users: [
    {
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
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@startup.io',
      role: 'user',
      status: 'active',
      phone: '+1 (555) 987-6543',
      company: 'StartupIO',
      joinedAt: '2024-09-22T09:15:00Z',
      lastLoginAt: '2025-10-03T11:45:00Z',
      totalCalls: 89,
      minutesUsed: 420,
      currentPlan: 'Basic - 500 min',
      billingStatus: 'active',
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@enterprise.com',
      role: 'admin',
      status: 'active',
      phone: '+1 (555) 456-7890',
      company: 'Enterprise Solutions',
      joinedAt: '2024-07-10T08:00:00Z',
      lastLoginAt: '2025-10-04T09:30:00Z',
      totalCalls: 567,
      minutesUsed: 2840,
      currentPlan: 'Enterprise - Unlimited',
      billingStatus: 'active',
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@freelance.com',
      role: 'user',
      status: 'inactive',
      phone: '+1 (555) 321-9876',
      company: 'Freelancer',
      joinedAt: '2024-06-05T12:45:00Z',
      lastLoginAt: '2025-09-15T16:20:00Z',
      totalCalls: 23,
      minutesUsed: 67,
      currentPlan: 'Basic - 500 min',
      billingStatus: 'overdue',
    },
    {
      id: '5',
      name: 'Robert Wilson',
      email: 'robert.wilson@spam.com',
      role: 'user',
      status: 'banned',
      phone: '+1 (555) 111-2222',
      company: 'Spam Inc',
      joinedAt: '2024-05-20T14:30:00Z',
      lastLoginAt: '2025-08-10T10:15:00Z',
      totalCalls: 1205,
      minutesUsed: 8500,
      currentPlan: 'Pro - 2000 min',
      billingStatus: 'cancelled',
    },
    {
      id: '6',
      name: 'Lisa Martinez',
      email: 'lisa.martinez@agency.com',
      role: 'user',
      status: 'pending',
      phone: '+1 (555) 789-0123',
      company: 'Marketing Agency',
      joinedAt: '2025-10-01T11:00:00Z',
      totalCalls: 0,
      minutesUsed: 0,
      currentPlan: 'Basic - 500 min',
      billingStatus: 'active',
    },
  ],
  totalUsers: 156,
  activeUsers: 98,
  bannedUsers: 12,
  stats: {
    newUsersThisMonth: 15,
    totalRevenue: 47500,
    avgCallsPerUser: 188,
  },
};

// ---------------- Helper Functions ----------------
function formatDate(dateISO: string) {
  try {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateISO: string) {
  try {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

function getStatusColor(status: UserStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30';
    case 'inactive':
      return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
    case 'banned':
      return 'bg-red-600/20 text-red-300 border-red-600/30';
    case 'pending':
      return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
    default:
      return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
  }
}

function getStatusIcon(status: UserStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-3 w-3" />;
    case 'inactive':
      return <XCircle className="h-3 w-3" />;
    case 'banned':
      return <Ban className="h-3 w-3" />;
    case 'pending':
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return <XCircle className="h-3 w-3" />;
  }
}

function getRoleIcon(role: UserRole) {
  return role === 'admin' ? <Crown className="h-4 w-4 text-yellow-400" /> : <User className="h-4 w-4 text-gray-400" />;
}

// ---------------- Components ----------------
function StatsCard({ title, value, icon: Icon, change, changeType }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {change && (
              <span className={`text-sm ${
                changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 
                changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {change}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-700/50 p-3">
          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </div>
      </div>
    </div>
  );
}

function UserActionsDropdown({ user, onEdit, onBan, onDelete, onView, actionLoading }: {
  user: User;
  onEdit: (user: User) => void;
  onBan: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  actionLoading?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const isUserActionLoading = (action: string) => actionLoading === `${action}-${user.id}`;
  const isAnyActionLoading = actionLoading !== null;

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
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2937] py-1 shadow-lg">
            <button
              onClick={() => { onView(user); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button
              onClick={() => { onEdit(user); setIsOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Edit3 className="h-4 w-4" />
              Edit User
            </button>
            <button
              onClick={() => { onBan(user); setIsOpen(false); }}
              disabled={isAnyActionLoading}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                user.status === 'banned' ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'
              } ${isAnyActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUserActionLoading('ban') || isUserActionLoading('unban') ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                user.status === 'banned' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />
              )}
              {isUserActionLoading('ban') || isUserActionLoading('unban') ? 'Processing...' : 
               user.status === 'banned' ? 'Unban User' : 'Ban User'}
            </button>
            <button
              onClick={() => { onDelete(user); setIsOpen(false); }}
              disabled={isAnyActionLoading}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                isAnyActionLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUserActionLoading('delete') ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isUserActionLoading('delete') ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Main Component ----------------
export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading, user } = useAdminRoute();
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const { theme } = useTheme();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (USE_MOCK_DATA) {
          // Using mock data - simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          if (!isMounted) return;
          setData(mockUsersData);
        } else {
          // Real API call
          const usersData = await fetchUsersFromAPI();
          if (!isMounted) return;
          setData(usersData);
          
          console.log('Successfully fetched users from API');
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? 'Failed to load users');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUsers();
    
    return () => { isMounted = false; };
  }, []);

  // Filter users based on search and filters
  const filteredUsers = data?.users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  }) || [];

  // Action handlers
  const handleViewUser = (user: User) => {
    // Navigate to user details page
    router.push(`/admin/users/${user.id}`);
  };

  const handleEditUser = (user: User) => {
    // Navigate to edit user page with user data in state
    router.push(`/admin/users/${user.id}/edit?userData=${encodeURIComponent(JSON.stringify(user))}`);
  };

  const handleBanUser = async (user: User) => {
    const action = user.status === 'banned' ? 'unban' : 'ban';
    const newStatus: UserStatus = user.status === 'banned' ? 'active' : 'banned';
    
    const confirmMessage = user.status === 'banned' 
      ? `🔓 Unban User: ${user.name}\n\nThis will restore their access to:\n✅ Login to their account\n✅ Make calls and use services\n✅ Access their dashboard\n\nAre you sure you want to unban this user?`
      : `🚫 Ban User: ${user.name}\n\nThis will immediately:\n❌ Block their login access\n❌ Terminate active sessions\n❌ Prevent new calls/services\n❌ Hide their dashboard\n\nReason: Policy violation / Suspicious activity\n\nAre you sure you want to ban this user?`;
    
    const confirmed = confirm(confirmMessage);
    
    if (confirmed) {
      setActionLoading(`${action}-${user.id}`);
      
      try {
        if (USE_MOCK_DATA) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update user status locally for mock data
          setData(prev => {
            if (!prev) return prev;
            
            const updatedStats = { ...prev };
            
            // Update user counts based on status change
            if (user.status === 'banned' && newStatus === 'active') {
              updatedStats.bannedUsers = Math.max(0, prev.bannedUsers - 1);
              updatedStats.activeUsers = prev.activeUsers + 1;
            } else if (user.status === 'active' && newStatus === 'banned') {
              updatedStats.activeUsers = Math.max(0, prev.activeUsers - 1);
              updatedStats.bannedUsers = prev.bannedUsers + 1;
            }
            
            return {
              ...updatedStats,
              users: prev.users.map(u => 
                u.id === user.id 
                  ? { ...u, status: newStatus }
                  : u
              )
            };
          });
        } else {
          // Real API call
          await updateUserStatusAPI(user.id, newStatus);
          // Refresh the data after API call
          const updatedData = await fetchUsersFromAPI();
          setData(updatedData);
          
          console.log('Successfully updated user status via API');
        }
        
        // Success notification with better styling
        const successMessage = user.status === 'banned' 
          ? `✅ User Unbanned Successfully!\n\n${user.name} can now access their account again.`
          : `🚫 User Banned Successfully!\n\n${user.name} has been blocked from accessing the system.`;
          
        alert(successMessage);
      } catch (error) {
        console.error('Error updating user status:', error);
        
        const errorMessage = user.status === 'banned'
          ? `❌ Failed to unban user ${user.name}.\n\nPlease check your connection and try again.`
          : `❌ Failed to ban user ${user.name}.\n\nPlease check your connection and try again.`;
          
        alert(errorMessage);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    const confirmMessage = `🗑️ PERMANENT DELETION WARNING\n\n⚠️ You are about to permanently delete: ${user.name}\n📧 Email: ${user.email}\n🏢 Company: ${user.company || 'N/A'}\n\n💥 This action will IMMEDIATELY and PERMANENTLY:\n❌ Delete ALL user data (cannot be recovered)\n❌ Cancel active subscriptions and billing\n❌ Remove complete call history (${user.totalCalls} calls)\n❌ Delete ${user.minutesUsed} minutes of usage data\n❌ Revoke all API access and tokens\n❌ Remove from all reports and analytics\n\n⚠️ THIS CANNOT BE UNDONE!\n\nAre you absolutely sure you want to delete this user?`;
    
    const confirmed = confirm(confirmMessage);
    
    if (confirmed) {
      // Double confirmation with typed verification
      const verificationText = `DELETE-${user.name.split(' ')[0].toUpperCase()}`;
      const doubleConfirm = prompt(`🔐 FINAL CONFIRMATION REQUIRED\n\nTo prevent accidental deletion, please type exactly:\n\n${verificationText}\n\n(This will delete ${user.name} permanently)`);
      
      if (doubleConfirm === verificationText) {
        setActionLoading(`delete-${user.id}`);
        
        try {
          if (USE_MOCK_DATA) {
            // Simulate API delay for deletion
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Remove user locally for mock data and update stats
            setData(prev => {
              if (!prev) return prev;
              
              // Update stats based on deleted user
              const updatedStats = { ...prev };
              updatedStats.totalUsers = prev.totalUsers - 1;
              
              if (user.status === 'active') {
                updatedStats.activeUsers = Math.max(0, prev.activeUsers - 1);
              } else if (user.status === 'banned') {
                updatedStats.bannedUsers = Math.max(0, prev.bannedUsers - 1);
              }
              
              return {
                ...updatedStats,
                users: prev.users.filter(u => u.id !== user.id)
              };
            });
          } else {
            // Real API call
            await deleteUserAPI(user.id);
            // Refresh the data after API call
            const updatedData = await fetchUsersFromAPI();
            setData(updatedData);
            
            console.log('Successfully deleted user via API');
          }
          
          // Success notification
          alert(`🗑️ User Deleted Successfully\n\n${user.name} has been permanently removed from the system.\n\n📊 Summary:\n• User data: Deleted\n• Call history: Removed (${user.totalCalls} calls)\n• Usage data: Cleared (${user.minutesUsed} minutes)\n• Billing: Cancelled\n\nThis action has been logged for security audit.`);
          
        } catch (error) {
          console.error('Error deleting user:', error);
          
          const errorMessage = `❌ Deletion Failed\n\nUnable to delete ${user.name}.\n\nPossible reasons:\n• Network connection issue\n• User has active sessions\n• Database constraints\n• Permission denied\n\nPlease try again or contact system administrator.`;
          
          alert(errorMessage);
        } finally {
          setActionLoading(null);
        }
      } else {
        alert(`🚫 Deletion Cancelled\n\nIncorrect verification text entered.\nExpected: ${verificationText}\nReceived: ${doubleConfirm || '(empty)'}\n\nUser ${user.name} was NOT deleted.`);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220]">
      <div className="max-w-7xl mx-auto px-4 py-25 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
              <Users className="h-8 w-8 text-gray-600 dark:text-gray-300" />
              User Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage all users in the system, view their activity, and control access
            </p>
          </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Export users data as CSV
              const csvData = filteredUsers.map(user => ({
                Name: user.name,
                Email: user.email,
                Role: user.role,
                Status: user.status,
                Company: user.company || '',
                'Total Calls': user.totalCalls,
                'Minutes Used': user.minutesUsed,
                Plan: user.currentPlan,
                'Joined Date': formatDate(user.joinedAt),
                'Last Login': user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'
              }));
              
              const csvContent = [
                Object.keys(csvData[0]).join(','),
                ...csvData.map(row => Object.values(row).join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition-colors text-gray-700 dark:text-gray-200"
          >
            📊 Export CSV
          </button>
          {/* <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link> */}
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm transition-colors text-gray-700 dark:text-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={data.totalUsers}
            icon={Users}
            change="+12%"
            changeType="positive"
          />
          <StatsCard
            title="Active Users"
            value={data.activeUsers}
            icon={CheckCircle}
            change="+5%"
            changeType="positive"
          />
          <StatsCard
            title="New This Month"
            value={data.stats.newUsersThisMonth}
            icon={Calendar}
            change="+25%"
            changeType="positive"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${data.stats.totalRevenue.toLocaleString()}`}
            icon={Shield}
            change="+18%"
            changeType="positive"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users by name, email, or company..."
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
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Failed to Load Users</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                      <p className="text-lg font-medium mb-2">No users found</p>
                      <p>Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2 text-white font-semibold text-xs w-8 h-8 flex items-center justify-center">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">{user.email}</div>
                            {user.company && (
                              <div className="text-gray-500 dark:text-gray-500 text-xs">{user.company}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-white">{user.totalCalls} calls</div>
                          <div className="text-gray-600 dark:text-gray-400">{user.minutesUsed} min used</div>
                          {user.lastLoginAt && (
                            <div className="text-gray-500 dark:text-gray-500">Last: {formatDateTime(user.lastLoginAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-white">{user.currentPlan}</div>
                          <div className={`${
                            user.billingStatus === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 
                            user.billingStatus === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {user.billingStatus}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {formatDate(user.joinedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <UserActionsDropdown
                          user={user}
                          onView={handleViewUser}
                          onEdit={handleEditUser}
                          onBan={handleBanUser}
                          onDelete={handleDeleteUser}
                          actionLoading={actionLoading}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results summary */}
      {data && (
        <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="text-gray-900 dark:text-white font-medium">{filteredUsers.length}</span> of <span className="text-gray-900 dark:text-white font-medium">{data.totalUsers}</span> users
              {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (filtered)
                </span>
              )}
            </div>
            
            <div className="flex gap-6 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>{data.activeUsers} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span>{data.users.filter(u => u.status === 'inactive').length} Inactive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>{data.bannedUsers} Banned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>{data.users.filter(u => u.status === 'pending').length} Pending</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0E1627] p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => alert('This would open a bulk import dialog to upload users from CSV/Excel files.')}
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-600/20">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Bulk Import</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Upload CSV file</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              const inactiveUsers = data?.users.filter(u => u.status === 'inactive').length || 0;
              if (inactiveUsers > 0) {
                const confirmed = confirm(`🚫 Bulk Ban Inactive Users\n\nThis will ban ${inactiveUsers} inactive users.\n\nInactive users haven't logged in recently and may be abandoned accounts.\n\nContinue with bulk ban?`);
                if (confirmed) {
                  alert(`This would ban ${inactiveUsers} inactive users. Feature will be implemented with API integration.`);
                }
              } else {
                alert('No inactive users found to ban.');
              }
            }}
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-600/20">
              <Ban className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Bulk Ban</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ban inactive users</div>
            </div>
          </button>
          
          <button
            onClick={() => alert('This would show analytics about user activity, growth trends, and usage patterns.')}
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-600/20">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Analytics</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">View insights</div>
            </div>
          </button>
          
          <button
            onClick={() => alert('This would open system settings for user management, default permissions, and security policies.')}
            className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-600/20">
              <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Settings</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Configure system</div>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
