'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, PhoneOutgoing, Clock, User, Calendar, Filter, Search, Play, Download, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
// import { axiosInstance } from '../../../utils/axiosInstance'; // Uncomment when API is ready

// Types for outbound call data
type CallStatus = 'completed' | 'no-answer' | 'busy' | 'failed' | 'in-progress' | 'scheduled';
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
}

// Mock data for outbound calls
const mockOutboundCalls: OutboundCall[] = [
  {
    id: 'out_001',
    recipient_number: '+1 (555) 234-5678',
    recipient_name: 'Alice Johnson',
    agent_name: 'David Martinez',
    purpose: 'sales',
    status: 'completed',
    duration: 480, // 8 minutes
    start_time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    end_time: new Date(Date.now() - 1000 * 60 * 37).toISOString(),
    recording_url: '/recordings/out_001.mp3',
    notes: 'Interested in Pro plan, scheduled demo for next week',
    lead_source: 'Website Form',
    follow_up_required: true,
    outcome: 'Demo Scheduled'
  },
  {
    id: 'out_002',
    recipient_number: '+1 (555) 345-6789',
    recipient_name: 'Michael Chen',
    agent_name: 'Jessica Taylor',
    purpose: 'follow-up',
    status: 'completed',
    duration: 320, // 5.3 minutes
    start_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    end_time: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    recording_url: '/recordings/out_002.mp3',
    notes: 'Customer renewed subscription, upgraded to Enterprise plan',
    lead_source: 'Existing Customer',
    follow_up_required: false,
    outcome: 'Sale Closed'
  },
  {
    id: 'out_003',
    recipient_number: '+1 (555) 456-7891',
    recipient_name: 'Sarah Williams',
    agent_name: 'Alex Rodriguez',
    purpose: 'sales',
    status: 'no-answer',
    duration: 0,
    start_time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    lead_source: 'Cold Outreach',
    follow_up_required: true,
    outcome: 'No Answer - Retry'
  },
  {
    id: 'out_004',
    recipient_number: '+1 (555) 567-8901',
    recipient_name: 'James Wilson',
    agent_name: 'Maria Garcia',
    purpose: 'support',
    status: 'completed',
    duration: 720, // 12 minutes
    start_time: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    end_time: new Date(Date.now() - 1000 * 60 * 168).toISOString(),
    recording_url: '/recordings/out_004.mp3',
    notes: 'Technical issue resolved, customer satisfied',
    lead_source: 'Support Ticket',
    follow_up_required: false,
    outcome: 'Issue Resolved'
  },
  {
    id: 'out_005',
    recipient_number: '+1 (555) 678-9012',
    recipient_name: 'Emma Davis',
    agent_name: 'Ryan Thompson',
    purpose: 'appointment',
    status: 'scheduled',
    duration: 0,
    scheduled_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    lead_source: 'Referral',
    follow_up_required: false,
    notes: 'Initial consultation call scheduled'
  },
  {
    id: 'out_006',
    recipient_number: '+1 (555) 789-0123',
    recipient_name: 'Daniel Brown',
    agent_name: 'Lisa Park',
    purpose: 'sales',
    status: 'busy',
    duration: 0,
    start_time: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    lead_source: 'LinkedIn',
    follow_up_required: true,
    outcome: 'Busy - Reschedule'
  },
  {
    id: 'out_007',
    recipient_number: '+1 (555) 890-1234',
    recipient_name: 'Sophie Anderson',
    agent_name: 'Kevin Lee',
    purpose: 'survey',
    status: 'completed',
    duration: 180, // 3 minutes
    start_time: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    end_time: new Date(Date.now() - 1000 * 60 * 297).toISOString(),
    recording_url: '/recordings/out_007.mp3',
    notes: 'Customer satisfaction survey completed, rating: 9/10',
    lead_source: 'Existing Customer',
    follow_up_required: false,
    outcome: 'Survey Completed'
  }
];

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
        
        // TODO: Replace with your actual API endpoint
        // const response = await axiosInstance.get<OutboundCall[]>('/api/calls/outbound/');
        // if (!mounted) return;
        // setCalls(response.data);

        // --- MOCK DATA for now (remove when API is ready) ---
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        if (!mounted) return;
        setCalls(mockOutboundCalls);
        // --------------------------------------------------

      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load outbound calls');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCalls();
    return () => { mounted = false; };
  }, []);

  // Filter calls based on search, status, and purpose
  useEffect(() => {
    let filtered = calls;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.recipient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.outcome?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handlePlayRecording = (recordingUrl: string) => {
    console.log('Playing recording:', recordingUrl);
    alert('Playing recording: ' + recordingUrl);
  };

  const handleNewCall = () => {
    console.log('Creating new outbound call');
    alert('New outbound call feature - would open call creation form');
  };

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
              Manage outgoing calls and track performance. Total: {filteredCalls.length} calls
            </p>
          </div>
          <div className="flex gap-2">
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
              placeholder="Search by recipient, agent, or outcome..."
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
              <option value="no-answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
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
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading calls...
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
                          {call.status === 'scheduled' && call.scheduled_time 
                            ? formatTime(call.scheduled_time)
                            : call.start_time ? formatTime(call.start_time) : 'Pending'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300 text-xs max-w-24 truncate" title={call.outcome}>
                          {call.outcome || '-'}
                        </div>
                        {call.follow_up_required && (
                          <div className="text-yellow-600 dark:text-yellow-400 text-xs">Follow-up needed</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {call.recording_url && (
                            <button
                              onClick={() => handlePlayRecording(call.recording_url!)}
                              className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-400/10 rounded"
                              title="Play recording"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="p-1 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-400/10 rounded"
                            title="Download details"
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{call.recipient_name || call.recipient_number}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {call.start_time ? formatTime(call.start_time) : 'Scheduled'} • {call.agent_name}
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          {call.purpose} - {call.outcome}
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getStatusColor(call.status, theme)}`}>
                        {call.status}
                      </span>
                    </div>
                    {call.notes && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{call.notes}</p>
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