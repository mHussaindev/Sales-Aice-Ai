'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import {
  TrendingUp, TrendingDown, MessageSquare, AlertTriangle, CheckCircle,
  XCircle, Clock, Target, Brain, Users, Filter, Calendar, Download,
  RefreshCw, Activity, Zap, Award, ThumbsUp, ThumbsDown, Phone
} from 'lucide-react';
import { axiosInstance } from '../../../utils/axiosInstance';
import { useUserRoute } from '../../../hooks/useProtectedRoute';

interface ConversationMetrics {
  total_calls: number;
  avg_objections_per_call: number;
  avg_resolved_per_call: number;
  avg_escalated_per_call: number;
  overall_resolution_rate: number;
  avg_sentiment_score: number;
  avg_win_probability: number;
  [key: string]: number; // Index signature for flexibility
}

interface ObjectionType {
  objection_type: string;  // Backend field name
  total_count: number;      // Backend field name
  resolved_count: number;
  resolution_rate: number;
  avg_confidence: number;   // Backend field name
  [key: string]: string | number; // Index signature for compatibility
}

interface CLARIFIESFlow {
  step: string;
  count: number;
  avg_effectiveness: number;
  common_next_steps: string[];
  [key: string]: string | number | string[]; // Index signature for compatibility
}

interface WinLossRate {
  outcome: string;
  count: number;
  percentage: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface ToneTrend {
  date: string;
  avg_sentiment: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  top_emotions: Record<string, number>;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1'
};

const ConversationAnalyticsDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const { isAuthorized, isLoading: authLoading, user } = useUserRoute();
  
  // Data states
  const [metrics, setMetrics] = useState<ConversationMetrics | null>(null);
  const [objectionTypes, setObjectionTypes] = useState<ObjectionType[]>([]);
  const [clarifiesFlow, setClarifiesFlow] = useState<CLARIFIESFlow[]>([]);
  const [winLossData, setWinLossData] = useState<WinLossRate[]>([]);
  const [toneTrends, setToneTrends] = useState<ToneTrend[]>([]);
  const [agents, setAgents] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchAllData();
  }, [dateRange, selectedAgent]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = {
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end }),
        ...(selectedAgent && { agent_id: selectedAgent })
      };

      const [metricsRes, objectionsRes, flowRes, winLossRes, trendsRes] = await Promise.all([
        axiosInstance.get('/api/hume-twilio/analytics/conversation-metrics/', { params }),
        axiosInstance.get('/api/hume-twilio/analytics/objection-types/', { params }),
        axiosInstance.get('/api/hume-twilio/analytics/clarifies-flow/', { params }),
        axiosInstance.get('/api/hume-twilio/analytics/win-loss-rate/', { params }),
        axiosInstance.get('/api/hume-twilio/analytics/tone-trends/', { params })
      ]);

      console.log('API Responses:', {
        metrics: metricsRes.data,
        objections: objectionsRes.data,
        flow: flowRes.data,
        winLoss: winLossRes.data,
        trends: trendsRes.data
      });

      // Parse conversation metrics (nested structure)
      if (metricsRes.data.success && metricsRes.data.metrics) {
        setMetrics(metricsRes.data.metrics);
      } else {
        setMetrics(metricsRes.data);
      }
      
      // All APIs now return arrays directly
      setObjectionTypes(Array.isArray(objectionsRes.data) ? objectionsRes.data : []);
      setClarifiesFlow(Array.isArray(flowRes.data) ? flowRes.data : []);
      setWinLossData(Array.isArray(winLossRes.data) ? winLossRes.data : []);
      setToneTrends(Array.isArray(trendsRes.data) ? trendsRes.data : []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full`} style={{ backgroundColor: color + '20' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600 dark:text-white/70">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render page if user is authorized
  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb- mt-20">
        <div>
          <h1 className="text-4xl font-bold">📊 Conversation Analytics</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            CLARIFIES Framework Performance Dashboard
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          />
          <button
            onClick={fetchAllData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={Phone}
          title="Total Calls"
          value={metrics?.total_calls || 0}
          color={COLORS.primary}
        />
        <MetricCard
          icon={MessageSquare}
          title="Avg Objections"
          value={metrics?.avg_objections_per_call?.toFixed(1) || 0}
          color={COLORS.warning}
        />
        <MetricCard
          icon={CheckCircle}
          title="Resolution Rate"
          value={`${(metrics?.overall_resolution_rate || 0).toFixed(1)}%`}
          change={15}
          color={COLORS.success}
        />
        <MetricCard
          icon={Award}
          title="Avg Sentiment"
          value={metrics?.avg_sentiment_score?.toFixed(2) || '0.00'}
          change={8}
          color={COLORS.purple}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-25">
        {/* Objection Types Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Objection Types Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={objectionTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="objection_type" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#ffffff' : '#000000'
                }}
              />
              <Legend />
              <Bar dataKey="total_count" fill={COLORS.primary} name="Total" />
              <Bar dataKey="resolved_count" fill={COLORS.success} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Pie Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target size={20} /> Win/Loss Distribution
          </h2>
          {winLossData && winLossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="count"
                  nameKey="outcome"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.outcome}: ${entry.percentage?.toFixed(1) || 0}%`}
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CLARIFIES Flow Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain size={20} /> CLARIFIES Step Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clarifiesFlow} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <YAxis dataKey="step" type="category" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill={COLORS.info} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tone Trends Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity size={20} /> Sentiment Trends Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={toneTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="avg_sentiment" stroke={COLORS.primary} name="Avg Sentiment" strokeWidth={2} />
              <Line type="monotone" dataKey="positive_count" stroke={COLORS.success} name="Positive" />
              <Line type="monotone" dataKey="negative_count" stroke={COLORS.danger} name="Negative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objection Resolution Details */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4">📋 Objection Resolution Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Count</th>
                  <th className="p-3 text-right">Resolved</th>
                  <th className="p-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {objectionTypes && objectionTypes.length > 0 ? objectionTypes.map((obj: ObjectionType, idx: number) => (
                  <tr key={idx} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="p-3 capitalize">{String(obj.objection_type).replace('_', ' ')}</td>
                    <td className="p-3 text-right">{obj.total_count}</td>
                    <td className="p-3 text-right">{obj.resolved_count}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded ${
                        obj.resolution_rate > 70 ? 'bg-green-100 text-green-800' :
                        obj.resolution_rate > 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {obj.resolution_rate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">No objection data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CLARIFIES Effectiveness */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <h2 className="text-xl font-bold mb-4">⚡ CLARIFIES Step Effectiveness</h2>
          <div className="space-y-4">
            {clarifiesFlow && clarifiesFlow.length > 0 ? clarifiesFlow.map((step: CLARIFIESFlow, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{step.step}</span>
                  <span>{(step.avg_effectiveness * 100).toFixed(0)}%</span>
                </div>
                <div className={`w-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    style={{ width: `${step.avg_effectiveness * 100}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Used {step.count} times
                </p>
              </div>
            )) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationAnalyticsDashboard;
