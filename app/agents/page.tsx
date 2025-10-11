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
  campaign_schedule?: any; // Optional campaign data
  knowledge_files_upload?: any[]; // Optional knowledge files
  business_knowledge_files?: any[]; // Alternative field name for knowledge files
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

interface CampaignQueueItem {
  id: string;
  contact: string;
  phone: string;
  schedule: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Failed';
  outcome: 'Won' | 'Lost' | 'Escalated' | 'No Answer' | '';
  actions: string;
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
  const [showCallQueueModal, setShowCallQueueModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCampaign, setFetchingCampaign] = useState<number | null>(null); // Track which agent's campaign is being fetched
  const [fetchingAgent, setFetchingAgent] = useState<number | null>(null); // Track which agent details are being fetched
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('agents'); // Track active main tab
  const [campaignQueue, setCampaignQueue] = useState<CampaignQueueItem[]>([]);

  useEffect(() => {
    loadAgents();
    loadCampaignQueue();
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

  // Load campaign queue data
  const loadCampaignQueue = async () => {
    // Mock data based on the provided screenshot
    const mockCampaignData: CampaignQueueItem[] = [
      {
        id: '1',
        contact: 'John Smith',
        phone: '+1-555-0001',
        schedule: '10/9/2023, 7:00:00 AM',
        status: 'Completed',
        outcome: 'Won',
        actions: 'View Details'
      },
      {
        id: '2',
        contact: 'Sarah Johnson',
        phone: '+1-555-0002',
        schedule: '10/9/2023, 8:00:00 AM',
        status: 'Pending',
        outcome: '',
        actions: 'View Details'
      },
      {
        id: '3',
        contact: 'Mike Davis',
        phone: '+1-555-0003',
        schedule: '10/9/2023, 9:30:00 AM',
        status: 'Completed',
        outcome: 'Lost',
        actions: 'View Details'
      },
      {
        id: '4',
        contact: 'Emily Chen',
        phone: '+1-555-0004',
        schedule: '10/9/2023, 7:30:00 AM',
        status: 'Active',
        outcome: '',
        actions: 'View Details'
      },
      {
        id: '5',
        contact: 'Robert Brown',
        phone: '+1-555-0005',
        schedule: '10/9/2023, 3:00:00 AM',
        status: 'Completed',
        outcome: 'Escalated',
        actions: 'View Details'
      },
      {
        id: '6',
        contact: 'Lisa Anderson',
        phone: '+1-555-0006',
        schedule: '10/9/2023, 9:00:00 AM',
        status: 'Pending',
        outcome: '',
        actions: 'View Details'
      },
      {
        id: '7',
        contact: 'David Wilson',
        phone: '+1-555-0007',
        schedule: '10/9/2023, 4:00:00 AM',
        status: 'Completed',
        outcome: 'Won',
        actions: 'View Details'
      },
      {
        id: '8',
        contact: 'Jennifer Taylor',
        phone: '+1-555-0008',
        schedule: '10/9/2023, 2:00:00 AM',
        status: 'Failed',
        outcome: 'No Answer',
        actions: 'View Details'
      }
    ];
    
    setCampaignQueue(mockCampaignData);
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

  // Fetch existing campaign data for an agent
  const fetchCampaignData = async (agentId: number) => {
    try {
      // First try to get campaigns list for this agent
      const response = await axiosInstance.get(`/api/agents/campaigns/`);
      
      if (response.status === 200 && response.data.success) {
        // Find campaign for this specific agent
        const agentCampaigns = response.data.campaigns.filter((campaign: any) => 
          campaign.agent === agentId || campaign.agent_id === agentId
        );
        
        if (agentCampaigns.length > 0) {
          // Return the most recent campaign
          const latestCampaign = agentCampaigns[0];
          return {
            success: true,
            campaign: {
              id: latestCampaign.id,
              name: latestCampaign.name,
              description: latestCampaign.description,
              status: latestCampaign.status,
              schedule_type: latestCampaign.schedule_type,
              scheduled_start: latestCampaign.scheduled_start,
              target_audience: latestCampaign.target_audience || 'general',
              call_script: latestCampaign.call_script || '',
              call_objective: latestCampaign.call_objective || '',
              notes: latestCampaign.notes || '',
              max_calls_per_day: latestCampaign.total_contacts || 100,
              priority: latestCampaign.priority || 'normal',
              retry_attempts: latestCampaign.retry_attempts || 3,
              retry_delay: latestCampaign.retry_delay || 30
            }
          };
        }
      }
      
      return { success: false, error: 'No existing campaigns found' };
    } catch (error: any) {
      console.error('Error fetching campaign data:', error);
      return { success: false, error: 'Failed to fetch campaign data' };
    }
  };

  // Fetch detailed agent data including all associated data
  const fetchAgentDetails = async (agentId: number) => {
    try {
      const response = await axiosInstance.get(`/api/agents/${agentId}/`);
      
      if (response.status === 200 && response.data.success) {
        // Transform backend response to frontend Agent format
        const backendAgent = response.data.agent;
        const transformedAgent: Agent = {
          id: backendAgent.id,
          name: backendAgent.name || '',
          agent_type: backendAgent.agent_type || 'inbound',
          status: backendAgent.status || 'active',
          voice_tone: backendAgent.voice_tone || 'friendly',
          total_calls: backendAgent.total_calls || 0,
          success_rate: Math.round((backendAgent.successful_calls / Math.max(backendAgent.total_calls, 1)) * 100) || 0,
          campaigns: backendAgent.active_campaigns_count || 0,
          operating_hours: {
            start: backendAgent.operating_hours?.start || '09:00',
            end: backendAgent.operating_hours?.end || '17:00'
          },
          last_active: backendAgent.last_activity || backendAgent.updated_at || new Date().toISOString(),
          avatar: `/api/placeholder/100/100?text=${backendAgent.name?.charAt(0) || 'A'}`,
          campaign_schedule: backendAgent.campaign_schedule || {},
          knowledge_files_upload: backendAgent.knowledge_files || [],
          business_knowledge_files: backendAgent.business_knowledge_files || []
        };
        
        return transformedAgent;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching agent details:', error);
      return null;
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === 'agents'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4 inline mr-2" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('campaign-queue')}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === 'campaign-queue'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Campaign Queue
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                {campaignQueue.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'agents' ? (
        <>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.avgSuccessRate}</p>
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
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{agent.success_rate || 0}</div>
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
                    onClick={async () => {
                      // Fetch fresh agent data before opening edit modal
                      setFetchingAgent(agent.id);
                      
                      try {
                        const updatedAgent = await fetchAgentDetails(agent.id);
                        if (updatedAgent) {
                          setSelectedAgent(updatedAgent);
                          setShowEditModal(true);
                        }
                      } catch (error) {
                        console.error('Failed to fetch agent details:', error);
                        // Fallback to existing agent data
                        setSelectedAgent(agent);
                        setShowEditModal(true);
                      } finally {
                        setFetchingAgent(null);
                      }
                    }}
                    disabled={fetchingAgent === agent.id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetchingAgent === agent.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="w-4 h-4 mr-2" />
                    )}
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
                      onClick={async () => {
                        setFetchingCampaign(agent.id);
                        setSelectedAgent(agent);
                        
                        try {
                          // Fetch existing campaign data for this agent
                          const campaignData = await fetchCampaignData(agent.id);
                          
                          if (campaignData.success) {
                            // Update the selected agent with campaign data
                            setSelectedAgent({
                              ...agent,
                              campaign_schedule: campaignData.campaign
                            });
                          }
                          
                          setShowScheduleModal(true);
                        } catch (error) {
                          console.error('Error fetching campaign:', error);
                        } finally {
                          setFetchingCampaign(null);
                        }
                      }}
                      disabled={fetchingCampaign === agent.id}
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-800/30 text-green-700 dark:text-green-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fetchingCampaign === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Call Queue Button - Only for Outbound Agents */}
                  {agent.agent_type === 'outbound' && (
                    <button 
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowCallQueueModal(true);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-800/30 text-purple-700 dark:text-purple-300 font-medium rounded-lg transition-colors"
                      title="View Call Queue"
                    >
                      <Activity className="w-4 h-4" />
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
              const isEditing = selectedAgent.campaign_schedule && (selectedAgent.campaign_schedule.name || selectedAgent.campaign_schedule.type);
              alert(isEditing ? 'Campaign updated successfully!' : 'Campaign scheduled successfully!');
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

      {/* Call Queue Modal */}
      {showCallQueueModal && selectedAgent && (
        <CallQueueModal
          agent={selectedAgent}
          onClose={() => {
            setShowCallQueueModal(false);
            setSelectedAgent(null);
          }}
        />
      )}
        </>
      ) : (
        /* Campaign Queue Tab Content */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Queue</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{campaignQueue.length} scheduled calls</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Agent
                </button>
              </div>
            </div>
            
            {/* Campaign Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Outcome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {campaignQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {item.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {item.schedule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                          item.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.outcome && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.outcome === 'Won' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            item.outcome === 'Lost' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                            item.outcome === 'Escalated' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {item.outcome}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                        <button className="hover:underline">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
    api_key_source: 'account_default', // 'account_default' or 'custom'
    hume_ai_api_key: '',
    hume_ai_config: {
      enable_emotion_detection: true,
      response_to_emotions: true,
      sentiment_analysis: true,
      emotion_models: ['prosody', 'language']
    },
    operating_hours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    auto_answer_enabled: false,
    website_url: 'https://sales-aice-ai.vercel.app/admin/dashboard',
    sales_script_text: '',
    knowledge_files_upload: [] as string[],
    campaign_schedule: {
      name: '',
      type: 'immediate', // Default to 'immediate'
      start_date: '',
      max_calls_per_day: 100
    }
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
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
      submitData.append('api_key_source', formData.api_key_source);
      // Only include custom API key if user selected custom option
      if (formData.api_key_source === 'custom') {
        submitData.append('hume_ai_api_key', formData.hume_ai_api_key);
      }
      submitData.append('hume_ai_config', JSON.stringify(formData.hume_ai_config));
      submitData.append('sales_script_text', formData.sales_script_text);
      submitData.append('operating_hours', JSON.stringify(formData.operating_hours));
      submitData.append('auto_answer_enabled', formData.auto_answer_enabled.toString());
      submitData.append('website_url', formData.website_url);
      
      // Only add campaign_schedule for outbound agents
      if (formData.agent_type === 'outbound') {
        submitData.append('campaign_schedule', JSON.stringify(formData.campaign_schedule));
        
        // Add contacts CSV file for outbound agents
        if (contactsFile) {
          submitData.append('contacts_file', contactsFile);
        }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 mt-24">
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

          {/* Hume AI Configuration Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Hume AI Configuration
            </h3>
            
            <div className="space-y-4">
              {/* API Key Source Selection */}
              <div className="bg-blue-100 dark:bg-blue-800/30 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  API Key Configuration
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="api_key_source"
                      value="account_default"
                      checked={formData.api_key_source === 'account_default'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        api_key_source: e.target.value,
                        hume_ai_api_key: e.target.value === 'account_default' ? '' : prev.hume_ai_api_key
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Use Account Default API Key</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Recommended: Uses your account's global Hume AI key</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="api_key_source"
                      value="custom"
                      checked={formData.api_key_source === 'custom'}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key_source: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Use Custom API Key for This Agent</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Advanced: Specific key for this agent only</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom API Key Field */}
              {formData.api_key_source === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Hume AI API Key
                  </label>
                  <input
                    type="password"
                    value={formData.hume_ai_api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, hume_ai_api_key: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter custom Hume AI API key for this agent"
                  />
                </div>
              )}

              {/* Configuration Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emotion_detection"
                    checked={formData.hume_ai_config.enable_emotion_detection}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hume_ai_config: { ...prev.hume_ai_config, enable_emotion_detection: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="emotion_detection" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable Emotion Detection
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="response_emotions"
                    checked={formData.hume_ai_config.response_to_emotions}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hume_ai_config: { ...prev.hume_ai_config, response_to_emotions: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="response_emotions" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Response to Emotions
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sentiment_analysis"
                    checked={formData.hume_ai_config.sentiment_analysis}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hume_ai_config: { ...prev.hume_ai_config, sentiment_analysis: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="sentiment_analysis" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Sentiment Analysis
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Script Section */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sales Script
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sales Script Text
              </label>
              <textarea
                value={formData.sales_script_text}
                onChange={(e) => setFormData(prev => ({ ...prev, sales_script_text: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your sales script or talking points for the agent..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This script will guide the agent during calls. Be specific about key points and objection handling.
              </p>
            </div>
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

          {/* Contact CSV Upload Section - Only for Outbound Agents */}
          {formData.agent_type === 'outbound' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Upload (CSV)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Contacts File (CSV)
                  </label>
                  <div className="border-2 border-dashed border-orange-300 dark:border-orange-600 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setContactsFile(file);
                        }
                      }}
                      className="hidden"
                      id="contacts-csv"
                    />
                    <label htmlFor="contacts-csv" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to upload CSV file with contacts
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Required columns: Name, Phone, Notes, Preferred_Time
                      </p>
                    </label>
                  </div>
                  {contactsFile && (
                    <div className="mt-3 flex items-center justify-between bg-orange-50 dark:bg-orange-700/20 p-3 rounded">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {contactsFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setContactsFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-orange-100 dark:bg-orange-800/30 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">CSV Format Requirements:</h4>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• <strong>Name</strong>: Contact full name</li>
                    <li>• <strong>Phone</strong>: Phone number with country code (e.g., +1234567890)</li>
                    <li>• <strong>Notes</strong>: Additional notes about the contact</li>
                    <li>• <strong>Preferred_Time</strong>: Best time to call (e.g., "Morning", "Afternoon")</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 mt-24">
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
    name: agent.campaign_schedule?.name || '',
    description: agent.campaign_schedule?.description || '',
    start_date: agent.campaign_schedule?.start_date || '',
    end_date: agent.campaign_schedule?.end_date || '',
    start_time: agent.campaign_schedule?.start_time || '09:00',
    end_time: agent.campaign_schedule?.end_time || '17:00',
    schedule_type: agent.campaign_schedule?.type || agent.campaign_schedule?.schedule_type || 'immediate',
    status: agent.campaign_schedule?.status || 'scheduled',
    target_audience: agent.campaign_schedule?.target_audience || 'general',
    call_script: agent.campaign_schedule?.call_script || '',
    call_objective: agent.campaign_schedule?.call_objective || '',
    notes: agent.campaign_schedule?.notes || '',
    pre_call_script: agent.campaign_schedule?.pre_call_script || '',
    max_calls_per_day: agent.campaign_schedule?.max_calls_per_day || 100,
    priority: agent.campaign_schedule?.priority || 'normal',
    retry_attempts: agent.campaign_schedule?.retry_attempts || 3,
    retry_delay: agent.campaign_schedule?.retry_delay || 30
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
                🚀 {agent.campaign_schedule && (agent.campaign_schedule.name || agent.campaign_schedule.type) ? 'Edit Campaign' : 'Schedule Campaign'}
              </h2>
              <p className="text-blue-100 text-lg">
                {agent.campaign_schedule && (agent.campaign_schedule.name || agent.campaign_schedule.type) 
                  ? `Update the outbound calling campaign for` 
                  : `Create an outbound calling campaign for`
                } <span className="font-semibold text-white">{agent.name}</span>
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
                    <span>{agent.campaign_schedule && (agent.campaign_schedule.name || agent.campaign_schedule.type) ? 'Updating...' : 'Scheduling...'}</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>{agent.campaign_schedule && (agent.campaign_schedule.name || agent.campaign_schedule.type) ? 'Update Campaign' : 'Schedule Campaign'}</span>
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

// Call Queue Modal Component
const CallQueueModal = ({ agent, onClose }: { agent: Agent; onClose: () => void }) => {
  const [callQueue, setCallQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed

  useEffect(() => {
    fetchCallQueue();
  }, []);

  const fetchCallQueue = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/agents/${agent.id}/call-queue/`);
      if (response.data.success) {
        setCallQueue(response.data.queue || []);
      }
    } catch (error) {
      console.error('Error fetching call queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = callQueue.filter(call => {
    if (filter === 'all') return true;
    return call.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Call Queue - {agent.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View pending and completed calls for this outbound agent
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All Calls', count: callQueue.length },
              { key: 'pending', label: 'Pending', count: callQueue.filter(c => c.status === 'pending').length },
              { key: 'completed', label: 'Completed', count: callQueue.filter(c => c.status === 'completed').length },
              { key: 'failed', label: 'Failed', count: callQueue.filter(c => c.status === 'failed').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading call queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No calls found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' ? 'No calls have been scheduled for this agent yet.' : `No ${filter} calls found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((call, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {call.contact_name || 'Unknown Contact'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                          <span className="ml-2 text-gray-900 dark:text-white font-medium">{call.phone_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {call.scheduled_time ? new Date(call.scheduled_time).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Attempts:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{call.retry_count || 0}</span>
                        </div>
                      </div>

                      {call.notes && (
                        <div className="mt-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Notes:</span>
                          <span className="ml-2 text-gray-900 dark:text-white text-sm">{call.notes}</span>
                        </div>
                      )}

                      {call.call_result && (
                        <div className="mt-2">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Result:</span>
                          <span className="ml-2 text-gray-900 dark:text-white text-sm">{call.call_result}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {call.status === 'pending' && (
                        <button className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Start Call">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {call.status === 'failed' && (
                        <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Retry Call">
                          <TrendingUp className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total calls: {callQueue.length} | Showing: {filteredQueue.length}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};