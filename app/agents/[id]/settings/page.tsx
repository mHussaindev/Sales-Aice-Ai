'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  ArrowLeft, Save, Settings, Phone, Users, Clock, Shield, 
  MessageSquare, Bot, FileText, Target, Calendar, Globe,
  Upload, Download, Play, Pause, Volume2, Mic, PhoneCall,
  User, Mail, Building, MapPin, DollarSign, BookOpen,
  AlertCircle, CheckCircle, X, Plus, Trash2, Bell
} from 'lucide-react';
import { axiosInstance } from '../../../../utils/axiosInstance';

interface AgentSettings {
  // Agent Basic Info
  agent_name: string;
  agent_type: 'inbound' | 'outbound' | 'both';
  status: 'active' | 'inactive' | 'training';
  
  // AI Configuration
  ai_model: string;
  voice_model: 'alice' | 'bob' | 'charlie' | 'diana' | 'emma';
  language: string;
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
  speaking_speed: number; // 0.5 to 2.0
  
  // Product Training
  assigned_products: string[];
  product_knowledge_files: string[];
  sales_script: string;
  objection_handling_script: string;
  closing_techniques: string[];
  
  // Call Settings
  call_schedule: {
    working_days: string[];
    start_time: string;
    end_time: string;
    timezone: string;
    max_calls_per_day: number;
    call_duration_limit: number; // minutes
  };
  
  // Target Audience
  target_demographics: {
    age_range: { min: number; max: number };
    location: string[];
    interests: string[];
    exclude_dnc: boolean; // Do Not Call list
  };
  
  // Call Behavior
  call_behavior: {
    max_attempts_per_number: number;
    retry_delay_hours: number;
    auto_voicemail_enabled: boolean;
    call_recording_enabled: boolean;
    sentiment_analysis_enabled: boolean;
  };
  
  // Performance Goals
  performance_goals: {
    daily_call_target: number;
    conversion_rate_target: number;
    revenue_target_per_day: number;
    customer_satisfaction_target: number;
  };
  
  // Lead Management
  lead_management: {
    lead_sources: string[];
    lead_qualification_criteria: string[];
    hot_lead_threshold: number;
    follow_up_schedule: string[];
  };
  
  // Compliance
  compliance: {
    record_calls: boolean;
    gdpr_compliant: boolean;
    tcpa_compliant: boolean;
    opt_out_keywords: string[];
    compliance_script: string;
  };
}

export default function AgentSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<AgentSettings>({
    agent_name: 'AI Sales Agent',
    agent_type: 'outbound',
    status: 'active',
    ai_model: 'gpt-4',
    voice_model: 'alice',
    language: 'en-US',
    tone: 'professional',
    speaking_speed: 1.0,
    assigned_products: ['Product A', 'Product B'],
    product_knowledge_files: [],
    sales_script: 'Hello! I am calling from [COMPANY] regarding our [PRODUCT]. We have an exclusive offer that could save you up to 40% on [PRODUCT BENEFIT]. Would you like to hear more?',
    objection_handling_script: 'I understand your concern. Let me address that...',
    closing_techniques: ['Urgency Close', 'Benefit Summary Close', 'Assumptive Close'],
    call_schedule: {
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start_time: '09:00',
      end_time: '17:00',
      timezone: 'America/New_York',
      max_calls_per_day: 100,
      call_duration_limit: 15
    },
    target_demographics: {
      age_range: { min: 25, max: 65 },
      location: ['United States', 'Canada'],
      interests: ['Business', 'Technology', 'Finance'],
      exclude_dnc: true
    },
    call_behavior: {
      max_attempts_per_number: 3,
      retry_delay_hours: 24,
      auto_voicemail_enabled: true,
      call_recording_enabled: true,
      sentiment_analysis_enabled: true
    },
    performance_goals: {
      daily_call_target: 50,
      conversion_rate_target: 15,
      revenue_target_per_day: 1000,
      customer_satisfaction_target: 4.5
    },
    lead_management: {
      lead_sources: ['Website', 'Social Media', 'Referrals'],
      lead_qualification_criteria: ['Budget Confirmed', 'Decision Maker', 'Need Identified'],
      hot_lead_threshold: 80,
      follow_up_schedule: ['1 day', '3 days', '1 week', '2 weeks']
    },
    compliance: {
      record_calls: true,
      gdpr_compliant: true,
      tcpa_compliant: true,
      opt_out_keywords: ['stop', 'remove', 'unsubscribe', 'do not call'],
      compliance_script: 'This call may be recorded for quality purposes. You can opt out at any time by saying stop.'
    }
  });

  useEffect(() => {
    setMounted(true);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      // const response = await axiosInstance.get(`/api/agents/${agentId}/settings/`);
      // setSettings(response.data);
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      setError('Failed to load agent settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await axiosInstance.put(`/api/agents/${agentId}/settings/`, settings);
      setSuccess('Settings updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addToArray = (path: string, value: string) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const finalKey = keys[keys.length - 1];
    if (!current[finalKey].includes(value)) {
      current[finalKey] = [...current[finalKey], value];
      setSettings(newSettings);
    }
  };

  const removeFromArray = (path: string, index: number) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const finalKey = keys[keys.length - 1];
    current[finalKey] = current[finalKey].filter((_: any, i: number) => i !== index);
    setSettings(newSettings);
  };

  const updateArrayItem = (path: string, index: number, value: string) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const finalKey = keys[keys.length - 1];
    current[finalKey][index] = value;
    setSettings(newSettings);
  };

  const handleNestedChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading agent settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Bot },
    { id: 'products', label: 'Product Training', icon: BookOpen },
    { id: 'calling', label: 'Call Settings', icon: Phone },
    { id: 'targeting', label: 'Target Audience', icon: Target },
    { id: 'performance', label: 'Performance', icon: DollarSign },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                AI Agent Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure Agent #{agentId} behavior and capabilities
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto mb-6 border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Basic Agent Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={settings.agent_name}
                    onChange={(e) => setSettings({...settings, agent_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Agent Type</label>
                  <select
                    value={settings.agent_type}
                    onChange={(e) => setSettings({...settings, agent_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="inbound">Inbound Only (Receive Calls)</option>
                    <option value="outbound">Outbound Only (Make Calls)</option>
                    <option value="both">Both Inbound & Outbound</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Voice Model</label>
                  <select
                    value={settings.voice_model}
                    onChange={(e) => setSettings({...settings, voice_model: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="alice">Alice (Female Voice)</option>
                    <option value="bob">Bob (Male Voice)</option>
                    <option value="charlie">Charlie (Deep Voice)</option>
                    <option value="diana">Diana (Soft Voice)</option>
                    <option value="emma">Emma (Professional Voice)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Speaking Tone</label>
                  <select
                    value={settings.tone}
                    onChange={(e) => setSettings({...settings, tone: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Speaking Speed: {settings.speaking_speed}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.speaking_speed}
                    onChange={(e) => setSettings({...settings, speaking_speed: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Product Training Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Product Training & Sales Scripts
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Assigned Products</label>
                <div className="space-y-2">
                  {settings.assigned_products.map((product, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={product}
                        onChange={(e) => updateArrayItem('assigned_products', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFromArray('assigned_products', index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('assigned_products', 'New Product')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Main Sales Script</label>
                <textarea
                  value={settings.sales_script}
                  onChange={(e) => setSettings({...settings, sales_script: e.target.value})}
                  rows={6}
                  placeholder="Enter your main sales script that the agent will use to start conversations..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Objection Handling Script</label>
                <textarea
                  value={settings.objection_handling_script}
                  onChange={(e) => setSettings({...settings, objection_handling_script: e.target.value})}
                  rows={4}
                  placeholder="How should the agent respond to common objections..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Closing Techniques</label>
                <div className="space-y-2">
                  {settings.closing_techniques.map((technique, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={technique}
                        onChange={(e) => updateArrayItem('closing_techniques', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFromArray('closing_techniques', index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('closing_techniques', 'New Closing Technique')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Closing Technique
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Product Knowledge Files</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload product catalogs, brochures, and training materials
                  </p>
                  <button className="mt-2 text-blue-600 dark:text-blue-400 hover:underline">
                    Select Files
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call Settings Tab */}
          {activeTab === 'calling' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Settings & Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Working Days</label>
                  <div className="space-y-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <label key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.call_schedule.working_days.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.call_schedule.working_days, day]
                              : settings.call_schedule.working_days.filter(d => d !== day);
                            handleNestedChange('call_schedule.working_days', newDays);
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Working Hours</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400">Start Time</label>
                      <input
                        type="time"
                        value={settings.call_schedule.start_time}
                        onChange={(e) => handleNestedChange('call_schedule.start_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400">End Time</label>
                      <input
                        type="time"
                        value={settings.call_schedule.end_time}
                        onChange={(e) => handleNestedChange('call_schedule.end_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Max Calls Per Day</label>
                  <input
                    type="number"
                    value={settings.call_schedule.max_calls_per_day}
                    onChange={(e) => handleNestedChange('call_schedule.max_calls_per_day', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Call Duration Limit (minutes)</label>
                  <input
                    type="number"
                    value={settings.call_schedule.call_duration_limit}
                    onChange={(e) => handleNestedChange('call_schedule.call_duration_limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-3">Call Behavior</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Max Attempts Per Number</label>
                    <input
                      type="number"
                      value={settings.call_behavior.max_attempts_per_number}
                      onChange={(e) => handleNestedChange('call_behavior.max_attempts_per_number', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Retry Delay (hours)</label>
                    <input
                      type="number"
                      value={settings.call_behavior.retry_delay_hours}
                      onChange={(e) => handleNestedChange('call_behavior.retry_delay_hours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-3">Automated Features</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.call_behavior.auto_voicemail_enabled}
                      onChange={(e) => handleNestedChange('call_behavior.auto_voicemail_enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span>Leave automatic voicemail messages</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.call_behavior.call_recording_enabled}
                      onChange={(e) => handleNestedChange('call_behavior.call_recording_enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span>Record all calls</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.call_behavior.sentiment_analysis_enabled}
                      onChange={(e) => handleNestedChange('call_behavior.sentiment_analysis_enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable sentiment analysis during calls</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Target Audience Tab */}
          {activeTab === 'targeting' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Audience Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Age Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Minimum Age</label>
                    <input
                      type="number"
                      value={settings.target_demographics.age_range.min}
                      onChange={(e) => handleNestedChange('target_demographics.age_range.min', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Maximum Age</label>
                    <input
                      type="number"
                      value={settings.target_demographics.age_range.max}
                      onChange={(e) => handleNestedChange('target_demographics.age_range.max', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Locations</label>
                <div className="space-y-2">
                  {settings.target_demographics.location.map((location, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => updateArrayItem('target_demographics.location', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFromArray('target_demographics.location', index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('target_demographics.location', 'New Location')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Location
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Interests</label>
                <div className="space-y-2">
                  {settings.target_demographics.interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={interest}
                        onChange={(e) => updateArrayItem('target_demographics.interests', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFromArray('target_demographics.interests', index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('target_demographics.interests', 'New Interest')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Interest
                  </button>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.target_demographics.exclude_dnc}
                    onChange={(e) => handleNestedChange('target_demographics.exclude_dnc', e.target.checked)}
                    className="rounded"
                  />
                  <span>Exclude "Do Not Call" list contacts</span>
                </label>
              </div>
            </div>
          )}

          {/* Performance Goals Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Performance Goals & Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Call Target</label>
                  <input
                    type="number"
                    value={settings.performance_goals.daily_call_target}
                    onChange={(e) => handleNestedChange('performance_goals.daily_call_target', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Conversion Rate Target (%)</label>
                  <input
                    type="number"
                    value={settings.performance_goals.conversion_rate_target}
                    onChange={(e) => handleNestedChange('performance_goals.conversion_rate_target', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Revenue Target ($)</label>
                  <input
                    type="number"
                    value={settings.performance_goals.revenue_target_per_day}
                    onChange={(e) => handleNestedChange('performance_goals.revenue_target_per_day', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Satisfaction Target (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={settings.performance_goals.customer_satisfaction_target}
                    onChange={(e) => handleNestedChange('performance_goals.customer_satisfaction_target', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-3">Lead Management</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Lead Sources</label>
                    <div className="space-y-2">
                      {settings.lead_management.lead_sources.map((source, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={source}
                            onChange={(e) => updateArrayItem('lead_management.lead_sources', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeFromArray('lead_management.lead_sources', index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addToArray('lead_management.lead_sources', 'New Lead Source')}
                        className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Add Lead Source
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Lead Qualification Criteria</label>
                    <div className="space-y-2">
                      {settings.lead_management.lead_qualification_criteria.map((criteria, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={criteria}
                            onChange={(e) => updateArrayItem('lead_management.lead_qualification_criteria', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeFromArray('lead_management.lead_qualification_criteria', index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addToArray('lead_management.lead_qualification_criteria', 'New Criteria')}
                        className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Add Criteria
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Legal Requirements
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.compliance.record_calls}
                    onChange={(e) => handleNestedChange('compliance.record_calls', e.target.checked)}
                    className="rounded"
                  />
                  <span>Record all calls (legal requirement)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.compliance.gdpr_compliant}
                    onChange={(e) => handleNestedChange('compliance.gdpr_compliant', e.target.checked)}
                    className="rounded"
                  />
                  <span>GDPR compliance (European law)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.compliance.tcpa_compliant}
                    onChange={(e) => handleNestedChange('compliance.tcpa_compliant', e.target.checked)}
                    className="rounded"
                  />
                  <span>TCPA compliance (US law)</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Opt-out Keywords</label>
                <div className="space-y-2">
                  {settings.compliance.opt_out_keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateArrayItem('compliance.opt_out_keywords', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFromArray('compliance.opt_out_keywords', index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('compliance.opt_out_keywords', 'new keyword')}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Opt-out Keyword
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Compliance Script (start of every call)</label>
                <textarea
                  value={settings.compliance.compliance_script}
                  onChange={(e) => handleNestedChange('compliance.compliance_script', e.target.value)}
                  rows={3}
                  placeholder="Example: This call may be recorded for quality purposes. You can opt-out at any time by saying 'stop'."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}