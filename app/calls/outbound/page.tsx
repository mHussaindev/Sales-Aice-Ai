'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, PhoneOutgoing, Clock, User, Calendar, Filter, Search, Play, Download, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { axiosInstance } from '../../../utils/axiosInstance';

// Types for API response
interface ApiCallResponse {
  success: boolean;
  total: number;
  limit: number;
  calls: ApiCall[];
  data_source: string;
}

interface ApiCall {
  call_sid: string;
  status: string;
  direction: string;
  direction_badge: string;
  from: string;
  to: string;
  duration: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  agent: {
    id: string;
    name: string;
    config_id: string;
  };
  customer: {
    name: string | null;
    email: string | null;
    phone: string;
  };
  transcript: {
    preview: Array<{
      role: string;
      message: string;
      timestamp: string;
    }>;
    total_messages: number;
    has_more: boolean;
  };
  data_source: string;
}

// Types for outbound call data (mapped from API)
type CallStatus = 'completed' | 'no-answer' | 'busy' | 'failed' | 'in-progress' | 'scheduled' | 'queued' | 'initiated';
type CallPurpose = 'sales' | 'follow-up' | 'support' | 'survey' | 'appointment' | 'other';

interface OutboundCall {
  id: string;
  recipient_number: string;
  recipient_name?: string;
  agent_name?: string;
  purpose: CallPurpose;
  status: CallStatus;
  duration: number; // in seconds
  start_time?: string; // ISO string (optional for scheduled calls)
  end_time?: string; // ISO string
  scheduled_time?: string; // ISO string for scheduled calls
  recording_url?: string;
  notes?: string;
  lead_source?: string;
  follow_up_required?: boolean;
  outcome?: string;
  call_sid: string;
  created_at: string;
  transcript_available: boolean;
  total_messages: number;
}

// Helper function to map API call status to component status
function mapApiStatus(apiStatus: string): CallStatus {
  switch (apiStatus.toLowerCase()) {
    case 'completed': return 'completed';
    case 'in_progress': return 'in-progress';
    case 'in-progress': return 'in-progress';
    case 'queued': return 'scheduled';
    case 'initiated': return 'in-progress';
    case 'busy': return 'busy';
    case 'no-answer': return 'no-answer';
    case 'failed': return 'failed';
    default: return 'failed';
  }
}

// Helper function to determine call purpose (since API doesn't provide this directly)
function determinePurpose(agentName: string, direction: string): CallPurpose {
  // This is a simple heuristic - you might want to enhance this based on your business logic
  if (agentName?.toLowerCase().includes('sales') || agentName?.toLowerCase().includes('lead')) {
    return 'sales';
  }
  if (agentName?.toLowerCase().includes('support')) {
    return 'support';
  }
  if (direction.includes('outbound')) {
    return 'sales'; // Default outbound calls to sales
  }
  return 'other';
}

// Helper function to map API call to OutboundCall
function mapApiCallToOutboundCall(apiCall: ApiCall): OutboundCall {
  return {
    id: apiCall.call_sid,
    call_sid: apiCall.call_sid,
    recipient_number: apiCall.to,
    recipient_name: apiCall.customer.name || undefined,
    agent_name: apiCall.agent.name,
    purpose: determinePurpose(apiCall.agent.name, apiCall.direction),
    status: mapApiStatus(apiCall.status),
    duration: apiCall.duration || 0,
    start_time: apiCall.start_time || undefined,
    end_time: apiCall.end_time || undefined,
    created_at: apiCall.created_at,
    transcript_available: apiCall.transcript.total_messages > 0,
    total_messages: apiCall.transcript.total_messages,
    notes: apiCall.transcript.preview.length > 0 ? 
      apiCall.transcript.preview.slice(0, 2).map(p => p.message).join(', ') : undefined,
    follow_up_required: apiCall.status === 'queued' || apiCall.status === 'failed',
    outcome: apiCall.status === 'completed' ? 'Call Completed' : 
             apiCall.status === 'queued' ? 'Waiting to Connect' :
             apiCall.status === 'in_progress' ? 'Call in Progress' : 
             'Call ' + apiCall.status
  };
}

// Helper functions
function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMs < 0) {
    // Future time (scheduled)
    const futureDiffHours = Math.floor(-diffMs / (1000 * 60 * 60));
    const futureDiffMinutes = Math.floor(-diffMs / (1000 * 60));
    if (futureDiffMinutes < 60) return `in ${futureDiffMinutes}m`;
    if (futureDiffHours < 24) return `in ${futureDiffHours}h`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusColor(status: CallStatus, theme?: string): string {
  const isDark = theme === 'dark';
  switch (status) {
    case 'completed': return isDark ? 'bg-emerald-600/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    case 'no-answer': return isDark ? 'bg-yellow-600/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
    case 'busy': return isDark ? 'bg-orange-600/30 text-orange-300' : 'bg-orange-100 text-orange-700';
    case 'failed': return isDark ? 'bg-red-600/30 text-red-300' : 'bg-red-100 text-red-700';
    case 'in-progress': return isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'scheduled': return isDark ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'queued': return isDark ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'initiated': return isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    default: return isDark ? 'bg-gray-600/30 text-gray-300' : 'bg-gray-100 text-gray-700';
  }
}

function getPurposeColor(purpose: CallPurpose, theme?: string): string {
  const isDark = theme === 'dark';
  switch (purpose) {
    case 'sales': return isDark ? 'bg-green-600/20 text-green-300' : 'bg-green-100 text-green-700';
    case 'follow-up': return isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'support': return isDark ? 'bg-orange-600/20 text-orange-300' : 'bg-orange-100 text-orange-700';
    case 'survey': return isDark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'appointment': return isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
    case 'other': return isDark ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700';
    default: return isDark ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700';
  }
}

export default function OutboundCallsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [calls, setCalls] = useState<OutboundCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<OutboundCall[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  const [purposeFilter, setPurposeFilter] = useState<CallPurpose | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [limit, setLimit] = useState(25); // Calls per page
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load outbound calls from API
  useEffect(() => {
    let mounted = true;

    const loadCalls = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate offset for pagination
        const offset = (currentPage - 1) * limit;
        
        // Call the API to get all calls with pagination
        const response = await axiosInstance.get<ApiCallResponse>(
          `/api/hume-twilio/get-all-calls/?limit=${limit * 10}&offset=${offset}`
        );
        
        if (!mounted) return;
        
        if (response.data.success) {
          // Filter only outbound calls and map to our format
          const outboundCalls = response.data.calls
            .filter(call => call.direction_badge === '📞 Outbound')
            .map(mapApiCallToOutboundCall);
          
          setCalls(outboundCalls);
          setTotalCalls(response.data.total);
          
          // Calculate total pages based on outbound calls
          const outboundTotal = Math.ceil(response.data.total * 0.7); // Estimate 70% are outbound
          setTotalPages(Math.ceil(outboundTotal / limit));
        } else {
          throw new Error('Failed to fetch calls from API');
        }

      } catch (e: any) {
        if (!mounted) return;
        console.error('Error loading calls:', e);
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load outbound calls');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCalls();
    return () => { mounted = false; };
  }, [currentPage, limit]);

  // Filter calls based on search, status, and purpose
  useEffect(() => {
    let filtered = calls;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.recipient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.outcome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.call_sid.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    // Filter by purpose
    if (purposeFilter !== 'all') {
      filtered = filtered.filter(call => call.purpose === purposeFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, purposeFilter]);

  const handleNewCall = () => {
    console.log('Creating new outbound call');
    alert('New outbound call feature - would open call creation form');
  };

  const handleRefresh = () => {
    // Trigger a reload of the data by forcing the useEffect to run again
    setCalls([]);
    setLoading(true);
    
    // Trigger the useEffect by changing state
    const loadCalls = async () => {
      try {
        setError(null);
        
        const offset = (currentPage - 1) * limit;
        const response = await axiosInstance.get<ApiCallResponse>(
          `/api/hume-twilio/get-all-calls/?limit=${limit * 10}&offset=${offset}`
        );
        
        if (response.data.success) {
          const outboundCalls = response.data.calls
            .filter(call => call.direction_badge === '📞 Outbound')
            .map(mapApiCallToOutboundCall);
          
          setCalls(outboundCalls);
          setTotalCalls(response.data.total);
          
          const outboundTotal = Math.ceil(response.data.total * 0.7);
          setTotalPages(Math.ceil(outboundTotal / limit));
        } else {
          throw new Error('Failed to fetch calls from API');
        }
      } catch (e: any) {
        console.error('Error loading calls:', e);
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load outbound calls');
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, purposeFilter, searchTerm, limit]);

  // Calculate stats
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const totalDuration = calls.filter(c => c.duration > 0).reduce((sum, c) => sum + c.duration, 0);
  const avgDuration = totalDuration / (calls.filter(c => c.duration > 0).length || 1);
  const successRate = ((completedCalls / calls.filter(c => c.status !== 'scheduled').length) * 100) || 0;

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-white p-6 py-25">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <PhoneOutgoing className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              Outbound Calls
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage outgoing calls and track performance. 
              Showing {filteredCalls.length} of {totalCalls} total calls (Page {currentPage} of {totalPages})
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleNewCall}
              className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm flex items-center gap-2 text-white"
            >
              <Plus className="h-4 w-4" />
              New Call
            </button>
            <Link 
              href="/dashboard" 
              className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by recipient, agent, call ID, or outcome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CallStatus | 'all')}
              className="bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="queued">Queued</option>
              <option value="initiated">Initiated</option>
              <option value="no-answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Purpose Filter */}
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value as CallPurpose | 'all')}
            className="bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Purpose</option>
            <option value="sales">Sales</option>
            <option value="follow-up">Follow-up</option>
            <option value="support">Support</option>
            <option value="survey">Survey</option>
            <option value="appointment">Appointment</option>
            <option value="other">Other</option>
          </select>

          {/* Quick page navigation for mobile */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="p-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-16 text-center">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="p-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm">
            <p className="font-medium text-red-800 dark:text-red-100">Failed to load outbound calls</p>
            <p className="mt-1 text-red-700 dark:text-red-200/80">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Outbound</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{calls.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{completedCalls}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatDuration(Math.round(avgDuration))}</p>
                  </div>
                </div>      
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>        {/* Calls Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Call ID</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading calls...
                      </div>
                    </td>
                  </tr>
                ) : filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {calls.length === 0 ? 'No outbound calls found.' : 'No calls found matching your criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr key={call.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{call.recipient_name || 'Unknown'}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">{call.recipient_number}</div>
                          {call.lead_source && (
                            <div className="text-gray-400 dark:text-gray-500 text-xs">via {call.lead_source}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">{call.agent_name || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPurposeColor(call.purpose, theme)}`}>
                          {call.purpose}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(call.status, theme)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">{formatDuration(call.duration)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">
                          {call.start_time 
                            ? formatTime(call.start_time)
                            : formatTime(call.created_at)
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300 text-xs font-mono">
                          {call.call_sid.substring(0, 8)}...
                        </div>
                        {call.transcript_available && (
                          <div className="text-blue-600 dark:text-blue-400 text-xs">
                            {call.total_messages} messages
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {call.transcript_available && call.total_messages > 0 && (
                            <button
                              onClick={() => console.log('View transcript for call:', call.call_sid)}
                              className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-400/10 rounded"
                              title={`View transcript (${call.total_messages} messages)`}
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => console.log('Export call details:', call.call_sid)}
                            className="p-1 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-400/10 rounded"
                            title="Export call details"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Page {currentPage} of {totalPages} • Total: {totalCalls} calls
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={loading}
                className="bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>
        )}

        {/* Follow-up Required Section */}
        {filteredCalls.some(call => call.follow_up_required) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Follow-up Required
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalls
                .filter(call => call.follow_up_required)
                .slice(0, 6)
                .map(call => (
                  <div key={call.id} className="rounded-lg border border-yellow-300 dark:border-yellow-700/30 bg-yellow-50 dark:bg-yellow-900/10 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {call.recipient_name || call.recipient_number}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {formatTime(call.start_time || call.created_at)} • {call.agent_name}
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          {call.purpose} - {call.outcome}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          ID: {call.call_sid.substring(0, 10)}...
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getStatusColor(call.status, theme)}`}>
                        {call.status}
                      </span>
                    </div>
                    {call.notes && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 truncate">{call.notes}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}