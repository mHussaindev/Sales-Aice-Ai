"""
Django Channels WebSocket Consumers for Real-time Call Management
"""

import json
import asyncio
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class CallConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time call updates
    Handles live conversation updates, emotion analysis, and call status changes
    """
    
    async def connect(self):
        """Accept WebSocket connection and join call updates group"""
        self.call_group_name = 'call_updates'
        self.agent_id = None
        
        # Extract agent ID from query parameters if available
        query_params = dict(self.scope['query_string'].decode().split('&'))
        if 'agent_id' in query_params:
            self.agent_id = query_params['agent_id']
        
        # Join call updates group
        await self.channel_layer.group_add(
            self.call_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Real-time call updates connected',
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat()
        }))
        
        print(f"✅ WebSocket connected: Agent {self.agent_id}")

    async def disconnect(self, close_code):
        """Leave call updates group on disconnect"""
        await self.channel_layer.group_discard(
            self.call_group_name,
            self.channel_name
        )
        
        print(f"❌ WebSocket disconnected: Agent {self.agent_id}, Code: {close_code}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            print(f"📡 Received WebSocket message: {message_type} from Agent {self.agent_id}")
            
            # Handle different message types
            if message_type == 'agent_status_update':
                await self.handle_agent_status_update(data)
            elif message_type == 'test_message':
                await self.handle_test_message(data)
            elif message_type == 'join_call':
                await self.handle_join_call(data)
            elif message_type == 'leave_call':
                await self.handle_leave_call(data)
            else:
                print(f"⚠️ Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            print("❌ Invalid JSON received")
        except Exception as e:
            print(f"💥 Error processing message: {str(e)}")

    async def handle_agent_status_update(self, data):
        """Handle agent status change"""
        agent_id = data.get('agent_id')
        status = data.get('status', 'unknown')
        
        # Broadcast status update to all connected clients
        await self.channel_layer.group_send(
            self.call_group_name,
            {
                'type': 'agent_status_broadcast',
                'agent_id': agent_id,
                'status': status,
                'timestamp': data.get('timestamp', datetime.now().isoformat())
            }
        )

    async def handle_test_message(self, data):
        """Handle test message and echo back"""
        await self.send(text_data=json.dumps({
            'type': 'test_response',
            'message': 'WebSocket test successful! 🎉',
            'original_message': data.get('message', ''),
            'agent_id': data.get('agent_id'),
            'timestamp': datetime.now().isoformat()
        }))

    async def handle_join_call(self, data):
        """Handle agent joining a call for monitoring"""
        call_id = data.get('call_id')
        if call_id:
            # Add to call-specific group for live updates
            call_group = f'call_{call_id}'
            await self.channel_layer.group_add(call_group, self.channel_name)
            
            await self.send(text_data=json.dumps({
                'type': 'joined_call',
                'call_id': call_id,
                'message': f'Now monitoring call {call_id}',
                'timestamp': datetime.now().isoformat()
            }))

    async def handle_leave_call(self, data):
        """Handle agent leaving call monitoring"""
        call_id = data.get('call_id')
        if call_id:
            call_group = f'call_{call_id}'
            await self.channel_layer.group_discard(call_group, self.channel_name)

    # Group message handlers (called by group_send)
    async def transcript_update(self, event):
        """Send transcript update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'transcript_update',
            'call_id': event['call_id'],
            'transcript_item': event['transcript_item'],
            'timestamp': event['timestamp']
        }))

    async def emotion_update(self, event):
        """Send emotion analysis update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'emotion_update',
            'call_id': event['call_id'],
            'emotion': event['emotion'],
            'confidence': event['confidence'],
            'timestamp': event['timestamp']
        }))

    async def call_status_update(self, event):
        """Send call status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'call_status_update',
            'call_id': event['call_id'],
            'status': event['status'],
            'duration': event.get('duration'),
            'timestamp': event['timestamp']
        }))

    async def new_call(self, event):
        """Send new call notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_call',
            'call_id': event['call_id'],
            'call_type': event['call_type'],
            'caller_number': event['caller_number'],
            'caller_name': event.get('caller_name', ''),
            'agent_id': event['agent_id'],
            'agent_name': event.get('agent_name', ''),
            'start_time': event['start_time'],
            'timestamp': event['timestamp']
        }))

    async def call_ended(self, event):
        """Send call ended notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'call_ended',
            'call_id': event['call_id'],
            'end_time': event['end_time'],
            'duration': event.get('duration'),
            'outcome': event.get('outcome', 'completed'),
            'timestamp': event['timestamp']
        }))

    async def agent_status_broadcast(self, event):
        """Broadcast agent status change to all clients"""
        await self.send(text_data=json.dumps({
            'type': 'agent_status_update',
            'agent_id': event['agent_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))


class CallMonitorConsumer(AsyncWebsocketConsumer):
    """
    Separate consumer for call monitoring and analytics
    Used by supervisors to monitor multiple calls simultaneously
    """
    
    async def connect(self):
        """Accept WebSocket connection for call monitoring"""
        self.monitor_group_name = 'call_monitor'
        
        # Join monitoring group
        await self.channel_layer.group_add(
            self.monitor_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'monitor_connected',
            'message': 'Call monitoring connected',
            'timestamp': datetime.now().isoformat()
        }))

    async def disconnect(self, close_code):
        """Leave monitoring group on disconnect"""
        await self.channel_layer.group_discard(
            self.monitor_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle monitoring commands"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'start_monitoring_all':
                await self.start_monitoring_all_calls()
            elif message_type == 'stop_monitoring':
                await self.stop_monitoring()
                
        except json.JSONDecodeError:
            pass

    async def start_monitoring_all_calls(self):
        """Start monitoring all active calls"""
        # This would typically fetch active calls from database
        # and join their respective groups
        await self.send(text_data=json.dumps({
            'type': 'monitoring_started',
            'message': 'Monitoring all active calls',
            'timestamp': datetime.now().isoformat()
        }))

    async def stop_monitoring(self):
        """Stop monitoring calls"""
        await self.send(text_data=json.dumps({
            'type': 'monitoring_stopped',
            'message': 'Call monitoring stopped',
            'timestamp': datetime.now().isoformat()
        }))

    # Message handlers for monitoring
    async def call_analytics_update(self, event):
        """Send call analytics to monitoring dashboard"""
        await self.send(text_data=json.dumps({
            'type': 'call_analytics',
            'analytics': event['analytics'],
            'timestamp': event['timestamp']
        }))


# Utility functions for sending WebSocket messages from Django views
class WebSocketNotifier:
    """
    Helper class to send WebSocket notifications from Django views/services
    """
    
    @staticmethod
    async def send_transcript_update(call_id, transcript_item):
        """Send transcript update to WebSocket clients"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            await channel_layer.group_send(
                'call_updates',
                {
                    'type': 'transcript_update',
                    'call_id': call_id,
                    'transcript_item': transcript_item,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
            # Also send to call-specific group
            await channel_layer.group_send(
                f'call_{call_id}',
                {
                    'type': 'transcript_update',
                    'call_id': call_id,
                    'transcript_item': transcript_item,
                    'timestamp': datetime.now().isoformat()
                }
            )

    @staticmethod
    async def send_emotion_update(call_id, emotion, confidence):
        """Send emotion analysis update to WebSocket clients"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            await channel_layer.group_send(
                'call_updates',
                {
                    'type': 'emotion_update',
                    'call_id': call_id,
                    'emotion': {
                        'emotion': emotion,
                        'confidence': confidence,
                        'timestamp': datetime.now().timestamp() * 1000  # JavaScript timestamp
                    },
                    'timestamp': datetime.now().isoformat()
                }
            )

    @staticmethod
    async def send_new_call_notification(call_data):
        """Send new call notification to WebSocket clients"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            await channel_layer.group_send(
                'call_updates',
                {
                    'type': 'new_call',
                    'call_id': call_data['call_id'],
                    'call_type': call_data.get('call_type', 'inbound'),
                    'caller_number': call_data['caller_number'],
                    'caller_name': call_data.get('caller_name', ''),
                    'agent_id': call_data['agent_id'],
                    'agent_name': call_data.get('agent_name', ''),
                    'start_time': call_data.get('start_time', datetime.now().isoformat()),
                    'timestamp': datetime.now().isoformat()
                }
            )

    @staticmethod
    async def send_call_ended_notification(call_id, end_time=None, duration=None, outcome=None):
        """Send call ended notification to WebSocket clients"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            await channel_layer.group_send(
                'call_updates',
                {
                    'type': 'call_ended',
                    'call_id': call_id,
                    'end_time': end_time or datetime.now().isoformat(),
                    'duration': duration,
                    'outcome': outcome or 'completed',
                    'timestamp': datetime.now().isoformat()
                }
            )


# Example usage in Django views:
"""
# In your Django views or services:

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

# Send transcript update
async_to_sync(WebSocketNotifier.send_transcript_update)(
    call_id='call_123',
    transcript_item={
        'session_id': 'call_123',
        'speaker': 'agent',
        'message': 'Hello, how can I help you today?',
        'timestamp': datetime.now().isoformat()
    }
)

# Send emotion update
async_to_sync(WebSocketNotifier.send_emotion_update)(
    call_id='call_123',
    emotion='positive',
    confidence=0.89
)

# Send new call notification
async_to_sync(WebSocketNotifier.send_new_call_notification)({
    'call_id': 'call_124',
    'call_type': 'inbound',
    'caller_number': '+1234567890',
    'caller_name': 'John Doe',
    'agent_id': 'agent_1',
    'agent_name': 'Alice Smith'
})
"""