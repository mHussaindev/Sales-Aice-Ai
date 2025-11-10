# Real-Time Call Management System - WebSocket Integration

## Overview
यह system real-time conversation display करता है WebSocket के through। Backend से events आते हैं और frontend पर real-time में show होते हैं।

## Features
✅ **Real-time Conversation Updates** - Live transcript display  
✅ **Emotion Analysis** - Real-time mood detection  
✅ **Call Status Updates** - Live call state changes  
✅ **New Call Notifications** - Instant incoming call alerts  
✅ **Agent Status Management** - Real-time agent availability  
✅ **Auto-scroll Conversations** - Automatic message scrolling  
✅ **Connection Status Indicators** - WebSocket connection monitoring  
✅ **Fallback Polling** - Backup system when WebSocket fails  

## Setup Instructions

### 1. Install Dependencies

#### Backend (Django)
```bash
pip install channels
pip install channels-redis
pip install redis
```

#### Frontend (Next.js)
WebSocket hook already included in `hooks/useWebSocket.tsx`

### 2. Configure Django Settings

Add to your `settings.py`:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'channels',
    'backend',  # Your app name
]

# ASGI Configuration
ASGI_APPLICATION = 'your_project.asgi.application'  # Replace with your project name

# Channel Layers (Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
            "capacity": 1500,
            "expiry": 60,
        },
    },
}

# For development without Redis
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer'
#     }
# }
```

### 3. Setup ASGI Application

Create/Update `asgi.py` in your project root:

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from backend import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})
```

### 4. Environment Variables

Add to `.env.local`:

```bash
# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://https://salesaiceailive-production.up.railway.app/ws/calls/
```

### 5. Start Redis Server

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
redis-server

# macOS
brew install redis
redis-server

# Windows
# Download Redis for Windows or use WSL
```

### 6. Run the Application

#### Backend
```bash
# Start Django with ASGI (for WebSocket support)
python manage.py runserver

# Or use Daphne for production
pip install daphne
daphne your_project.asgi:application -p 8000
```

#### Frontend
```bash
npm run dev
# or
yarn dev
```

## WebSocket Endpoints

### 1. Call Updates
- **URL**: `ws://https://salesaiceailive-production.up.railway.app/ws/calls/`
- **Purpose**: Real-time call updates for all agents

### 2. Agent-Specific Updates
- **URL**: `ws://https://salesaiceailive-production.up.railway.app/ws/calls/{agent_id}/`
- **Purpose**: Updates for specific agent

### 3. Call Monitoring
- **URL**: `ws://https://salesaiceailive-production.up.railway.app/ws/monitor/`
- **Purpose**: Supervisor monitoring dashboard

## Webhook Endpoints

### 1. Transcript Updates
```bash
POST /api/webhooks/transcript/
Content-Type: application/json

{
  "call_id": "call_123",
  "speaker": "agent",  // "agent", "caller", "customer"
  "message": "Hello, how can I help you?",
  "session_id": "call_123"
}
```

### 2. Emotion Updates
```bash
POST /api/webhooks/emotion/
Content-Type: application/json

{
  "call_id": "call_123",
  "emotion": "positive",
  "confidence": 0.89
}
```

### 3. New Call Notifications
```bash
POST /api/webhooks/call-started/
Content-Type: application/json

{
  "call_id": "call_123",
  "call_type": "inbound",
  "caller_number": "+1234567890",
  "caller_name": "John Doe",
  "agent_id": "agent_1",
  "agent_name": "Alice Smith"
}
```

### 4. Call Ended Notifications
```bash
POST /api/webhooks/call-ended/
Content-Type: application/json

{
  "call_id": "call_123",
  "duration": 300,
  "outcome": "completed"
}
```

## Testing WebSocket Integration

### 1. Check WebSocket Status
```bash
GET /api/websocket/status/
```

### 2. Send Test Updates
```bash
POST /api/test/realtime/
Content-Type: application/json

{
  "type": "transcript",
  "call_id": "test_call_123",
  "speaker": "agent",
  "message": "Test message from agent"
}
```

### 3. Frontend Test
Click the "Test WS" button in the Call Panel header to test WebSocket connection.

## Message Types

### From Backend to Frontend

#### 1. Transcript Update
```json
{
  "type": "transcript_update",
  "call_id": "call_123",
  "transcript_item": {
    "session_id": "call_123",
    "speaker": "agent",
    "message": "Hello, how can I help?",
    "timestamp": "2025-01-23T10:30:00Z"
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

#### 2. Emotion Update
```json
{
  "type": "emotion_update",
  "call_id": "call_123",
  "emotion": {
    "emotion": "positive",
    "confidence": 0.89,
    "timestamp": 1642934400000
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

#### 3. New Call
```json
{
  "type": "new_call",
  "call_id": "call_124",
  "call_type": "inbound",
  "caller_number": "+1234567890",
  "caller_name": "Jane Smith",
  "agent_id": "agent_2",
  "agent_name": "Bob Wilson",
  "start_time": "2025-01-23T10:30:00Z"
}
```

### From Frontend to Backend

#### 1. Agent Status Update
```json
{
  "type": "agent_status_update",
  "agent_id": "agent_1",
  "status": "active",
  "timestamp": "2025-01-23T10:30:00Z"
}
```

#### 2. Test Message
```json
{
  "type": "test_message",
  "agent_id": "agent_1",
  "message": "Testing connection",
  "timestamp": "2025-01-23T10:30:00Z"
}
```

## Integration Examples

### 1. With Twilio
```python
# In your Twilio webhook handler
from asgiref.sync import async_to_sync
from backend.consumers import WebSocketNotifier

def twilio_transcript_webhook(request):
    # Process Twilio data
    call_sid = request.POST.get('CallSid')
    speech_result = request.POST.get('SpeechResult')
    
    # Send to WebSocket
    async_to_sync(WebSocketNotifier.send_transcript_update)(
        call_id=call_sid,
        transcript_item={
            'session_id': call_sid,
            'speaker': 'caller',
            'message': speech_result,
            'timestamp': datetime.now().isoformat()
        }
    )
```

### 2. With Voice AI Services
```python
# In your AI processing pipeline
def process_emotion_analysis(call_id, audio_data):
    # Your emotion detection logic
    emotion = detect_emotion(audio_data)
    
    # Send real-time update
    async_to_sync(WebSocketNotifier.send_emotion_update)(
        call_id=call_id,
        emotion=emotion['label'],
        confidence=emotion['confidence']
    )
```

## Frontend Usage

The Call Panel (`app/calls/page.tsx`) automatically:

1. **Connects to WebSocket** on page load
2. **Displays connection status** in header
3. **Auto-scrolls conversations** when new messages arrive
4. **Shows notifications** for new calls (with browser permission)
5. **Falls back to polling** if WebSocket fails
6. **Handles reconnection** automatically

### Key Features:
- ✅ Real-time transcript display
- ✅ Live emotion indicators  
- ✅ Call status updates
- ✅ New call notifications
- ✅ Auto-scroll conversations
- ✅ Connection monitoring
- ✅ Test functionality

## Troubleshooting

### 1. WebSocket Not Connecting
- Check Redis server is running
- Verify ASGI configuration
- Check firewall settings
- Ensure correct WebSocket URL

### 2. Messages Not Appearing
- Check webhook endpoints are accessible
- Verify JSON payload format
- Check Django logs for errors
- Test with `/api/test/realtime/` endpoint

### 3. Connection Drops
- Redis connection issues
- Network connectivity
- Django server restart needed
- Browser blocking WebSocket connections

## Production Considerations

1. **Use Redis for Channel Layers** (not in-memory)
2. **Configure proper CORS settings**
3. **Use WSS (secure WebSocket) in production**
4. **Set up proper authentication for WebSocket connections**
5. **Monitor WebSocket connection health**
6. **Implement rate limiting for webhook endpoints**

## Security

1. **Authentication**: Add token-based auth to WebSocket connections
2. **CORS**: Configure proper CORS settings for WebSocket
3. **Rate Limiting**: Limit webhook endpoint calls
4. **Input Validation**: Validate all incoming webhook data

This system provides a complete real-time conversation experience for your call management platform!