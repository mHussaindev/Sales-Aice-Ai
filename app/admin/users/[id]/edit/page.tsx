/**
 * Admin Edit User Page
 * 
 * This page allows administrators to edit and update user information.
 * 
 * Features:
 * - Edit personal information (name, email, phone, company)
 * - Update user role and permissions
 * - Change subscription plan
 * - Modify account status
 * - View and update billing information
 * - Activity and usage statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Crown,
  Shield,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Activity,
  Clock,
  Users,
  Edit3,
  RefreshCcw
} from 'lucide-react';
//import { axiosInstance } from '../../../../utils/axiosInstance';
import { useTheme } from 'next-themes';
import { axiosInstance } from '@/utils/axiosInstance';

// Types
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

interface EditUserFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  currentPlan: string;
  billingStatus: string;
  bio: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}



const availablePlans = [
  'Basic - 500 min',
  'Pro - 2000 min',
  'Enterprise - Unlimited',
  'Custom Plan'
];

const timezones = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Australia/Sydney'
];

const languages = [
  'English',
  'Spanish', 
  'French',
  'German',
  'Japanese',
  'Chinese',
  'Arabic'
];

// Helper Functions
function formatDate(dateISO: string) {
  return new Date(dateISO).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusColor(status: UserStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'banned':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    case 'pending':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
  }
}

// Main Component
export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditUserFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'user',
    status: 'active',
    currentPlan: '',
    billingStatus: '',
    bio: '',
    timezone: '',
    language: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if userData is passed in URL parameters
        const userDataParam = searchParams.get('userData');
        if (userDataParam) {
          try {
            const passedUserData = JSON.parse(decodeURIComponent(userDataParam)) as User;
            
            // Set user data immediately from passed parameters
            setUser(passedUserData);
            
            // Initialize form data with passed user data
            setFormData({
              name: passedUserData.name,
              email: passedUserData.email,
              phone: passedUserData.phone || '',
              company: passedUserData.company || '',
              role: passedUserData.role,
              status: passedUserData.status,
              currentPlan: passedUserData.currentPlan,
              billingStatus: passedUserData.billingStatus,
              bio: passedUserData.profile?.bio || '',
              timezone: passedUserData.profile?.timezone || 'America/New_York',
              language: passedUserData.profile?.language || 'English',
              notifications: passedUserData.profile?.notifications || { email: true, sms: false, push: true }
            });
            
            setLoading(false);
            return; // Exit early since we have the data
          } catch (parseError) {
            console.error('Error parsing user data from URL:', parseError);
            // Continue with normal API fetch if URL data parsing fails
          }
        }

        // Fallback to API if no URL data
        // Real API call
        const response = await axiosInstance.get(`/api/accounts/admin/users/${parseInt(userId)}/`);
        const userData = response.data;
        setUser(userData);
        
        // Initialize form data
        setFormData({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          company: userData.company || '',
          role: userData.role,
          status: userData.status,
          currentPlan: userData.currentPlan,
          billingStatus: userData.billingStatus,
          bio: userData.profile?.bio || '',
          timezone: userData.profile?.timezone || 'America/New_York',
          language: userData.profile?.language || 'English',
          notifications: userData.profile?.notifications || { email: true, sms: false, push: true }
        });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, searchParams]);

  // Handle form input changes
  const handleInputChange = (field: keyof EditUserFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasChanges(true);
      return newData;
    });
  };

  // Handle notification changes
  const handleNotificationChange = (type: 'email' | 'sms' | 'push', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: checked
      }
    }));
    setHasChanges(true);
  };

  // Save user changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Real API call
      await axiosInstance.patch(`/api/accounts/admin/users/${parseInt(userId)}/`, formData);
      
      // Refresh user data
      //const response = await axiosInstance.get(`/api/admin/users/${parseInt(userId)}/`);
      //setUser(response.data);
      setHasChanges(false);
      
      router.push(`/admin/users`);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update user information');
      alert('Failed to update user information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset form to original values
  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company || '',
        role: user.role,
        status: user.status,
        currentPlan: user.currentPlan,
        billingStatus: user.billingStatus,
        bio: user.profile.bio || '',
        timezone: user.profile.timezone || 'America/New_York',
        language: user.profile.language || 'English',
        notifications: user.profile.notifications
      });
      setHasChanges(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen  bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load User
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit User: {user.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update user information and settings
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw className="h-4 w-4 mr-2 inline" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Summary Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white font-bold text-xl w-16 h-16 flex items-center justify-center">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Information
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <div className="text-gray-900 dark:text-white">{user.email}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Role:</span>
                  <div className="text-gray-900 dark:text-white capitalize">{user.role}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Plan:</span>
                  <div className="text-gray-900 dark:text-white">{user.currentPlan}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Joined:</span>
                  <div className="text-gray-900 dark:text-white">{formatDate(user.joinedAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Calls:</span>
                  <div className="text-gray-900 dark:text-white">{user.totalCalls}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Minutes:</span>
                  <div className="text-gray-900 dark:text-white">{user.minutesUsed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description about the user..."
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as UserStatus)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Plan
                </label>
                <select
                  value={formData.currentPlan}
                  onChange={(e) => handleInputChange('currentPlan', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availablePlans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Billing Status
                </label>
                <select
                  value={formData.billingStatus}
                  onChange={(e) => handleInputChange('billingStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notification Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive updates via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  SMS Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive updates via SMS
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications.sms}
                  onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Push Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive browser notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Edit3 className="h-5 w-5" />
            <span>You have unsaved changes</span>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 bg-white text-blue-600 hover:bg-gray-100 rounded text-sm font-medium"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}