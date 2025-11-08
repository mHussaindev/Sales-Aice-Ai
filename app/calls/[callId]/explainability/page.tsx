'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare, Brain, Target, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Clock, User, ArrowRight, Zap, Activity, ChevronRight,
  ThumbsUp, ThumbsDown, Sparkles, MapPin, Eye, RefreshCw, ArrowLeft,
  GitBranch, Layers, Heart, AlertCircle
} from 'lucide-react';
import { axiosInstance } from '../../../../utils/axiosInstance';

interface Objection {
  id: string;
  objection_type: string;
  detected_at: string;
  resolved: boolean;
  resolution_time_seconds: number | null;
  confidence: number;
  customer_message: string;
  clarifies_step_recommended: string;
}

interface CLARIFIESStep {
  id: string;
  step_type: string;
  executed_at: string;
  decision_factors: Record<string, any>;
  alternative_considered: string[];
  effectiveness_score: number | null;
  agent_message: string;
}

interface TranscriptMessage {
  timestamp: string;
  speaker: string;
  message: string;
  sentiment: string;
  objection_triggered?: Objection;
  clarifies_step?: CLARIFIESStep;
}

interface CallExplainability {
  call_id: string;
  customer_name: string;
  duration: number;
  outcome: string;
  transcript: TranscriptMessage[];
  objections: Objection[];
  clarifies_steps: CLARIFIESStep[];
  decision_tree: {
    root: string;
    branches: Array<{
      from: string;
      to: string;
      reason: string;
      timestamp: string;
    }>;
  };
  sentiment_timeline: Array<{
    timestamp: string;
    sentiment: string;
    score: number;
  }>;
}

const STEP_COLORS: Record<string, string> = {
  'C': '#3b82f6', // blue
  'L': '#10b981', // green
  'A': '#f59e0b', // amber
  'R': '#ef4444', // red
  'I': '#8b5cf6', // purple
  'F': '#ec4899', // pink
  'I2': '#06b6d4', // cyan
  'E': '#14b8a6', // teal
  'S': '#22c55e'  // lime
};

const STEP_NAMES: Record<string, string> = {
  'C': 'Concern - Identify customer concern',
  'L': 'Listen - Active listening',
  'A': 'Acknowledge - Validate feelings',
  'R': 'Respond - Address objection',
  'I': 'Inform - Provide information',
  'F': 'Find - Discover root cause',
  'I2': 'Involve - Engage customer',
  'E': 'Ensure - Confirm understanding',
  'S': 'Seal - Close conversation'
};

const CallExplainabilityPanel: React.FC = () => {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const callId = params?.callId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CallExplainability | null>(null);
  const [selectedTab, setSelectedTab] = useState<'transcript' | 'objections' | 'steps' | 'tree'>('transcript');

  useEffect(() => {
    if (callId) {
      fetchExplainability();
    }
  }, [callId]);

  const fetchExplainability = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/hume-twilio/call/${callId}/explainability/`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching explainability:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin" size={48} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold">Call Not Found</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 mb-4 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft size={20} /> Back to Calls
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Brain size={36} /> Call Explainability
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.customer_name} • {Math.floor(data.duration / 60)}m {data.duration % 60}s • 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                data.outcome === 'won' ? 'bg-green-100 text-green-800' :
                data.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {data.outcome.toUpperCase()}
              </span>
            </p>
          </div>
          <button
            onClick={fetchExplainability}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <div className="flex items-center gap-3">
            <MessageSquare className="text-blue-500" size={24} />
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Messages</p>
              <p className="text-2xl font-bold">{data.transcript.length}</p>
            </div>
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Objections</p>
              <p className="text-2xl font-bold">{data.objections.length}</p>
            </div>
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
              <p className="text-2xl font-bold">
                {data.objections.filter(o => o.resolved).length}/{data.objections.length}
              </p>
            </div>
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
          <div className="flex items-center gap-3">
            <Layers className="text-purple-500" size={24} />
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>CLARIFIES Steps</p>
              <p className="text-2xl font-bold">{data.clarifies_steps.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md mb-6`}>
        <div className="flex border-b border-gray-700">
          {[
            { id: 'transcript', label: 'Transcript', icon: MessageSquare },
            { id: 'objections', label: 'Objections', icon: AlertTriangle },
            { id: 'steps', label: 'CLARIFIES Steps', icon: Layers },
            { id: 'tree', label: 'Decision Tree', icon: GitBranch }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                selectedTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Transcript Tab */}
          {selectedTab === 'transcript' && (
            <div className="space-y-4">
              {data.transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.speaker === 'customer'
                      ? theme === 'dark' ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-semibold capitalize">{msg.speaker}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.sentiment === 'positive' && <ThumbsUp size={16} className="text-green-500" />}
                      {msg.sentiment === 'negative' && <ThumbsDown size={16} className="text-red-500" />}
                      {msg.objection_triggered && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                          Objection: {msg.objection_triggered.objection_type}
                        </span>
                      )}
                      {msg.clarifies_step && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Step: {msg.clarifies_step.step_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <p>{msg.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Objections Tab */}
          {selectedTab === 'objections' && (
            <div className="space-y-4">
              {data.objections.map((obj, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${obj.resolved ? 'bg-green-100' : 'bg-red-100'}`}>
                        {obj.resolved ? <CheckCircle size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg capitalize">{obj.objection_type.replace('_', ' ')}</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Detected at {new Date(obj.detected_at).toLocaleTimeString()} • 
                          Confidence: {(obj.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    {obj.resolution_time_seconds && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Clock size={16} />
                        <span className="text-sm">Resolved in {obj.resolution_time_seconds}s</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm font-semibold mb-1">Customer Message:</p>
                    <p className="italic">"{obj.customer_message}"</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-500">
                    <ArrowRight size={16} />
                    <span>Recommended: {STEP_NAMES[obj.clarifies_step_recommended]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CLARIFIES Steps Tab */}
          {selectedTab === 'steps' && (
            <div className="space-y-4">
              {data.clarifies_steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4`}
                  style={{ borderColor: STEP_COLORS[step.step_type] || '#6b7280' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full" style={{ backgroundColor: STEP_COLORS[step.step_type] + '20' }}>
                        <Sparkles size={20} style={{ color: STEP_COLORS[step.step_type] }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{STEP_NAMES[step.step_type]}</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(step.executed_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {step.effectiveness_score !== null && (
                      <div className="flex items-center gap-2">
                        <Activity size={16} />
                        <span className="text-sm">Effectiveness: {(step.effectiveness_score * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} mb-2`}>
                    <p className="text-sm font-semibold mb-1">Agent Response:</p>
                    <p>{step.agent_message}</p>
                  </div>
                  {step.decision_factors && Object.keys(step.decision_factors).length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold mb-1">Decision Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(step.decision_factors).map(([key, value]) => (
                          <span key={key} className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {step.alternative_considered.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Alternatives considered: {step.alternative_considered.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Decision Tree Tab */}
          {selectedTab === 'tree' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <MapPin size={20} /> Starting Point
                </h3>
                <p className="text-xl">{data.decision_tree.root}</p>
              </div>
              {data.decision_tree.branches.map((branch, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-2">
                    <ChevronRight size={24} className="text-blue-500" />
                  </div>
                  <div className={`flex-1 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{branch.from}</span>
                        <ArrowRight size={16} />
                        <span className="font-bold" style={{ color: STEP_COLORS[branch.to] || '#6b7280' }}>
                          {branch.to}
                        </span>
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(branch.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{branch.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Timeline */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Heart size={20} /> Sentiment Timeline
        </h2>
        <div className="space-y-2">
          {data.sentiment_timeline.map((point, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className={`text-xs w-20 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(point.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div className={`w-full h-8 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full flex items-center px-3 text-sm font-semibold ${
                      point.sentiment === 'positive' ? 'bg-green-500 text-white' :
                      point.sentiment === 'negative' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}
                    style={{ width: `${Math.abs(point.score) * 100}%` }}
                  >
                    {point.sentiment}
                  </div>
                </div>
                <span className="text-sm w-12 text-right">{(point.score * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallExplainabilityPanel;
