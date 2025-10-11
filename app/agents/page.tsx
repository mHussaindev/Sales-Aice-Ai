'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import axios from 'axios';
import {
  Bot,
  Plus,
  Search,
  Settings,
  Edit,
  Trash2,
  Play,
  Pause,
  Phone,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Users,
  MoreVertical,
  Filter,
  Download,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Globe,
  MessageSquare,
  X,
  Upload,
  Save,
  Loader2,
  FileText
} from 'lucide-react';
import { axiosInstance } from '@/utils/axiosInstance';

// Axios configuration for API calls
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface Agent {
  id: number;
  name: string;
  agent_type: string;
  status: string;
  voice_tone: string;
  total_calls: number;
  success_rate: number;
  campaigns: number;
  operating_hours: {
    start: string;
    end: string;
  };
  last_active: string;
  avatar: string;
}

interface CampaignFormData {
  name: string;
  description?: string;
  status?: string;
  schedule_type?: string;
  scheduled_start?: string;
  priority: string;
  start_date: string;
  end_date: string;
  retry_failed_calls?: boolean;
  max_retry_attempts?: number;
  retry_interval_hours?: number;
  target_audience?: string;
  call_objective?: string;
  pre_call_script?: string;
  post_call_actions?: string[];
  success_criteria?: string[];
  notes?: string;
}

interface AgentFormData {
  name: string;
  agent_type: string;
  status: string;
  voice_tone: string;
  operating_hours: {
    start: string;
    end: string;
    timezone?: string;
    working_days?: string[];
  };
  auto_answer_enabled: boolean;
  website_url: string;
  knowledge_files_upload: any[];
  campaign_schedule: {
    name?: string;
    type?: string;
    start_date?: string;
    max_calls_per_day?: number;
  };
}

export default function AgentsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAgents();
  }, []);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    paused: agents.filter(a => a.status === 'paused').length,
    totalCalls: agents.reduce((sum, agent) => sum + (agent.total_calls || 0), 0),
    avgSuccessRate: agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + (agent.success_rate || 0), 0) / agents.length) : 0
  };

  // API Functions with Backend Django Integration + Detailed Debugging
  const loadAgents = async () => {
    setLoading(true);
    
    console.log('🔄 Starting loadAgents...');
    console.log('🔑 Auth Token:', localStorage.getItem('access_token') || localStorage.getItem('token') || 'None');
    
    try {
      console.log('📡 Making API call to:', '/api/agents/');
      
      const response = await axiosInstance.get('/api/agents/');
      
      console.log('📊 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      
      if (response.data.success && response.data.agents) {
        setAgents(response.data.agents);
        console.log('✅ Agents loaded from Django backend:', response.data.agents.length, 'agents');
      } else if (response.data.agents && Array.isArray(response.data.agents)) {
        setAgents(response.data.agents);
        console.log('✅ Agents loaded (alternative format):', response.data.agents.length, 'agents');
      } else if (Array.isArray(response.data)) {
        setAgents(response.data);
        console.log('✅ Agents loaded (direct array):', response.data.length, 'agents');
      } else {
        console.warn('⚠️ No agents found in response');
        console.log('📄 Response structure:', Object.keys(response.data));
        setAgents([]);
      }
    } catch (error: any) {
      console.error('❌ API Error:', error);
      if (error.response) {
        console.error('📄 Error response:', error.response.data);
        console.error('📊 Error status:', error.response.status);
      } else if (error.request) {
        console.error('🌐 Network issue: No response received');
        console.error('💡 Make sure your Django server is running: python manage.py runserver 8000');
      } else {
        console.error('⚙️ Request setup error:', error.message);
      }
      setAgents([]);
    } finally {
      setLoading(false);
      console.log('✅ loadAgents completed');
    }
  };
  const createAgent = async (formData: FormData) => {
    try {
      console.log('📤 Creating agent with form data...');
      
      const response = await axiosInstance.post('/api/agents/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Agent created successfully:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        await loadAgents();
        setShowCreateModal(false);
        return { success: true, message: 'Agent created successfully' };
      }
      
      return { 
        success: false, 
        error: response.data.message || response.data.errors || 'Failed to create agent' 
      };
    } catch (error: any) {
      console.error('❌ Error creating agent:', error);
      
      if (error.response) {
        const errorMsg = error.response.data.message || error.response.data.error || 'Failed to create agent';
        return { success: false, error: errorMsg };
      }
      
      return { success: false, error: 'Network error occurred' };
    }
  };

  const updateAgent = async (agentId: number, formData: Partial<AgentFormData>) => {
    try {
      console.log('📝 Updating agent:', agentId, formData);
      
      const updateData = {
        name: formData.name,
        agent_type: formData.agent_type,
        status: formData.status,
        voice_tone: formData.voice_tone,
        operating_hours: formData.operating_hours,
        auto_answer_enabled: formData.auto_answer_enabled,
        website_url: formData.website_url,
        business_knowledge_files: formData.knowledge_files_upload
      };

      const response = await axiosInstance.put(`/api/agents/${agentId}/update/`, updateData);

      console.log('✅ Agent updated successfully:', response.data);
      
      if (response.status === 200) {
        await loadAgents();
        return { success: true, message: 'Agent updated successfully' };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Failed to update agent' 
      };
    } catch (error: any) {
      console.error('❌ Error updating agent:', error);
      
      if (error.response) {
        const errorMsg = error.response.data.message || error.response.data.error || 'Failed to update agent';
        return { success: false, error: errorMsg };
      }
      
      return { success: false, error: 'Network error occurred' };
    }
  };

  const deleteAgent = async (agentId: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      console.log('🗑️ Deleting agent:', agentId);
      
      const response = await axiosInstance.delete(`/api/agents/${agentId}/delete/`);

      console.log('✅ Agent deleted successfully:', response.data);
      
      if (response.status === 200 || response.status === 204) {
        await loadAgents();
        alert('Agent deleted successfully');
      } else {
        alert(response.data.message || 'Failed to delete agent');
      }
    } catch (error: any) {
      console.error('❌ Error deleting agent:', error);
      
      if (error.response) {
        const errorMsg = error.response.data.message || error.response.data.error || 'Failed to delete agent';
        alert(errorMsg);
      } else {
        alert('Network error occurred');
      }
    }
  };

  const toggleAgentStatus = async (agentId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      // Using Django's agent update endpoint for status toggle
      const response = await axiosInstance.put(`/api/agents/${agentId}/update/`, {
        status: newStatus
      });

      if (response.status === 200) {
        await loadAgents();
      } else {
        console.error('Failed to toggle agent status');
      }
    } catch (error: any) {
      console.error('Error toggling agent status:', error);
    }
  };

  const createCampaign = async (agentId: number, campaignData: CampaignFormData | FormData) => {
    try {
      // Check if campaignData is FormData (from ScheduleCampaignModal) or regular object
      if (campaignData instanceof FormData) {
        // Send FormData directly to Django - it can handle multipart/form-data
        const response = await axiosInstance.post(`/api/agents/${agentId}/campaigns/create/`, campaignData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.status === 200 || response.status === 201) {
          await loadAgents();
          return { success: true, message: 'Campaign created successfully' };
        }
        
        return { 
          success: false, 
          error: response.data.message || response.data.errors || 'Failed to create campaign' 
        };
      } else {
        // Handle regular object (backward compatibility)
        const response = await axiosInstance.post(`/api/agents/${agentId}/campaigns/create/`, {
          // Matching Django campaign serializer structure
          name: campaignData.name,
          description: campaignData.description || '',
          status: campaignData.status || 'scheduled',
          schedule_type: campaignData.schedule_type || 'immediate',
          scheduled_start: campaignData.scheduled_start || null,
          priority: campaignData.priority,
          start_date: campaignData.start_date,
          end_date: campaignData.end_date,
          retry_failed_calls: campaignData.retry_failed_calls || false,
          max_retry_attempts: campaignData.max_retry_attempts || 3,
          retry_interval_hours: campaignData.retry_interval_hours || 24,
          target_audience: campaignData.target_audience || 'general',
          call_objective: campaignData.call_objective || '',
          pre_call_script: campaignData.pre_call_script || '',
          post_call_actions: campaignData.post_call_actions || [],
          success_criteria: campaignData.success_criteria || [],
          notes: campaignData.notes || ''
        });

        if (response.status === 200 || response.status === 201) {
          await loadAgents();
          return { success: true, message: 'Campaign created successfully' };
        }
        
        return { 
          success: false, 
          error: response.data.message || response.data.errors || 'Failed to create campaign' 
        };
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br mt-24 mb-8 from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Agents</h1>
                <p className="mt-1 text-blue-100">Manage your intelligent sales agents</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>
              
              <button className="inline-flex items-center px-4 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all">
                <Filter className="w-5 h-5 mr-2" />
                Filter
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Agent
              </button>
            </div>
          </div>
          
          {/* API Status Indicator */}
          {/* <div className="mt-2 flex items-center justify-center">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
              <div className={`w-2 h-2 rounded-full ${agents.length > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
            
            </div>
          </div> */}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Agents */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+12%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Agents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.active}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+5%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          </div>

          {/* Total Calls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalCalls.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+18%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.avgSuccessRate}%</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+3%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Performance</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">Excellent</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">All systems</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">operational</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  All Agents ({stats.total})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Active ({stats.active})
                </button>
                <button
                  onClick={() => setFilterStatus('paused')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'paused'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Paused ({stats.paused})
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Agent Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{agent.name || 'Unnamed Agent'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{agent.agent_type || 'Unknown'} Agent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    agent.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                  }`}>
                    {agent.status === 'active' ? 'Active' : 'Paused'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{agent.last_active || 'Recently'}</span>
                </div>
              </div>

              {/* Agent Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{agent.total_calls || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{agent.success_rate || 0}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Voice Tone</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{agent.voice_tone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Operating Hours</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {agent.operating_hours?.start && agent.operating_hours?.end 
                        ? `${agent.operating_hours.start} - ${agent.operating_hours.end}`
                        : '24/7'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Campaigns</span>
                    <span className="font-medium text-gray-900 dark:text-white">{agent.campaigns || 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowEditModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button 
                    onClick={() => toggleAgentStatus(agent.id, agent.status)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                  >
                    {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  {/* Schedule Campaign Button - Only for Outbound Agents */}
                  {agent.agent_type === 'outbound' && (
                    <button 
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowScheduleModal(true);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-800/30 text-green-700 dark:text-green-300 font-medium rounded-lg transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteAgent(agent.id)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onSave={createAgent}
        />
      )}

      {/* Edit Agent Modal */}
      {showEditModal && selectedAgent && (
        <EditAgentModal
          agent={selectedAgent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAgent(null);
          }}
          onSave={(formData: AgentFormData) => updateAgent(selectedAgent.id, formData)}
        />
      )}

      {/* Schedule Campaign Modal */}
      {showScheduleModal && selectedAgent && (
        <ScheduleCampaignModal
          agent={selectedAgent}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedAgent(null);
          }}
          onSave={async (scheduleData: CampaignFormData) => {
            const result = await createCampaign(selectedAgent.id, scheduleData);
            if (result.success) {
              alert('Campaign scheduled successfully!');
              setShowScheduleModal(false);
              setSelectedAgent(null);
              // Refresh agents to update campaign count
              loadAgents();
            } else {
              alert(result.error || 'Failed to schedule campaign');
            }
          }}
        />
      )}
    </div>
  );
}

// Create Agent Modal Component
const CreateAgentModal = ({ onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    agent_type: 'inbound',
    status: 'active',
    voice_tone: 'friendly',
    operating_hours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    auto_answer_enabled: false,
    website_url: 'https://sales-aice-ai.vercel.app/admin/dashboard',
    knowledge_files_upload: [] as string[],
    campaign_schedule: {
      name: '',
      type: 'immediate', // Default to 'immediate'
      start_date: '',
      max_calls_per_day: 100
    }
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('name', formData.name);
      submitData.append('agent_type', formData.agent_type);
      submitData.append('status', formData.status);
      submitData.append('voice_tone', formData.voice_tone);
      submitData.append('operating_hours', JSON.stringify(formData.operating_hours));
      submitData.append('auto_answer_enabled', formData.auto_answer_enabled.toString());
      submitData.append('website_url', formData.website_url);
      
      // Only add campaign_schedule for outbound agents
      if (formData.agent_type === 'outbound') {
        submitData.append('campaign_schedule', JSON.stringify(formData.campaign_schedule));
      }
      
      // Add files
      knowledgeFiles.forEach((file, index) => {
        submitData.append(`knowledge_files_upload`, file);
      });
      
      // Use FormData directly for the API call
      const result = await onSave(submitData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Agent</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter agent name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Type *
              </label>
              <select
                value={formData.agent_type}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Tone *
              </label>
              <select
                value={formData.voice_tone}
                onChange={(e) => setFormData(prev => ({ ...prev, voice_tone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              required
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://sales-aice-ai.vercel.app/admin/dashboard"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Knowledge Files Upload
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx,.csv"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setKnowledgeFiles(files);
                  setFormData(prev => ({ 
                    ...prev, 
                    knowledge_files_upload: files.map(f => f.name) 
                  }));
                }}
                className="hidden"
                id="knowledge-files"
              />
              <label htmlFor="knowledge-files" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload knowledge files or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PDF, TXT, DOC, DOCX, CSV up to 10MB each
                </p>
              </label>
            </div>
            {knowledgeFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files:</p>
                {knowledgeFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = knowledgeFiles.filter((_, i) => i !== index);
                        setKnowledgeFiles(newFiles);
                        setFormData(prev => ({ 
                          ...prev, 
                          knowledge_files_upload: newFiles.map(f => f.name) 
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours.start}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  operating_hours: { ...prev.operating_hours, start: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours.end}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  operating_hours: { ...prev.operating_hours, end: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_answer"
              checked={formData.auto_answer_enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, auto_answer_enabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="auto_answer" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Auto Answer
            </label>
          </div>

          {/* Campaign Schedule Section - Only for Outbound Agents */}
          {formData.agent_type === 'outbound' && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Campaign Schedule (Optional)</h3>
              
              {/* Campaign Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Campaign Type
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="create_campaign_type"
                      value="immediate"
                      checked={formData.campaign_schedule.type === 'immediate'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        campaign_schedule: { ...prev.campaign_schedule, type: e.target.value }
                      }))}
                      className="w-4 h-4 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                    />
                    <span className="text-white">Start Immediately</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="create_campaign_type"
                      value="scheduled"
                      checked={formData.campaign_schedule.type === 'scheduled'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        campaign_schedule: { ...prev.campaign_schedule, type: e.target.value }
                      }))}
                      className="w-4 h-4 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                    />
                    <span className="text-white">Schedule for Later</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.campaign_schedule.name || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, name: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter campaign name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.campaign_schedule.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, start_date: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="mm/dd/yyyy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Calls Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.campaign_schedule.max_calls_per_day || 100}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, max_calls_per_day: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Agent Modal Component
const EditAgentModal = ({ agent, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: agent.name || '',
    agent_type: agent.agent_type || 'inbound',
    status: agent.status || 'active',
    voice_tone: agent.voice_tone || 'friendly',
    operating_hours: agent.operating_hours || {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    auto_answer_enabled: agent.auto_answer_enabled || false,
    website_url: agent.website_url || 'https://sales-aice-ai.vercel.app/admin/dashboard',
    knowledge_files_upload: agent.knowledge_files_upload || agent.business_knowledge_files || [], // ✅ Fixed: populate existing files
    campaign_schedule: agent.campaign_schedule ? {
      name: agent.campaign_schedule.name || '',
      type: agent.campaign_schedule.type || 'immediate',
      start_date: agent.campaign_schedule.start_date || '',
      max_calls_per_day: agent.campaign_schedule.max_calls_per_day || 100
    } : {
      name: '',
      type: 'immediate',
      start_date: '',
      max_calls_per_day: 100
    }
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create JSON data for edit
      const jsonData = {
        ...formData,
        knowledge_files_upload: knowledgeFiles.length > 0 ? knowledgeFiles.map(f => f.name) : formData.knowledge_files_upload
      };
      
      // Remove campaign_schedule for inbound agents
      if (formData.agent_type === 'inbound') {
        delete (jsonData as any).campaign_schedule;
      }
      
      const result = await onSave(jsonData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Agent</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter agent name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Type *
              </label>
              <select
                value={formData.agent_type}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Tone *
              </label>
              <select
                value={formData.voice_tone}
                onChange={(e) => setFormData(prev => ({ ...prev, voice_tone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              required
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://sales-aice-ai.vercel.app/admin/dashboard"
            />
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="edit_auto_answer"
              checked={formData.auto_answer_enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, auto_answer_enabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="edit_auto_answer" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Auto Answer
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours.start}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  operating_hours: { ...prev.operating_hours, start: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.operating_hours.end}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  operating_hours: { ...prev.operating_hours, end: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Campaign Schedule Section - Only for Outbound Agents */}
          {formData.agent_type === 'outbound' && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Campaign Schedule (Optional)</h3>
              
              {/* Campaign Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Campaign Type
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="edit_campaign_type"
                      value="immediate"
                      checked={formData.campaign_schedule.type === 'immediate'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        campaign_schedule: { ...prev.campaign_schedule, type: e.target.value }
                      }))}
                      className="w-4 h-4 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                    />
                    <span className="text-white">Start Immediately</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="edit_campaign_type"
                      value="scheduled"
                      checked={formData.campaign_schedule.type === 'scheduled'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        campaign_schedule: { ...prev.campaign_schedule, type: e.target.value }
                      }))}
                      className="w-4 h-4 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                    />
                    <span className="text-white">Schedule for Later</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.campaign_schedule.name || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, name: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter campaign name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.campaign_schedule.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, start_date: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="mm/dd/yyyy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Calls Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.campaign_schedule.max_calls_per_day || 100}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    campaign_schedule: { ...prev.campaign_schedule, max_calls_per_day: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Schedule Campaign Modal Component
const ScheduleCampaignModal = ({ agent, onClose, onSave }: any) => {
  const [scheduleData, setScheduleData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    schedule_type: 'immediate', // This is the key field Django expects
    status: 'scheduled',
    target_audience: 'general',
    call_script: '',
    call_objective: '',
    notes: '',
    pre_call_script: '',
    max_calls_per_day: 100,
    priority: 'normal',
    retry_attempts: 3,
    retry_delay: 30
  });
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create the campaign_schedule object that Django expects
      const campaignSchedule: any = {
        type: scheduleData.schedule_type, // This is the key field Django validates
        name: scheduleData.name,
        priority: scheduleData.priority,
        max_calls_per_day: scheduleData.max_calls_per_day,
        retry_attempts: scheduleData.retry_attempts,
        retry_delay: scheduleData.retry_delay
      };

      // Add scheduled date/time if it's a scheduled campaign
      if (scheduleData.schedule_type === 'scheduled' && scheduleData.start_date) {
        const scheduledDateTime = `${scheduleData.start_date}T${scheduleData.start_time}:00`;
        campaignSchedule.scheduled_start = scheduledDateTime;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add required campaign fields
      formData.append('name', scheduleData.name); // This is the required field
      formData.append('description', scheduleData.description);
      formData.append('status', scheduleData.status);
      formData.append('target_audience', scheduleData.target_audience);
      formData.append('call_script', scheduleData.call_script);
      formData.append('call_objective', scheduleData.call_objective || '');
      formData.append('notes', scheduleData.notes || '');
      formData.append('retry_failed_calls', 'false');
      formData.append('max_retry_attempts', scheduleData.retry_attempts.toString());
      formData.append('retry_interval_hours', scheduleData.retry_delay.toString());
      formData.append('success_criteria', JSON.stringify([]));
      formData.append('post_call_actions', JSON.stringify([]));
      formData.append('pre_call_script', scheduleData.call_script || '');
      
      // Add the campaign_schedule as a JSON string  
      formData.append('campaign_schedule', JSON.stringify(campaignSchedule));
      
      // Add contacts file if provided
      if (contactsFile) {
        formData.append('contacts_file', contactsFile);
      }
      
      await onSave(formData);
    } catch (error) {
      setError('Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 mt-24 mt-6">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                🚀 Schedule Campaign
              </h2>
              <p className="text-blue-100 text-lg">
                Create an outbound calling campaign for <span className="font-semibold text-white">{agent.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-2xl transition-all duration-200 hover:rotate-90 transform"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-160px)] ">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Campaign Type Selection - Modern Card Design */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl  p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Campaign Type</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className={`
                  relative group cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${scheduleData.schedule_type === 'immediate' ? 'scale-105' : ''}
                `}>
                  <input
                    type="radio"
                    name="schedule_type"
                    value="immediate"
                    checked={scheduleData.schedule_type === 'immediate'}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, schedule_type: e.target.value }))}
                    className="sr-only"
                  />
                  <div className={`
                    p-6 border-3 rounded-2xl transition-all duration-300
                    ${scheduleData.schedule_type === 'immediate' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/25' 
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                    }
                  `}>
                    <div className="flex items-center space-x-4">
                      <div className={`
                        w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-200
                        ${scheduleData.schedule_type === 'immediate' 
                          ? 'border-blue-500 bg-blue-500 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                        }
                      `}>
                        {scheduleData.schedule_type === 'immediate' && (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xl">🚀</span>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">Start Immediately</div>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">Begin calling contacts right away</div>
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`
                  relative group cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${scheduleData.schedule_type === 'scheduled' ? 'scale-105' : ''}
                `}>
                  <input
                    type="radio"
                    name="schedule_type"
                    value="scheduled"
                    checked={scheduleData.schedule_type === 'scheduled'}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, schedule_type: e.target.value }))}
                    className="sr-only"
                  />
                  <div className={`
                    p-6 border-3 rounded-2xl transition-all duration-300
                    ${scheduleData.schedule_type === 'scheduled' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/25' 
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md'
                    }
                  `}>
                    <div className="flex items-center space-x-4">
                      <div className={`
                        w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-200
                        ${scheduleData.schedule_type === 'scheduled' 
                          ? 'border-purple-500 bg-purple-500 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400'
                        }
                      `}>
                        {scheduleData.schedule_type === 'scheduled' && (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xl">📅</span>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">Schedule for Later</div>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">Set a specific date and time</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Scheduled Date/Time Section */}
            {scheduleData.schedule_type === 'scheduled' && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-700 transition-all duration-500 animate-fadeIn">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📅</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📅 Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleData.start_date}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-4 py-4 border-2 border-purple-200 dark:border-purple-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-200 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      ⏰ Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleData.start_time}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-4 py-4 border-2 border-purple-200 dark:border-purple-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-200 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Details */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Campaign Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    🏷️ Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleData.name}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-200 font-medium"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ⭐ Priority Level *
                  </label>
                  <select
                    value={scheduleData.priority}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-200 font-medium"
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="normal">🟡 Normal Priority</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="urgent">🔴 Urgent Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    📞 Max Calls Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={scheduleData.max_calls_per_day}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, max_calls_per_day: parseInt(e.target.value) }))}
                    className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-200 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    🔄 Retry Attempts
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={scheduleData.retry_attempts}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) }))}
                    className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-200 font-medium"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    📝 Description
                  </label>
                  <textarea
                    value={scheduleData.description}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-200 font-medium resize-none"
                    placeholder="Describe your campaign goals and strategy..."
                  />
                </div>
              </div>
            </div>

            {/* Contacts Upload Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-8 border border-amber-200 dark:border-amber-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contact List</h3>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📁 Upload Contact File (CSV) *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setContactsFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className={`
                    w-full px-6 py-8 border-3 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
                    ${contactsFile 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' 
                      : 'border-amber-300 dark:border-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    }
                  `}>
                    <div className="text-center">
                      <div className="text-4xl mb-3">
                        {contactsFile ? '✅' : '📁'}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-2">
                        {contactsFile ? contactsFile.name : 'Click to upload CSV file'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {contactsFile ? 'File selected successfully' : 'CSV format with phone numbers required'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2
                  ${isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  } text-white
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Schedule Campaign</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};