'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, User, Calendar, Filter, Search, Play, Download, History, ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Types for call history data (mapped from API)
type CallDirection = 'inbound' | 'outbound';
type CallStatus = 'answered' | 'completed' | 'missed' | 'no-answer' | 'busy' | 'failed' | 'voicemail' | 'queued' | 'initiated' | 'in-progress';

interface CallHistory {
  id: string;
  call_sid: string;
  direction: CallDirection;
  direction_badge: string;
  caller_number?: string; // For inbound calls
  recipient_number?: string; // For outbound calls
  caller_name?: string;
  recipient_name?: string;
  agent_name?: string;
  status: CallStatus;
  duration: number; // in seconds
  start_time: string; // ISO string
  end_time?: string; // ISO string
  created_at: string;
  transcript_available: boolean;
  total_messages: number;
  notes?: string;
  location?: string;
  purpose?: string; // For outbound calls
  outcome?: string; // For outbound calls
}

// Helper function to map API call status to component status
function mapApiStatus(apiStatus: string): CallStatus {
  switch (apiStatus.toLowerCase()) {
    case 'completed': return 'completed';
    case 'in_progress': return 'in-progress';
    case 'in-progress': return 'in-progress';
    case 'queued': return 'queued';
    case 'initiated': return 'initiated';
    case 'busy': return 'busy';
    case 'no-answer': return 'no-answer';
    case 'failed': return 'failed';
    case 'answered': return 'answered';
    case 'missed': return 'missed';
    case 'voicemail': return 'voicemail';
    default: return 'failed';
  }
}

// Helper function to determine call direction from API data
function mapApiDirection(directionBadge: string): CallDirection {
  if (directionBadge.includes('Inbound') || directionBadge.includes('📞') === false) {
    return 'inbound';
  }
  return 'outbound';
}

// Helper function to determine call purpose (since API doesn't provide this directly)
function determinePurpose(agentName: string, direction: CallDirection): string {
  if (direction === 'inbound') {
    return 'Support'; // Most inbound calls are support
  }
  // For outbound calls
  if (agentName?.toLowerCase().includes('sales') || agentName?.toLowerCase().includes('lead')) {
    return 'Sales';
  }
  if (agentName?.toLowerCase().includes('support')) {
    return 'Support';
  }
  return 'Sales'; // Default outbound calls to sales
}

// Helper function to map API call to CallHistory
function mapApiCallToHistory(apiCall: ApiCall): CallHistory {
  const direction = mapApiDirection(apiCall.direction_badge);
  
  return {
    id: apiCall.call_sid,
    call_sid: apiCall.call_sid,
    direction,
    direction_badge: apiCall.direction_badge,
    caller_number: direction === 'inbound' ? apiCall.from : undefined,
    recipient_number: direction === 'outbound' ? apiCall.to : undefined,
    caller_name: direction === 'inbound' ? apiCall.customer.name || undefined : undefined,
    recipient_name: direction === 'outbound' ? apiCall.customer.name || undefined : undefined,
    agent_name: apiCall.agent.name,
    status: mapApiStatus(apiCall.status),
    duration: apiCall.duration || 0,
    start_time: apiCall.start_time || apiCall.created_at,
    end_time: apiCall.end_time || undefined,
    created_at: apiCall.created_at,
    transcript_available: apiCall.transcript.total_messages > 0,
    total_messages: apiCall.transcript.total_messages,
    notes: apiCall.transcript.preview.length > 0 ? 
      apiCall.transcript.preview.slice(0, 2).map(p => p.message).join(' | ') : undefined,
    purpose: determinePurpose(apiCall.agent.name, direction),
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

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusColor(status: CallStatus, theme?: string): string {
  const isDark = theme === 'dark';
  switch (status) {
    case 'answered':
    case 'completed': return isDark ? 'bg-emerald-600/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    case 'missed':
    case 'no-answer': return isDark ? 'bg-yellow-600/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
    case 'busy': return isDark ? 'bg-orange-600/30 text-orange-300' : 'bg-orange-100 text-orange-700';
    case 'failed': return isDark ? 'bg-red-600/30 text-red-300' : 'bg-red-100 text-red-700';
    case 'voicemail': return isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'in-progress': return isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'queued': return isDark ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'initiated': return isDark ? 'bg-indigo-600/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
    default: return isDark ? 'bg-gray-600/30 text-gray-300' : 'bg-gray-100 text-gray-700';
  }
}

function getDirectionIcon(direction: CallDirection, directionBadge?: string) {
  if (direction === 'inbound') {
    return <ArrowDownLeft className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
  } else {
    return <ArrowUpRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
  }
}

function getDirectionDisplay(direction: CallDirection, directionBadge: string) {
  return directionBadge || (direction === 'inbound' ? '📞 Inbound' : '📞 Outbound');
}

export default function CallHistoryPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<CallDirection | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [limit, setLimit] = useState(10); // Initial 10 records per page
  const [totalPages, setTotalPages] = useState(0);
  const [paginatedCalls, setPaginatedCalls] = useState<CallHistory[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load call history from API
  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching call history data...');
      
      const offset = (currentPage - 1) * limit;
      const response = await axiosInstance.get('/api/hume-twilio/get-all-calls/', {
        params: { limit, offset }
      });
      console.log('Call history API response:', response.data);
      
      if (response.data && response.data.success && response.data.calls) {
        const mappedCalls = response.data.calls.map(mapApiCallToHistory);
        console.log('Mapped call history data:', mappedCalls);
        
        setCalls(mappedCalls);
        setTotalCalls(response.data.total || 0);
        const calculatedPages = Math.ceil((response.data.total || 0) / limit);
        setTotalPages(calculatedPages);
        
        console.log('Pagination Debug:', {
          totalCalls: response.data.total,
          limit,
          calculatedPages,
          currentPage
        });
      } else {
        console.error('Unexpected API response structure:', response.data);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      setError('Failed to fetch call history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadCalls = async () => {
      if (!mounted) return;
      await fetchCalls();
    };

    loadCalls();

    return () => {
      mounted = false;
    };
  }, [currentPage, limit]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Filter calls based on search, status, and direction (client-side filtering on paginated results)
  useEffect(() => {
    let filtered = calls;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.caller_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.recipient_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.outcome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.call_sid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    // Filter by direction
    if (directionFilter !== 'all') {
      filtered = filtered.filter(call => call.direction === directionFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, directionFilter]);

  const handleRefresh = async () => {
    await fetchCalls();
  };

  // Calculate stats
  const inboundCalls = calls.filter(c => c.direction === 'inbound').length;
  const outboundCalls = calls.filter(c => c.direction === 'outbound').length;
  const answeredCalls = calls.filter(c => c.status === 'answered' || c.status === 'completed').length;
  const totalDuration = calls.filter(c => c.duration > 0).reduce((sum, c) => sum + c.duration, 0);
  const avgDuration = totalDuration / (calls.filter(c => c.duration > 0).length || 1);

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
              <History className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              Call History
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Complete history of all inbound and outbound calls. Total: {filteredCalls.length} calls
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
              placeholder="Search by name, number, agent, or outcome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as CallDirection | 'all')}
              className="bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CallStatus | 'all')}
            className="bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="answered">Answered</option>
            <option value="in-progress">In Progress</option>
            <option value="queued">Queued</option>
            <option value="initiated">Initiated</option>
            <option value="missed">Missed</option>
            <option value="no-answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="failed">Failed</option>
            <option value="voicemail">Voicemail</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm">
            <p className="font-medium text-red-800 dark:text-red-100">Failed to load call history</p>
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
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-18 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div>
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-6 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
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
            </>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inbound</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{inboundCalls}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Outbound</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{outboundCalls}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Answered</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{answeredCalls}</p>
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
            </>
          )}
        </div>

        {/* Calls Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading call history...
                    </td>
                  </tr>
                ) : filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No calls found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr key={call.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          {getDirectionIcon(call.direction, call.direction_badge)}
                          <div>
                            <div className="capitalize font-medium">{call.direction}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {getDirectionDisplay(call.direction, call.direction_badge)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {call.direction === 'inbound' 
                              ? (call.caller_name || 'Unknown') 
                              : (call.recipient_name || 'Unknown')
                            }
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {call.direction === 'inbound' ? call.caller_number : call.recipient_number}
                          </div>
                          {call.location && (
                            <div className="text-gray-400 dark:text-gray-500 text-xs">{call.location}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">{call.agent_name || '-'}</div>
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
                        <div className="text-gray-700 dark:text-gray-300">{formatTime(call.start_time)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300 text-xs max-w-32 truncate" title={call.notes || call.outcome}>
                          {call.notes || call.outcome || '-'}
                        </div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs font-mono mt-1">
                          ID: {call.call_sid.substring(0, 8)}...
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

        {/* Pagination Controls */}
        {totalCalls > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCalls)} of {totalCalls} calls
              </span>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 rounded-md text-sm border ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Notes Section */}
        {filteredCalls.some(call => call.notes) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Recent Call Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalls
                .filter(call => call.notes)
                .slice(0, 6)
                .map(call => (
                  <div key={call.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(call.direction, call.direction_badge)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {call.direction === 'inbound' 
                              ? (call.caller_name || call.caller_number) 
                              : (call.recipient_name || call.recipient_number)
                            }
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formatTime(call.start_time)} • {call.agent_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {call.call_sid.substring(0, 10)}...
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getStatusColor(call.status, theme)}`}>
                        {call.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{call.notes}</p>
                    {call.outcome && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Outcome: {call.outcome}</div>
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