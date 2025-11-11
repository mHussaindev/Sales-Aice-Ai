'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Play, Pause, 
  Clock, User, Calendar, Activity, Mic, MicOff, Volume2, VolumeX,
  MessageSquare, Heart, Brain, Target, TrendingUp, CheckCircle,
  AlertCircle, XCircle, Timer, Users, Download, Upload, Plus,
  Search, Filter, RefreshCw, Eye, MoreVertical, PhoneMissed, Wifi,
  WifiOff
} from 'lucide-react';
import { axiosInstance } from '../../utils/axiosInstance';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useUserRoute } from '../../hooks/useProtectedRoute';

interface Agent {
  id: string;  // ✅ UUID string (not number to avoid scientific notation)
  name: string;
  email: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  current_calls: number;
}
interface Transcript {
  session_id: string;
  speaker: 'agent' | 'caller' | 'customer';
  message: string;
  timestamp: string;  
}

// TranscriptItem supports either structured Transcript objects (from API)
// or legacy/mock strings. Renderers will handle both.
type TranscriptItem = Transcript | string;
interface CallData {
  call_id?: string;
  type: 'inbound' | 'outbound' | 'outbound_api';
  call_sid?: string;
  from_number?: string;
  to_number?: string;
  customer_name?: string;
  status: 'active' | 'completed' | 'failed' | 'pending' | 'in_progress' | 'initiated' | 'ringing';  // ✅ Added initiated/ringing
  duration?: number;
  agent?: {
    id: string;
    name: string;
  };
  hume_session_id?: string | null;
  live_transcript?: Array<{
    role: 'system' | 'user' | 'assistant';
    message: string;
    emotion_scores: Record<string, any>;
    sentiment: string | null;
    confidence: number;
    timestamp: string;
  }>;
  started_at?: string | null;
  ended_at?: string | null;
  
  // Legacy fields for backward compatibility
  id?: string;
  caller_number?: string;
  caller_name?: string;
  start_time?: string;
  end_time?: string;
  transcript?: TranscriptItem[];
  emotions?: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
  outcome?: 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'converted' | 'not_interested';
  summary?: string;
  agent_id?: string;
  agent_name?: string;
  scheduled_time?: string;
}

interface QuickCallData {
  phone_number: string;
  caller_name?: string;
  notes?: string;
}

// Helper functions for backward compatibility
const getCallId = (call: CallData): string => call.call_id || call.id || '';
const getCallerNumber = (call: CallData): string => call.to_number || call.caller_number || '';
const getCallerName = (call: CallData): string => call.customer_name || call.caller_name || '';
const getStartTime = (call: CallData): string => call.started_at || call.start_time || '';
const getEndTime = (call: CallData): string => call.ended_at || call.end_time || '';
const getAgentId = (call: CallData): string => call.agent?.id || call.agent_id || '';
const getAgentName = (call: CallData): string => call.agent?.name || call.agent_name || '';
const getTranscript = (call: CallData): TranscriptItem[] => {
  if (call.live_transcript && call.live_transcript.length > 0) {
    return call.live_transcript.map(item => ({
      session_id: getCallId(call),
      speaker: item.role === 'assistant' ? 'agent' : (item.role === 'user' ? 'caller' : 'system') as 'agent' | 'caller' | 'customer',
      message: item.message,
      timestamp: item.timestamp
    }));
  }
  return call.transcript || [];
};
const getEmotions = (call: CallData): Array<{timestamp: number, emotion: string, confidence: number}> => {
  if (call.live_transcript && call.live_transcript.length > 0) {
    return call.live_transcript
      .filter(item => item.emotion_scores && Object.keys(item.emotion_scores).length > 0)
      .map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        emotion: Object.keys(item.emotion_scores)[0] || 'neutral',
        confidence: item.confidence || 0.8
      }));
  }
  return call.emotions || [];
};

export default function CallPanelPage() {
  const { theme } = useTheme();
  const { isAuthorized, isLoading: authLoading, user } = useUserRoute();
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [outboundSubTab, setOutboundSubTab] = useState<'quick' | 'scheduled'>('quick');
  
  // Call states
  const [activeCalls, setActiveCalls] = useState<CallData[]>([]);
  const [callHistory, setCallHistory] = useState<CallData[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<CallData[]>([]);
  
  // Agent management
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgentId, setCurrentAgentId] = useState<string>('');
  const [agentStatus, setAgentStatus] = useState<'active' | 'inactive' | 'busy'>('active');
  const [isAutoAnswer, setIsAutoAnswer] = useState(true);
  
  // Quick call form
  const [quickCallForm, setQuickCallForm] = useState<QuickCallData>({
    phone_number: '',
    caller_name: '',
    notes: ''
  });
  const [isQuickCalling, setIsQuickCalling] = useState(false);
  
  // Real-time updates
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket configuration
  const { connected, error: wsError, connect, disconnect, sendMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://https://salesaiceailive-production.up.railway.app/ws/calls/',
    onMessage: (data) => {
      console.log('📡 WebSocket message received:', data);
      handleRealtimeMessage(data);
    },
    onConnect: () => {
      console.log('✅ WebSocket connected for real-time call updates');
      setWsConnected(true);
    },
    onDisconnect: () => {
      console.log('❌ WebSocket disconnected');
      setWsConnected(false);
    },
    onError: (error) => {
      // Reduce noise - only log significant errors
      if (error instanceof Event && error.type === 'error') {
        // Skip logging for normal reconnection errors
        return;
      }
      console.error('🚫 WebSocket error:', error);
      setWsConnected(false);
    },
    reconnectAttempts: 5, // Reduced from 10
    reconnectInterval: 3000 // Increased from 2000 to reduce reconnection spam
  });

  // Handle real-time messages from WebSocket
  const handleRealtimeMessage = (data: any) => {
    switch (data.type) {
      case 'connection_established':
        // WebSocket connection confirmation - no action needed
        console.log('✅ WebSocket authenticated:', data.authenticated);
        break;
      case 'transcript_update':
        handleTranscriptUpdate(data);
        break;
      case 'emotion_update':
        handleEmotionUpdate(data);
        break;
      case 'call_status_update':
        handleCallStatusUpdate(data);
        break;
      case 'new_call':
        handleNewCall(data);
        break;
      case 'call_ended':
        handleCallEnded(data);
        break;
      case 'connection_error':
        console.error('WebSocket connection error:', data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Handle transcript updates
  const handleTranscriptUpdate = (data: any) => {
    const { call_id, transcript_item } = data;
    setActiveCalls(prevCalls => 
      prevCalls.map(call => {
        if (getCallId(call) === call_id) {
          const currentTranscript = getTranscript(call);
          return {
            ...call,
            transcript: [...currentTranscript, transcript_item],
            live_transcript: call.live_transcript ? [...call.live_transcript, {
              role: transcript_item.speaker === 'agent' ? 'assistant' : 'user',
              message: transcript_item.message,
              emotion_scores: {},
              sentiment: null,
              confidence: 0.8,
              timestamp: transcript_item.timestamp
            }] : undefined
          };
        }
        return call;
      })
    );
  };

  // Handle emotion updates
  const handleEmotionUpdate = (data: any) => {
    const { call_id, emotion } = data;
    setActiveCalls(prevCalls => 
      prevCalls.map(call => {
        if (getCallId(call) === call_id) {
          const currentEmotions = getEmotions(call);
          return {
            ...call,
            emotions: [...currentEmotions, emotion]
          };
        }
        return call;
      })
    );
  };

  // Handle call status updates
  const handleCallStatusUpdate = (data: any) => {
    const { call_id, status, duration } = data;
    setActiveCalls(prevCalls => 
      prevCalls.map(call => {
        if (getCallId(call) === call_id) {
          return {
            ...call,
            status,
            duration
          };
        }
        return call;
      })
    );
  };

  // Handle new incoming calls
  const handleNewCall = (data: any) => {
    const newCall: CallData = {
      call_id: data.call_id,
      type: data.call_type || 'inbound',
      call_sid: data.call_sid || `CALL_${Date.now()}`,
      from_number: data.from_number || data.caller_number || '',
      to_number: data.to_number || '',
      customer_name: data.caller_name || 'Unknown Caller',
      status: 'active',
      duration: 0,
      agent: {
        id: data.agent_id || '',
        name: data.agent_name || 'Unknown Agent'
      },
      hume_session_id: data.hume_session_id || null,
      live_transcript: [],
      started_at: data.start_time || new Date().toISOString(),
      ended_at: null,
      // Legacy fields for compatibility
      id: data.call_id,
      caller_number: data.caller_number,
      caller_name: data.caller_name || 'Unknown Caller',
      start_time: data.start_time || new Date().toISOString(),
      transcript: [],
      emotions: [],
      agent_id: data.agent_id,
      agent_name: data.agent_name || 'Unknown Agent'
    };
    
    setActiveCalls(prev => [newCall, ...prev]);
    
    // Show notification for new incoming call
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Incoming Call', {
        body: `Call from ${getCallerName(newCall) || getCallerNumber(newCall)}`,
        icon: '/favicon.ico'
      });
    }
  };

  // Handle call ended
  const handleCallEnded = (data: any) => {
    const { call_id } = data;
    const endedCall = activeCalls.find(call => getCallId(call) === call_id);
    
    if (endedCall) {
      const completedCall: CallData = {
        ...endedCall,
        status: 'completed',
        ended_at: data.end_time || new Date().toISOString(),
        duration: data.duration,
        end_time: data.end_time || new Date().toISOString(),
        outcome: data.outcome || 'answered'
      };
      
      setCallHistory(prev => [completedCall, ...prev]);
      setActiveCalls(prev => prev.filter(call => getCallId(call) !== call_id));
    }
  };

  useEffect(() => {
    // Only load data once on mount
    let hasLoaded = false;
    if (!hasLoaded) {
      hasLoaded = true;
      loadCallData();
      testAgentAPI(); // Test agent API endpoints on page load
      
    }
    
    // Connect to WebSocket for real-time updates
    connect();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // 🔴 LIVE POLLING: Poll for real-time transcript updates every 2 seconds
    const livePollingInterval = setInterval(() => {
      console.log('🕒 Polling for live transcript updates...');
      loadActiveCalls(); // Always poll - API filters active calls
    }, 2000); // Poll every 2 seconds for live transcript
    
    // Fallback: Load full call data every 10 seconds
    const fullDataInterval = setInterval(() => {
      console.log('🔄 Loading full call data (fallback)...');
      loadCallData();
    }, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(livePollingInterval);
      clearInterval(fullDataInterval);
      disconnect();
    };
  }, []); // Empty dependency array - run only once

  // Connect/reconnect WebSocket when component mounts or reconnects
  useEffect(() => {
    if (!connected && !wsConnected) {
      console.log('🔌 Attempting to connect WebSocket...');
      connect();
    }
  }, [connected, wsConnected]);

  const fetchAgentStatus = async (): Promise<Agent[]> => {
     try {
          const response = await axiosInstance.get('/api/agents/status/');
          // Handle the response format: { success: true, data: [...], count: 13 }
          if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
          }
          return response.data;
        } catch (error) {
          console.error('Error fetching agent status:', error);
          throw new Error('Failed to fetch agent status from server');
        }   
  };
  const fetchCallData = async (): Promise<CallData[]> => {
     try {
          const response = await axiosInstance.get('/api/hume-twilio/dashboard/active-calls/');
          return response.data.active_calls;
        } catch (error) {
          console.error('Error fetching call data:', error);
          throw new Error('Failed to fetch call data from server');
        }   
  };
  const loadCallData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting loadCallData...');

      // const agentStatusData = await fetchAgentStatus();     
      // if (Array.isArray(agentStatusData) && agentStatusData.length > 0) {
      //   setAgents(agentStatusData);       
      //   if (!currentAgentId) {
      //     const firstAgentId = String(agentStatusData[0].id);
      //     setCurrentAgentId(firstAgentId);         
      //   }
      // } else {        
      //   setAgents([]);
      // }
      // Use real API data only
      // if (agentCallData && Array.isArray(agentCallData) && agentCallData.length > 0) {
      //   console.log('✅ Using real API data:', agentCallData.length, 'calls');
        
      //   // ✅ MAP direction → type for all calls (API returns "direction", frontend uses "type")
      //   const mappedCallData = agentCallData.map((call: any) => ({
      //     ...call,
      //     type: call.direction || call.type || 'outbound',  // Map direction to type
      //     call_id: call.call_id || call.id,  // Ensure call_id exists
      //   }));
        
      //   // Separate calls by status and type
      //   const activeCallsFromApi = mappedCallData.filter(call => 
      //     call.status === 'active' || call.status === 'in_progress' || 
      //     call.status === 'initiated' || call.status === 'ringing'  // ✅ Include initiated/ringing
      //   );
      //   const scheduledCallsFromApi = mappedCallData.filter(call => 
      //     call.status === 'pending'
      //   );
      //   const historyCallsFromApi = mappedCallData.filter(call => 
      //     call.status === 'completed' || call.status === 'failed'
      //   );
        
        
        
      //   setActiveCalls(activeCallsFromApi);
      //   setScheduledCalls(scheduledCallsFromApi);
      //   setCallHistory(historyCallsFromApi);
      // } else {
      //   console.log('⚠️ No call data available from API');
      //   setActiveCalls([]);
      //   setScheduledCalls([]);
      //   setCallHistory([]);
      // }

    } catch (error) {
      console.error('Error loading call data:', error);
      setError('Failed to load call data');
    } finally {
      setLoading(false);
      console.log('✅ loadCallData completed');
    }
  };

  // Helper function to test API endpoints
  const testAgentAPI = async () => {
    console.log('🧪 Testing agent API endpoints...');

    const agentStatusData = await fetchAgentStatus();     
      if (Array.isArray(agentStatusData) && agentStatusData.length > 0) {
        setAgents(agentStatusData);       
        if (!currentAgentId) {
          const firstAgentId = String(agentStatusData[0].id);
          setCurrentAgentId(firstAgentId);         
        }
      } else {        
        setAgents([]);
      }
    
    try {
      // Test outbound agents endpoint
      const outboundResp = await axiosInstance.get('/api/agents/outbound/');
      console.log('✅ /api/agents/outbound response:', outboundResp.data);
    } catch (error) {
      console.log('❌ /api/agents/outbound failed:', error);
    }
    
    try {
      // Test general agents endpoint
      const generalResp = await axiosInstance.get('/api/agents/');
      console.log('✅ /api/agents/ response:', generalResp.data);
    } catch (error) {
      console.log('❌ /api/agents/ failed:', error);
    }
  };

  const loadActiveCalls = async () => {
    try {
      // 🔴 LIVE POLLING: Fetch latest transcript updates for active calls
      const response = await axiosInstance.get('/api/hume-twilio/dashboard/live-updates/');

      if (response.data.success && response.data.live_calls) {
        const liveCallsFromApi = response.data.live_calls;
        // Update existing active calls with latest transcript
        setActiveCalls(prevCalls => {
          // 🔒 IMPORTANT: Keep local calls that might not be in API yet
          // Only keep calls that are less than 30 seconds old OR already in API response
          const apiCallIds = liveCallsFromApi.map((c: any) => c.call_id);
          const now = Date.now();
          
          // Keep existing local calls that are:
          // 1. In API response (will be updated below)
          // 2. NOT in API but recently created (< 30 seconds old)
          const updatedCalls = prevCalls.filter(call => {
            const callAge = now - new Date(getStartTime(call)).getTime();
            const isRecent = callAge < 30000; // 30 seconds
            const isInApi = apiCallIds.includes(call.call_id);
            
            if (!isInApi && !isRecent) {
              console.log(`🗑️ Removing stale call ${call.call_id} (age: ${Math.round(callAge/1000)}s)`);
              return false;
            }
            
            if (!isInApi && isRecent) {
              console.log(`🔒 Keeping recent local call ${call.call_id} (age: ${Math.round(callAge/1000)}s, not in API yet)`);
            }
            
            return true;
          });
          
          liveCallsFromApi.forEach((liveCall: any) => {
            console.log(`🔄 Processing live call update:`, {
              call_id: liveCall.call_id,
              has_latest_transcript: !!liveCall.latest_transcript,
              transcript_count: liveCall.latest_transcript?.length || 0,
              transcript_preview: liveCall.latest_transcript?.slice(0, 2)
            });
            
            const existingIndex = updatedCalls.findIndex(
              call => call.call_id === liveCall.call_id || call.call_sid === liveCall.call_sid
            );
            
            // ✅ Map latest_transcript from API to live_transcript in frontend
            const mappedTranscript = liveCall.latest_transcript?.map((item: any) => ({
              role: item.role,
              message: item.message,
              emotion_scores: item.emotion_scores || {},
              sentiment: item.sentiment || null,
              confidence: item.confidence || 0.8,
              timestamp: item.timestamp
            })) || [];
            
            console.log(`📝 Mapped transcript for call ${liveCall.call_id}:`, {
              original_count: liveCall.latest_transcript?.length || 0,
              mapped_count: mappedTranscript.length,
              mapped_preview: mappedTranscript.slice(0, 2)
            });
            
            if (existingIndex !== -1) {
              // Update existing call with latest transcript and status
              updatedCalls[existingIndex] = {
                ...updatedCalls[existingIndex],
                status: liveCall.status,
                duration: liveCall.duration,
                type: liveCall.direction || updatedCalls[existingIndex].type,  // ✅ Use direction from API
                live_transcript: mappedTranscript,  // ✅ Update with mapped transcript
                agent: {
                  id: liveCall.agent?.id || updatedCalls[existingIndex].agent?.id,
                  name: liveCall.agent?.name || updatedCalls[existingIndex].agent?.name
                }
              };

              console.log(`✅ Updated call ${liveCall.call_id}: ${mappedTranscript.length} transcript messages`);
            } else {
              console.log(`⚠️ Call ${liveCall.call_id} not found in activeCalls (adding it now)`);
              // Add new active call if not found
              updatedCalls.push({
                call_id: liveCall.call_id,
                type: liveCall.direction || 'outbound_api',  // ✅ Use direction from API
                call_sid: liveCall.call_sid,
                from_number: liveCall.from_number,
                to_number: liveCall.to_number,
                customer_name: liveCall.customer_name,
                status: liveCall.status,
                duration: liveCall.duration,
                agent: {
                  id: liveCall.agent?.id,
                  name: liveCall.agent?.name
                },
                hume_session_id: liveCall.hume_session_id,
                live_transcript: mappedTranscript,  // ✅ Set mapped transcript
                started_at: liveCall.started_at,
                ended_at: null,
                // Legacy fields
                id: liveCall.call_id,
                caller_number: liveCall.to_number,
                caller_name: liveCall.customer_name,
                start_time: liveCall.started_at,
                transcript: [],
                emotions: [],
                agent_id: liveCall.agent?.id,
                agent_name: liveCall.agent?.name
              });
            }
          });
          console.log('✅ Active calls updated with live transcript data:');
          updatedCalls.forEach(call => {
            console.log(`   📞 Call ${call.call_id?.substring(0, 8)}:`, {
              type: call.type,
              direction: call.type,
              customer_name: call.customer_name,
              agent_name: call.agent?.name,
              live_transcript_count: call.live_transcript?.length || 0,
              transcript_sample: call.live_transcript?.[0]
            });
          });
          console.log('🔄 Returning updated calls array:', updatedCalls.length, 'calls');
          return updatedCalls;
        });
       
      }
    } catch (error) {
      console.error('❌ Error loading live updates:', error);
    }
  };

  const handleQuickCall = async () => {
    if (!quickCallForm.phone_number) return;

    try {
      setIsQuickCalling(true);

      // Call backend to start the call
      try {
        // Ensure we send a non-empty agent id: prefer the selected agent, otherwise fall back to the first agent in list
        // ✅ CRITICAL: Keep agent ID as string to prevent scientific notation with UUIDs
        const resolvedAgentId = currentAgentId || (agents && agents.length > 0 ? String(agents[0].id) : '');
        
        console.log('🔍 Agent Selection Debug:', {
          currentAgentId,
          currentAgentIdType: typeof currentAgentId,
          resolvedAgentId,
          resolvedAgentIdType: typeof resolvedAgentId,
          availableAgents: agents.map(a => ({ id: a.id, idType: typeof a.id, name: a.name }))
        });
        
        // ✅ Ensure agent_id is always a string (never a number to avoid scientific notation)
        const payload = {
          phone_number: quickCallForm.phone_number,
          agent_id: String(resolvedAgentId),  // ✅ Force string conversion to prevent scientific notation
          customer_name: quickCallForm.caller_name || '',
          //call_type: 'outbound',
          //priority: 'medium'
        };

        // Debug: make it easy to inspect what will be sent (remove or convert to proper logger in prod)
        console.debug('Starting quick call with payload:', payload);

        const resp = await axiosInstance.post('/api/hume-twilio/initiate-call/', payload);

        // Normalize response: try resp.data.call, resp.data.data or resp.data
        const created = resp?.data?.call ?? resp?.data?.data ?? resp?.data;

        if (created && typeof created === 'object') {
          // Ensure created has required fields; if not, fall back below
          const newCall: CallData = {
            call_id: created.call_id ?? created.id ?? `call_${Date.now()}`,
            type: created.type ?? 'outbound',
            call_sid: created.call_sid ?? `CALL_${Date.now()}`,
            from_number: created.from_number ?? '+1234567890',
            to_number: created.to_number ?? quickCallForm.phone_number,
            customer_name: created.customer_name ?? created.caller_name ?? created.receiver_name ?? quickCallForm.caller_name,
            status: created.status ?? 'active',
            duration: created.duration ?? 0,
            agent: {
              id: String(created.agent_id ?? created.agent?.id ?? currentAgentId),
              name: created.agent_name ?? created.agent?.name ?? agents.find(a => String(a.id) === String(currentAgentId))?.name ?? ''
            },
            hume_session_id: created.hume_session_id ?? null,
            live_transcript: created.live_transcript ?? [],
            started_at: created.started_at ?? created.start_time ?? new Date().toISOString(),
            ended_at: null,
            // Legacy fields for compatibility
            id: created.id ?? `call_${Date.now()}`,
            caller_number: created.caller_number ?? quickCallForm.phone_number,
            caller_name: created.caller_name ?? quickCallForm.caller_name,
            start_time: created.start_time ?? new Date().toISOString(),
            transcript: created.transcript ?? [{ session_id: created.id ?? `call_${Date.now()}`, speaker: 'agent', message: 'Call started', timestamp: new Date().toISOString() }],
            emotions: created.emotions ?? [],
            agent_id: String(created.agent_id ?? currentAgentId),
            agent_name: created.agent_name ?? agents.find(a => String(a.id) === String(currentAgentId))?.name ?? ''
          };

          //setActiveCalls(prev => [newCall, ...prev]);
          setQuickCallForm({ phone_number: '', caller_name: '', notes: '' });
        } else {
          // Fallback to local mock when API didn't return a usable object
          const currentAgent = agents.find(agent => String(agent.id) === String(currentAgentId));
          const callId = `call_${Date.now()}`;
          const newCall: CallData = {
            call_id: callId,
            type: 'outbound',
            call_sid: `CALL_${Date.now()}`,
            from_number: '+1234567890',
            to_number: quickCallForm.phone_number,
            customer_name: quickCallForm.caller_name || 'Unknown Customer',
            status: 'active',
            duration: 0,
            agent: {
              id: String(currentAgentId),
              name: currentAgent?.name || 'Unknown Agent'
            },
            hume_session_id: null,
            live_transcript: [{
              role: 'system',
              message: 'Call started',
              emotion_scores: {},
              sentiment: null,
              confidence: 0.8,
              timestamp: new Date().toISOString()
            }],
            started_at: new Date().toISOString(),
            ended_at: null,
            // Legacy fields
            id: callId,
            caller_number: quickCallForm.phone_number,
            caller_name: quickCallForm.caller_name,
            start_time: new Date().toISOString(),
            transcript: [],
            emotions: [{ timestamp: Date.now(), emotion: 'neutral', confidence: 0.8 }],
            agent_id: String(currentAgentId),
            agent_name: currentAgent?.name || 'Unknown Agent'
          };

          setActiveCalls(prev => [...prev, newCall]);
          setQuickCallForm({ phone_number: '', caller_name: '', notes: '' });
        }
      } catch (apiErr) {
        console.warn('Start-call API failed, falling back to local mock', apiErr);
        const currentAgent = agents.find(agent => String(agent.id) === String(currentAgentId));
        const callId = `call_${Date.now()}`;
        const newCall: CallData = {
          call_id: callId,
          type: 'outbound',
          call_sid: `CALL_${Date.now()}`,
          from_number: '+1234567890',
          to_number: quickCallForm.phone_number,
          customer_name: quickCallForm.caller_name || 'Unknown Customer',
          status: 'active',
          duration: 0,
          agent: {
            id: String(currentAgentId),
            name: currentAgent?.name || 'Unknown Agent'
          },
          hume_session_id: null,
          live_transcript: [],
          started_at: new Date().toISOString(),
          ended_at: null,
          // Legacy fields
          id: callId,
          caller_number: quickCallForm.phone_number,
          caller_name: quickCallForm.caller_name,
          start_time: new Date().toISOString(),
          transcript: [],
          emotions: [{ timestamp: Date.now(), emotion: 'neutral', confidence: 0.8 }],
          agent_id: String(currentAgentId),
          agent_name: currentAgent?.name || 'Unknown Agent'
        };

        setActiveCalls(prev => [...prev, newCall]);
        setQuickCallForm({ phone_number: '', caller_name: '', notes: '' });
      }

    } catch (error) {
      console.error('Error making quick call:', error);
      alert('Failed to initiate call');
    } finally {
      setIsQuickCalling(false);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      console.log('🔚 Ending call:', callId);
      
      const endedCall = activeCalls.find(call => getCallId(call) === callId);
      if (!endedCall) {
        console.warn('⚠️ Call not found:', callId);
        return;
      }

      // Call backend API to end the call
      try {
        const payload = {
          call_id: callId,
          agent_id: getAgentId(endedCall) || currentAgentId,
          end_reason: 'manual', // or 'completed', 'timeout', etc.
          notes: '' // Optional notes about call ending
        };

        console.log('📞 Calling /api/endcall with payload:', payload);
        
        const response = await axiosInstance.post('/api/endcall/', payload);
        console.log('✅ End call API response:', response.data);

        // Update UI based on API response
        const apiResult = response?.data?.call ?? response?.data?.data ?? response?.data;
        
        const completedCall: CallData = {
          ...endedCall,
          status: 'completed' as const,
          ended_at: new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration: Math.floor((Date.now() - new Date(getStartTime(endedCall)).getTime()) / 1000),
          outcome: apiResult?.outcome === 'converted' || apiResult?.outcome === 'not_interested' || 
                   apiResult?.outcome === 'answered' || apiResult?.outcome === 'voicemail' || 
                   apiResult?.outcome === 'busy' || apiResult?.outcome === 'no_answer' 
                   ? apiResult.outcome 
                   : 'answered', // Default to 'answered' for manual endings
          ...apiResult // Merge any additional data from API
        };

        // Move call from active to history
        setCallHistory(prev => [completedCall, ...prev]);
        setActiveCalls(prev => prev.filter(call => getCallId(call) !== callId));

        console.log('✅ Call ended successfully and moved to history');
        
      } catch (apiError) {
        console.warn('❌ End call API failed, updating UI locally:', apiError);
        
        // Fallback: update UI locally even if API fails
        const completedCall: CallData = {
          ...endedCall,
          status: 'completed' as const,
          ended_at: new Date().toISOString(),
          end_time: new Date().toISOString(),
          duration: Math.floor((Date.now() - new Date(getStartTime(endedCall)).getTime()) / 1000),
          outcome: 'answered' // Default to 'answered' for manual endings
        };

        setCallHistory(prev => [completedCall, ...prev]);
        setActiveCalls(prev => prev.filter(call => getCallId(call) !== callId));
        
        // Still show user that call was ended locally
        console.log('📱 Call ended locally (API unavailable)');
      }

    } catch (error) {
      console.error('💥 Error in handleEndCall:', error);
      
      // Ultimate fallback - at least remove from active calls
      setActiveCalls(prev => prev.filter(call => getCallId(call) !== callId));
    }
  };

  const toggleAgentStatus = async () => {
    const newStatus = agentStatus === 'active' ? 'inactive' : 'active';
    setAgentStatus(newStatus);
    
    // Send status update via WebSocket
    if (wsConnected) {
      sendMessage({
        type: 'agent_status_update',
        agent_id: currentAgentId,
        status: newStatus,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Test WebSocket connection
  const testWebSocketConnection = () => {
    if (wsConnected) {
      sendMessage({
        type: 'test_message',
        agent_id: currentAgentId,
        message: 'Testing WebSocket connection',
        timestamp: new Date().toISOString()
      });
      console.log('📡 Test message sent via WebSocket');
    } else {
      console.warn('⚠️ WebSocket not connected');
      connect(); // Try to reconnect
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy': case 'joy': case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'angry': case 'frustrated': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'sad': case 'disappointed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'excited': case 'enthusiastic': case 'interested': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'calm': case 'neutral': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1220] pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Call Panel</h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-gray-600 dark:text-gray-400">
                  Unified inbound and outbound call management
                </p>
                {/* Real-time Connection Status */}
                <div className="flex items-center space-x-2">
                  {wsConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Real-time Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Real-time Disconnected
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Agent Status Control */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  agentStatus === 'active' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Status: {agentStatus}
                </span>
              </div>
              
              <button
                onClick={toggleAgentStatus}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  agentStatus === 'active'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                }`}
              >
                {agentStatus === 'active' ? 'Deactivate' : 'Activate'} Agent
              </button>
              
              {/* WebSocket Test Button */}
              <button
                onClick={testWebSocketConnection}
                className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg font-medium transition-colors text-sm"
                title="Test WebSocket Connection"
              >
                Test WS
              </button>
            </div>
          </div>
        </div>

        {/* Agents Status Dashboard */}
        <div className="mb-8 bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Status Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{agents.length} Total Agents</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.filter(agent => agent && agent.id).map((agent) => (
              <div key={String(agent.id)} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      agent.status === 'available' ? 'bg-green-500' :
                      agent.status === 'busy' ? 'bg-red-500' :
                      agent.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </span>
                  </div>
                  {String(agent.id) === String(currentAgentId) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded-full font-medium">
                      You
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Status: <span className="capitalize font-medium">{agent.status}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Active Calls: <span className="font-medium">{agent.current_calls}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {agent.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('inbound')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'inbound'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <PhoneIncoming className="h-4 w-4 inline mr-2" />
                Inbound Calls
              </button>
              
              <button
                onClick={() => setActiveTab('outbound')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'outbound'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <PhoneOutgoing className="h-4 w-4 inline mr-2" />
                Outbound Calls
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inbound' ? (
          /* Inbound Tab */
          <div className="space-y-6">
            
            {/* Agent Status Card */}
            <div className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Inbound Call Status
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {agentStatus === 'active' 
                      ? 'Agent is active and will auto-answer calls.'
                      : 'Agent is inactive. Calls will go to voicemail.'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-answer"
                      checked={isAutoAnswer}
                      onChange={(e) => setIsAutoAnswer(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="auto-answer" className="text-sm text-gray-700 dark:text-gray-300">
                      Auto-answer enabled
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Inbound Calls - Agent Cards */}
            {(() => {
              const inboundCalls = activeCalls.filter(call => call.type === 'inbound');
              console.log('🎯 INBOUND FILTER CHECK:', {
                total_active_calls: activeCalls.length,
                inbound_count: inboundCalls.length,
                all_call_types: activeCalls.map(c => ({ id: c.call_id?.substring(0, 8), type: c.type })),
                inbound_calls: inboundCalls.map(c => ({ id: c.call_id?.substring(0, 8), type: c.type }))
              });
              
              return inboundCalls.length === 0 ? (
              <div className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
                <Phone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No Active Inbound Calls
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Agents are ready to receive incoming calls. Auto-answer is {isAutoAnswer ? 'enabled' : 'disabled'}.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${agentStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {agentStatus === 'active' ? 'Ready to receive calls' : 'Agent inactive'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <PhoneIncoming className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Active Inbound Calls ({activeCalls.filter(call => call.type === 'inbound').length})
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 mr-1" />
                    Live Monitoring
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeCalls.filter(call => call.type === 'inbound').map((call) => {
                    const agent = agents.find(a => String(a.id) === String(getAgentId(call)));
                    const callDuration = Math.floor((Date.now() - new Date(getStartTime(call)).getTime()) / 1000);
                    const minutes = Math.floor(callDuration / 60);
                    const seconds = callDuration % 60;
                    
                    // 🔍 Debug: Check transcript data
                    console.log('🔍 Rendering call card:', {
                      call_id: getCallId(call),
                      has_live_transcript: !!call.live_transcript,
                      live_transcript_count: call.live_transcript?.length || 0,
                      transcript_sample: call.live_transcript?.slice(0, 2),
                      getTranscript_result: getTranscript(call)?.slice(0, 2),
                      getTranscript_count: getTranscript(call)?.length || 0
                    });
                    
                    return (
                      <div key={getCallId(call)} className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                        {/* Agent Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {getAgentName(call) || `Agent ${getAgentId(call)}`}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                                    <span className="text-green-600 dark:text-green-400 font-medium">Answering Call</span>
                                  </div>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
                                INBOUND
                              </div>
                              <button
                                onClick={() => {/* Monitor call */}}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded-lg transition-colors"
                                title="Monitor Call"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEndCall(getCallId(call))}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 rounded-lg transition-colors"
                                title="End Call"
                              >
                                <PhoneMissed className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Caller Info */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <PhoneIncoming className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {getCallerName(call) || 'Unknown Caller'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getCallerNumber(call)}
                              </p>
                            </div>
                            <div className="ml-auto">
                              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                                Incoming
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Live Conversation */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1 text-green-600" />
                              Live Conversation
                            </h5>
                            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                              Real-time
                            </div>
                          </div>
                          
                          <div 
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2"
                            ref={(el) => {
                              if (el) {
                                // Auto-scroll to bottom when new messages arrive
                                el.scrollTop = el.scrollHeight;
                              }
                            }}
                          >
                            {(() => {
                              const transcriptData = getTranscript(call);
                              console.log('📋 TRANSCRIPT RENDER DEBUG:', {
                                call_id: getCallId(call),
                                has_live_transcript_raw: !!call.live_transcript,
                                live_transcript_count_raw: call.live_transcript?.length || 0,
                                live_transcript_sample: call.live_transcript?.slice(0, 2),
                                transcript_exists: !!transcriptData,
                                transcript_length: transcriptData?.length || 0,
                                transcript_sample: transcriptData?.slice(0, 2),
                                condition_will_render: transcriptData && transcriptData.length > 0
                              });
                              
                              return (transcriptData && transcriptData.length > 0) ? (
                                transcriptData.map((item, index) => {
                                  const isString = typeof item === 'string';
                                  const isAgent = isString ? (item as string).startsWith('Agent') : (item as Transcript).speaker === 'agent';
                                  const content = isString ? (item as string).replace(/^Agent.*?:\s*/, '').replace(/^Customer:\s*/, '') : (item as Transcript).message;
                                  const label = isAgent ? 'Agent' : (isString ? 'Caller' : ((item as Transcript).speaker === 'caller' ? 'Caller' : 'Customer'));
                                  return (
                                    <div key={`${getCallId(call)}-transcript-${index}`} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                        isAgent 
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                                    }`}>
                                      <div className={`text-xs font-medium mb-1 ${isAgent ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {label}
                                      </div>
                                      {content}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                                Call just started, waiting for conversation...
                              </p>
                            );
                            })()}
                          </div>
                          
                          {/* Emotion Analysis */}
                          {call.emotions && call.emotions.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                  <Brain className="h-4 w-4 mr-1 text-purple-600" />
                                  AI Emotion Analysis
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {call.emotions.slice(-3).map((emotion, index) => (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(emotion.emotion)}`}
                                  >
                                    {emotion.emotion} ({Math.round(emotion.confidence * 100)}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })()}

            {/* Recent Inbound Call History */}
            <div className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Inbound Calls
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                    View All History
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {callHistory.filter(call => call.type === 'inbound').slice(0, 5).map((call) => (
                  <div key={call.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <PhoneIncoming className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {call.caller_name || call.caller_number}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(getStartTime(call) || new Date()).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.outcome || call.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {call.duration ? `${Math.round(call.duration / 60)}m` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Outbound Tab */
          <div className="space-y-6">
            
            {/* Outbound Sub-tabs */}
            <div className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="flex">
                  <button
                    onClick={() => setOutboundSubTab('quick')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      outboundSubTab === 'quick'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Phone className="h-4 w-4 inline mr-2" />
                    Quick Call
                  </button>
                  
                  <button
                    onClick={() => setOutboundSubTab('scheduled')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      outboundSubTab === 'scheduled'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Scheduled/Bulk Calls
                  </button>
                </nav>
              </div>
              
              {outboundSubTab === 'quick' ? (
                /* Quick Call Section */
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Make Quick Outbound Call
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={quickCallForm.phone_number}
                        onChange={(e) => setQuickCallForm(prev => ({
                          ...prev,
                          phone_number: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1234567890"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contact Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={quickCallForm.caller_name}
                        onChange={(e) => setQuickCallForm(prev => ({
                          ...prev,
                          caller_name: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assigned Agent
                      </label>
                      <select
                        value={String(currentAgentId)}
                        onChange={(e) => {
                          console.log('🔄 Agent selection changed to:', e.target.value);
                          setCurrentAgentId(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {/* Show all agents from API */}
                        {(() => {
                          console.log('🔍 Dropdown render - agents:', agents.length, 'currentAgentId:', currentAgentId);
                          return agents.length > 0 ? (
                            agents.map((agent) => {
                              console.log('🏷️ Rendering agent option:', agent.name, 'ID:', agent.id);
                              return (
                                <option key={agent.id} value={String(agent.id)}>
                                  {agent.name || `Agent ${agent.id}`}
                                  {String(agent.id) === String(currentAgentId) ? ' (You)' : ''}
                                  {agent.status ? ` - ${agent.status}` : ''}
                                </option>
                              );
                            })
                          ) : (
                            <option value="">No agents available</option>
                          );
                        })()}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={handleQuickCall}
                        disabled={!quickCallForm.phone_number || isQuickCalling}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {isQuickCalling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Calling...
                          </>
                        ) : (
                          <>
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Start Call
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={quickCallForm.notes}
                      onChange={(e) => setQuickCallForm(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about this call..."
                    />
                  </div>
                </div>
              ) : (
                /* Scheduled/Bulk Calls Section */
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Scheduled & Bulk Call Queue
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CSV
                      </button>
                      <button 
                        onClick={loadCallData}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Scheduled Calls Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Scheduled Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Assigned Agent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Outcome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#0E1627] divide-y divide-gray-200 dark:divide-gray-800">
                        {scheduledCalls.map((call) => (
                          <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {call.caller_name || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {call.caller_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {call.scheduled_time ? new Date(call.scheduled_time).toLocaleString() : 'ASAP'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                              {call.agent_name || `Agent ${call.agent_id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                                {call.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {call.outcome && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  call.outcome === 'converted' ? 'text-green-600 bg-green-100 dark:bg-green-900/20' :
                                  call.outcome === 'not_interested' ? 'text-red-600 bg-red-100 dark:bg-red-900/20' :
                                  'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
                                }`}>
                                  {call.outcome.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 dark:text-blue-400 hover:underline">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {scheduledCalls.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No scheduled calls
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Upload a CSV file to schedule bulk calls
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Outbound Calls - Agent Cards */}
            {activeCalls.filter(call => call.type === 'outbound' || call.type === 'outbound_api').length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <PhoneOutgoing className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Active Outbound Calls ({activeCalls.filter(call => call.type === 'outbound' || call.type === 'outbound_api').length})
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 mr-1" />
                    Live Monitoring
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeCalls.filter(call => call.type === 'outbound' || call.type === 'outbound_api').map((call) => {
                    const agent = agents.find(a => String(a.id) === String(getAgentId(call)));
                    const callDuration = Math.floor((Date.now() - new Date(getStartTime(call) || new Date()).getTime()) / 1000);
                    const minutes = Math.floor(callDuration / 60);
                    const seconds = callDuration % 60;
                    
                    return (
                      <div key={call.id} className="bg-white dark:bg-[#0E1627] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                        {/* Agent Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {call.agent_name || `Agent ${call.agent_id}`}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                                    <span className="text-red-600 dark:text-red-400 font-medium">On Call</span>
                                  </div>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {/* Monitor call */}}
                                className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                                title="Monitor Call"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEndCall(getCallId(call))}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 rounded-lg transition-colors"
                                title="End Call"
                              >
                                <PhoneMissed className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {call.caller_name || 'Unknown Contact'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {call.caller_number}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Live Conversation */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1 text-green-600" />
                              Live Conversation
                            </h5>
                            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                              Real-time
                            </div>
                          </div>
                          
                          <div 
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2"
                            ref={(el) => {
                              if (el) {
                                // Auto-scroll to bottom when new messages arrive
                                el.scrollTop = el.scrollHeight;
                              }
                            }}
                          >
                            {(() => {
                              const transcriptData = getTranscript(call);
                              console.log('📋 OUTBOUND TRANSCRIPT RENDER:', {
                                call_id: getCallId(call),
                                has_live_transcript_raw: !!call.live_transcript,
                                live_transcript_count: call.live_transcript?.length || 0,
                                transcript_exists: !!transcriptData,
                                transcript_length: transcriptData?.length || 0,
                                transcript_sample: transcriptData?.slice(0, 2)
                              });
                              
                              return (transcriptData && transcriptData.length > 0) ? (
                                transcriptData.map((item, index) => {
                                  const isString = typeof item === 'string';
                                  const isAgent = isString ? (item as string).startsWith('Agent') : (item as Transcript).speaker === 'agent';
                                  const content = isString ? (item as string).replace(/^Agent.*?:\s*/, '').replace(/^Customer:\s*/, '') : (item as Transcript).message;
                                  const label = isAgent ? 'Agent' : (isString ? 'Customer' : ((item as Transcript).speaker === 'customer' ? 'Customer' : 'Caller'));
                                  return (
                                    <div key={`${getCallId(call)}-outbound-transcript-${index}`} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                        isAgent 
                                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                                      }`}>
                                        <div className={`text-xs font-medium mb-1 ${isAgent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                          {label}
                                        </div>
                                        {content}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                                  No conversation yet...
                                </p>
                              );
                            })()}
                          </div>
                          
                          {/* Emotion Analysis */}
                          {(() => {
                            const emotionsData = getEmotions(call);
                            return emotionsData && emotionsData.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                    <Brain className="h-4 w-4 mr-1 text-purple-600" />
                                    AI Emotion Analysis
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {emotionsData.slice(-3).map((emotion, index) => (
                                    <span
                                      key={index}
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(emotion.emotion)}`}
                                    >
                                      {emotion.emotion} ({Math.round(emotion.confidence * 100)}%)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}