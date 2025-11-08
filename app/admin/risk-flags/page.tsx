'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  AlertTriangle, Shield, Eye, CheckCircle, XCircle, Clock,
  User, MessageSquare, Filter, Search, RefreshCw, Download,
  ChevronDown, ChevronUp, Flag, AlertOctagon, Info, Ban
} from 'lucide-react';
import { axiosInstance } from '../../../utils/axiosInstance';

interface RiskFlag {
  id: string;
  call_id: string;
  customer_name: string;
  agent_name: string;
  flagged_content: string;
  risk_category: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string;
  auto_blocked: boolean;
  status: 'pending' | 'approved' | 'blocked';
}

const RISK_CATEGORIES = {
  profanity: { label: 'Profanity', color: '#ef4444', icon: Ban },
  legal_claim: { label: 'Legal Claims', color: '#f59e0b', icon: AlertOctagon },
  medical_advice: { label: 'Medical Advice', color: '#dc2626', icon: AlertTriangle },
  personal_info_leak: { label: 'Personal Info Leak', color: '#b91c1c', icon: Shield },
  false_urgency: { label: 'False Urgency', color: '#f97316', icon: Clock },
  competitor_defamation: { label: 'Competitor Defamation', color: '#ea580c', icon: Flag },
  financial_advice: { label: 'Financial Advice', color: '#d97706', icon: AlertTriangle },
  discriminatory_language: { label: 'Discriminatory', color: '#dc2626', icon: XCircle },
  unsubstantiated_claim: { label: 'Unsubstantiated Claims', color: '#f59e0b', icon: Info }
};

const RISK_LEVELS = {
  low: { label: 'Low', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  high: { label: 'High', color: '#ef4444', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  critical: { label: 'Critical', color: '#dc2626', bgColor: 'bg-red-100', textColor: 'text-red-800' }
};

const RiskFlagsAdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<RiskFlag[]>([]);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Review modal
  const [reviewingFlag, setReviewingFlag] = useState<RiskFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'block'>('approve');

  useEffect(() => {
    fetchRiskFlags();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [flags, statusFilter, levelFilter, categoryFilter, searchQuery, dateRange]);

  const fetchRiskFlags = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/hume-twilio/analytics/risk-flags/');
      setFlags(response.data);
    } catch (error) {
      console.error('Error fetching risk flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...flags];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(f => f.risk_level === levelFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.risk_category === categoryFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.flagged_content.toLowerCase().includes(query) ||
        f.customer_name.toLowerCase().includes(query) ||
        f.agent_name.toLowerCase().includes(query)
      );
    }

    // Date range
    if (dateRange.start) {
      filtered = filtered.filter(f => new Date(f.detected_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(f => new Date(f.detected_at) <= new Date(dateRange.end));
    }

    setFilteredFlags(filtered);
  };

  const handleReview = async () => {
    if (!reviewingFlag) return;

    try {
      await axiosInstance.post(`/api/hume-twilio/analytics/risk-flags/${reviewingFlag.id}/review/`, {
        action: reviewAction,
        notes: reviewNotes
      });
      
      // Update local state
      setFlags(flags.map(f => 
        f.id === reviewingFlag.id 
          ? { ...f, status: reviewAction === 'approve' ? 'approved' : 'blocked', review_notes: reviewNotes }
          : f
      ));
      
      setReviewingFlag(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error reviewing flag:', error);
      alert('Error submitting review. Please try again.');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-4 rounded-full" style={{ backgroundColor: color + '20' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin" size={48} />
      </div>
    );
  }

  const stats = {
    total: flags.length,
    pending: flags.filter(f => f.status === 'pending').length,
    autoBlocked: flags.filter(f => f.auto_blocked).length,
    critical: flags.filter(f => f.risk_level === 'critical').length
  };

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Shield size={36} /> Risk Flags Admin Dashboard
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Review and manage flagged content for safety compliance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Flag} label="Total Flags" value={stats.total} color="#3b82f6" />
        <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="#f59e0b" />
        <StatCard icon={Ban} label="Auto-Blocked" value={stats.autoBlocked} color="#ef4444" />
        <StatCard icon={AlertOctagon} label="Critical Risk" value={stats.critical} color="#dc2626" />
      </div>

      {/* Filters */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h2 className="text-xl font-bold">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <option value="all">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <option value="all">All Categories</option>
            {Object.entries(RISK_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
            placeholder="End Date"
          />
        </div>
        
        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by content, customer, or agent..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
          />
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={fetchRiskFlags}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => {
              setStatusFilter('all');
              setLevelFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
              setDateRange({ start: '', end: '' });
            }}
            className={`px-6 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredFlags.length} of {flags.length} flags
        </p>
      </div>

      {/* Flags Table */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
        {filteredFlags.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold">No risk flags found</p>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <tr>
                  <th className="p-4 text-left">Detected</th>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Level</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Content Preview</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => (
                  <React.Fragment key={flag.id}>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} hover:bg-opacity-50 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(flag.detected_at).toLocaleDateString()}
                          <br />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {new Date(flag.detected_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{flag.customer_name}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Agent: {flag.agent_name}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {React.createElement(RISK_CATEGORIES[flag.risk_category as keyof typeof RISK_CATEGORIES]?.icon || Info, {
                            size: 16,
                            style: { color: RISK_CATEGORIES[flag.risk_category as keyof typeof RISK_CATEGORIES]?.color }
                          })}
                          <span className="text-sm">
                            {RISK_CATEGORIES[flag.risk_category as keyof typeof RISK_CATEGORIES]?.label || flag.risk_category}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${RISK_LEVELS[flag.risk_level].bgColor} ${RISK_LEVELS[flag.risk_level].textColor}`}>
                          {RISK_LEVELS[flag.risk_level].label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {flag.status === 'pending' && <Clock size={16} className="text-yellow-500" />}
                          {flag.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                          {flag.status === 'blocked' && <XCircle size={16} className="text-red-500" />}
                          <span className="capitalize">{flag.status}</span>
                          {flag.auto_blocked && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              Auto-blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-sm truncate">{flag.flagged_content}</p>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setExpandedFlag(expandedFlag === flag.id ? null : flag.id)}
                          className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          {expandedFlag === flag.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedFlag === flag.id && (
                      <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <td colSpan={7} className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-bold mb-2">Full Flagged Content:</h3>
                              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                                <p className="italic">"{flag.flagged_content}"</p>
                              </div>
                            </div>

                            {flag.review_notes && (
                              <div>
                                <h3 className="font-bold mb-2">Review Notes:</h3>
                                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                                  <p>{flag.review_notes}</p>
                                  {flag.reviewed_by && (
                                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Reviewed by {flag.reviewed_by} on {new Date(flag.reviewed_at!).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {flag.status === 'pending' && (
                              <div className="flex gap-4">
                                <button
                                  onClick={() => {
                                    setReviewingFlag(flag);
                                    setReviewAction('approve');
                                  }}
                                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                  <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingFlag(flag);
                                    setReviewAction('block');
                                  }}
                                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                  <Ban size={16} /> Block
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingFlag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-2xl w-full mx-4`}>
            <h2 className="text-2xl font-bold mb-4">
              {reviewAction === 'approve' ? '✅ Approve Flag' : '🚫 Block Content'}
            </h2>
            
            <div className="mb-4">
              <p className="font-semibold mb-2">Flagged Content:</p>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="italic">"{reviewingFlag.flagged_content}"</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-semibold mb-2">Review Notes:</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                className={`w-full p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} min-h-[120px]`}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReview}
                className={`px-6 py-3 text-white rounded-lg font-semibold ${
                  reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : 'Block'}
              </button>
              <button
                onClick={() => {
                  setReviewingFlag(null);
                  setReviewNotes('');
                }}
                className={`px-6 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskFlagsAdminDashboard;
