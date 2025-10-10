'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Settings, Phone, Clock, Globe, Plus, X, Bot, Mic, Calendar, Mail, Database, Shield, Target, Book, Building } from 'lucide-react';
import { useTheme } from 'next-themes';
import { axiosInstance } from '../../../utils/axiosInstance';

// Types
type AgentType = 'inbound' | 'outbound';
type AgentStatus = 'active' | 'inactive';
type VoiceModel = 'alice' | 'bob' | 'charlie' | 'diana';
type Tone = 'friendly_professional' | 'energetic' | 'calm' | 'authoritative';
type EnergyLevel = 'low' | 'moderate' | 'enthusiastic' | 'high';
type CommunicationStyle = 'formal' | 'conversational' | 'casual';
type Pace = 'slow' | 'moderate' | 'fast';
type ConversationStyle = 'consultative' | 'direct' | 'relationship_focused';

interface ProductService {
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  target_audience: string;
}

interface AgentFormData {
  name: string;
  agent_type: AgentType;
  status: AgentStatus;
  hume_ai_api_key: string;
  hume_ai_config: {
    enable_emotion_detection: boolean;
    response_to_emotions: boolean;
    sentiment_analysis: boolean;
    emotion_models: string[];
  };
  voice_model: VoiceModel;
  tone_settings: {
    tone: Tone;
    energy_level: EnergyLevel;
    communication_style: CommunicationStyle;
    pace: Pace;
  };
  operating_hours: {
    timezone: string;
    working_days: string[];
    start_time: string;
    end_time: string;
  };
  auto_answer_enabled: boolean;
  sales_script_text: string;
  business_info: {
    company_name: string;
    company_website: string;
    company_phone: string;
    industry: string;
    business_description: string;
  };
  products_services: ProductService[];
  conversation_settings: {
    max_call_duration: number;
    follow_up_enabled: boolean;
    objection_handling_enabled: boolean;
    sentiment_response_enabled: boolean;
    language: string;
    conversation_style: ConversationStyle;
  };
  integrations: {
    crm_integration: {
      enabled: boolean;
      crm_type: string;
      api_key: string;
      webhook_url: string;
    };
    calendar_integration: {
      enabled: boolean;
      calendar_type: string;
      api_credentials: {
        client_id: string;
      };
    };
    email_integration: {
      enabled: boolean;
      email_provider: string;
      smtp_settings: {
        host: string;
        port: number;
      };
    };
  };
  performance_config: {
    conversion_target: number;
    calls_per_day_target: number;
    revenue_per_call_target: number;
    quality_score_target: number;
    analytics_enabled: boolean;
    reporting_frequency: string;
  };
  compliance_settings: {
    call_recording_enabled: boolean;
    gdpr_compliant: boolean;
    data_retention_days: number;
    privacy_policy_url: string;
    terms_of_service_url: string;
  };
  webhook_settings: {
    call_started_webhook: string;
    call_ended_webhook: string;
    conversion_webhook: string;
    error_webhook: string;
  };
  learning_config: {
    auto_learning_enabled: boolean;
    learning_from_calls: boolean;
    script_optimization: boolean;
    response_improvement: boolean;
    feedback_integration: boolean;
  };
}

export default function NewAgentPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    agent_type: 'outbound',
    status: 'active',
    hume_ai_api_key: '',
    hume_ai_config: {
      enable_emotion_detection: true,
      response_to_emotions: true,
      sentiment_analysis: true,
      emotion_models: ['prosody', 'language']
    },
    voice_model: 'alice',
    tone_settings: {
      tone: 'friendly_professional',
      energy_level: 'enthusiastic',
      communication_style: 'conversational',
      pace: 'moderate'
    },
    operating_hours: {
      timezone: 'America/New_York',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start_time: '09:00',
      end_time: '17:00'
    },
    auto_answer_enabled: true,
    sales_script_text: '',
    business_info: {
      company_name: '',
      company_website: '',
      company_phone: '',
      industry: '',
      business_description: ''
    },
    products_services: [],
    conversation_settings: {
      max_call_duration: 900,
      follow_up_enabled: true,
      objection_handling_enabled: true,
      sentiment_response_enabled: true,
      language: 'en-US',
      conversation_style: 'consultative'
    },
    integrations: {
      crm_integration: {
        enabled: false,
        crm_type: 'salesforce',
        api_key: '',
        webhook_url: ''
      },
      calendar_integration: {
        enabled: false,
        calendar_type: 'google',
        api_credentials: {
          client_id: ''
        }
      },
      email_integration: {
        enabled: false,
        email_provider: 'gmail',
        smtp_settings: {
          host: 'smtp.gmail.com',
          port: 587
        }
      }
    },
    performance_config: {
      conversion_target: 25.0,
      calls_per_day_target: 100,
      revenue_per_call_target: 250.0,
      quality_score_target: 9.0,
      analytics_enabled: true,
      reporting_frequency: 'daily'
    },
    compliance_settings: {
      call_recording_enabled: true,
      gdpr_compliant: true,
      data_retention_days: 90,
      privacy_policy_url: '',
      terms_of_service_url: ''
    },
    webhook_settings: {
      call_started_webhook: '',
      call_ended_webhook: '',
      conversion_webhook: '',
      error_webhook: ''
    },
    learning_config: {
      auto_learning_enabled: true,
      learning_from_calls: true,
      script_optimization: true,
      response_improvement: true,
      feedback_integration: true
    }
  });

  const [newProduct, setNewProduct] = useState<ProductService>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    features: [],
    target_audience: ''
  });
  const [newFeature, setNewFeature] = useState('');

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof AgentFormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedChange = (parent: string, child: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof AgentFormData] as any,
        [child]: value
      }
    }));
  };

  const handleWorkingDaysChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        working_days: checked 
          ? [...prev.operating_hours.working_days, day]
          : prev.operating_hours.working_days.filter(d => d !== day)
      }
    }));
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.description) {
      setFormData(prev => ({
        ...prev,
        products_services: [...prev.products_services, newProduct]
      }));
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        features: [],
        target_audience: ''
      });
    }
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products_services: prev.products_services.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setNewProduct(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Agent name is required');
      }
      if (!formData.business_info.company_name.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.sales_script_text.trim()) {
        throw new Error('Sales script is required');
      }

      // Create the payload
      const payload = {
        ...formData
      };

      // API call to create agent
      const response = await axiosInstance.post('/api/agents/create/', payload);
      console.log('Agent created successfully:', response.data);
      
      // Redirect back to agents list
      router.push('/agents');
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-white p-6 py-25" style={{
      paddingLeft: '28%',
      paddingRight: '28%'
    }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/agents"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Link>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6" />
            Create New Agent
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Add a new agent to your team with their details and permissions.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-100">
            <p className="font-medium">Error</p>
            <p className="mt-1 text-red-600 dark:text-red-200/80">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agent Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="Enter agent name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agent Type *
                  </label>
                  <select
                    value={formData.agent_type}
                    onChange={(e) => handleInputChange('agent_type', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hume AI API Key
                  </label>
                  <input
                    type="text"
                    value={formData.hume_ai_api_key}
                    onChange={(e) => handleInputChange('hume_ai_api_key', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="hume_key_..."
                  />
                </div>
              </div>
            </div>

            {/* Voice & AI Settings */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice & AI Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice Model
                  </label>
                  <select
                    value={formData.voice_model}
                    onChange={(e) => handleInputChange('voice_model', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="alice">Alice</option>
                    <option value="bob">Bob</option>
                    <option value="charlie">Charlie</option>
                    <option value="diana">Diana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={formData.tone_settings.tone}
                    onChange={(e) => handleNestedChange('tone_settings', 'tone', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="friendly_professional">Friendly Professional</option>
                    <option value="energetic">Energetic</option>
                    <option value="calm">Calm</option>
                    <option value="authoritative">Authoritative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Energy Level
                  </label>
                  <select
                    value={formData.tone_settings.energy_level}
                    onChange={(e) => handleNestedChange('tone_settings', 'energy_level', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Communication Style
                  </label>
                  <select
                    value={formData.tone_settings.communication_style}
                    onChange={(e) => handleNestedChange('tone_settings', 'communication_style', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="formal">Formal</option>
                    <option value="conversational">Conversational</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>
              
              {/* AI Config Checkboxes */}
              <div className="mt-6 space-y-3">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">AI Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hume_ai_config.enable_emotion_detection}
                      onChange={(e) => handleNestedChange('hume_ai_config', 'enable_emotion_detection', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Emotion Detection</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hume_ai_config.response_to_emotions}
                      onChange={(e) => handleNestedChange('hume_ai_config', 'response_to_emotions', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Response to Emotions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hume_ai_config.sentiment_analysis}
                      onChange={(e) => handleNestedChange('hume_ai_config', 'sentiment_analysis', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sentiment Analysis</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.auto_answer_enabled}
                      onChange={(e) => handleInputChange('auto_answer_enabled', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto Answer Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.business_info.company_name}
                    onChange={(e) => handleNestedChange('business_info', 'company_name', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={formData.business_info.company_website}
                    onChange={(e) => handleNestedChange('business_info', 'company_website', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.business_info.company_phone}
                    onChange={(e) => handleNestedChange('business_info', 'company_phone', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="+1555123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.business_info.industry}
                    onChange={(e) => handleNestedChange('business_info', 'industry', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="e.g., technology, healthcare, finance"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.business_info.business_description}
                  onChange={(e) => handleNestedChange('business_info', 'business_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="Describe your business and what you do..."
                />
              </div>
            </div>

            {/* Sales Script */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Book className="h-5 w-5" />
                Sales Script
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sales Script Text *
                </label>
                <textarea
                  value={formData.sales_script_text}
                  onChange={(e) => handleInputChange('sales_script_text', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  placeholder="Enter the sales script that the agent will use..."
                  required
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.operating_hours.start_time}
                    onChange={(e) => handleNestedChange('operating_hours', 'start_time', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.operating_hours.end_time}
                    onChange={(e) => handleNestedChange('operating_hours', 'end_time', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.operating_hours.timezone}
                    onChange={(e) => handleNestedChange('operating_hours', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0E1627] border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Working Days
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.operating_hours.working_days.includes(day)}
                        onChange={(e) => handleWorkingDaysChange(day, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {day.substring(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md text-sm font-medium disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Agent...' : 'Create Agent'}
              </button>
              <Link
                href="/agents"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
              >
                Cancel
              </Link>
            </div>
        </form>
        </div>
      </div>
    </main>
  );
}
