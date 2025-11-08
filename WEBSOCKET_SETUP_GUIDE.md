# WebSocket Implementation Guide
## Real-time Call Tracking for AI Agents

This guide explains how to implement WebSocket-based real-time call tracking that shows which agent is handling which call with live updates.

## 🏗️ Architecture Overview

```
Frontend (Next.js) ←→ WebSocket ←→ Django Channels ←→ Redis ←→ Database
```

## 📋 Prerequisites

1. **Redis Server** - Required for Django Channels
2. **Django Channels** - WebSocket support for Django
3. **Next.js Frontend** - Already implemented with WebSocket hooks

## 🚀 Backend Setup (Django)

### Step 1: Install Dependencies

```bash
pip install channels==4.0.0
pip install channels-redis==4.1.0
pip install redis==4.5.4
pip install daphne==4.0.0
```

### Step 2: Update Django Settings

Add to your `settings.py`:

```python
# Add channels to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',  # Add this
    'backend',   # Your app name
]

# ASGI Configuration
ASGI_APPLICATION = 'your_project.asgi.application'

# Channel Layers (Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# CORS for WebSocket
CORS_ALLOW_ALL_ORIGINS = True  # Development only
```

### Step 3: Create ASGI Application

Create `asgi.py` in your project root:

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
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
```

### Step 4: Add WebSocket URL Routing

Create `backend/routing.py`:

```python
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/calls/', consumers.CallUpdatesConsumer.as_asgi()),
]
```

### Step 5: Update Your Agent Model

Add these fields to your Agent model in `models.py`:

```python
class Agent(models.Model):
    # ... existing fields ...
    
    # Real-time tracking fields
    current_call = models.JSONField(null=True, blank=True)
    calls_today = models.IntegerField(default=0)
    online_status = models.CharField(
        max_length=20,
        choices=[
            ('online', 'Online'),
            ('offline', 'Offline'),
            ('busy', 'Busy'),
            ('idle', 'Idle'),
        ],
        default='offline'
    )
```

### Step 6: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 7: Start Redis Server

```bash
# On Windows (if Redis is installed)
redis-server

# On Linux/Mac
sudo systemctl start redis
# or
redis-server
```

### Step 8: Run Django with ASGI

```bash
# Development
python manage.py runserver

# Or with Daphne for production
daphne -p 8000 your_project.asgi:application
```

## 🎯 Frontend Implementation (Already Done)

The frontend implementation is complete with:

✅ **WebSocket Hook** (`hooks/useWebSocket.tsx`)
✅ **Real-time Agent Cards** with call status indicators
✅ **Connection Status** indicator in header
✅ **Auto-reconnection** with exponential backoff

## 📡 Broadcasting Call Events

Use these functions in your Django views to broadcast real-time events:

### When a Call Starts:

```python
from backend.websocket_views import sync_start_call

# In your call handling code
call_id = sync_start_call(
    user_id=request.user.id,
    agent_id=agent_id,
    call_type='inbound',  # or 'outbound'
    customer_phone='+1234567890'
)
```

### When a Call Ends:

```python
from backend.websocket_views import sync_end_call

sync_end_call(
    user_id=request.user.id,
    agent_id=agent_id,
    call_id=call_id,
    duration=120  # seconds
)
```

### When Call Status Changes:

```python
from backend.websocket_views import sync_update_call_status

sync_update_call_status(
    user_id=request.user.id,
    agent_id=agent_id,
    call_id=call_id,
    status='connected'  # 'ringing', 'on_hold', etc.
)
```

### When Agent Status Changes:

```python
from backend.websocket_views import sync_update_agent_status

sync_update_agent_status(
    user_id=request.user.id,
    agent_id=agent_id,
    status='busy'  # 'online', 'offline', 'idle'
)
```

## 🔧 Testing the Implementation

1. **Start Redis**: `redis-server`
2. **Start Django**: `python manage.py runserver`
3. **Start Next.js**: `npm run dev`
4. **Open Agents Page**: Navigate to `/agents`
5. **Check Connection**: Look for "Live" indicator in header
6. **Test Events**: Use Django admin or API to trigger call events

## 🎨 Frontend Features

The agents page now shows:

- **Real-time Connection Status**: Wifi icons showing WebSocket connection
- **Agent Online Status**: Online/Offline/Busy/Idle indicators
- **Current Call Display**: Shows active calls with customer info
- **Live Call Stats**: Today's call count updates in real-time
- **Auto-reconnection**: Automatic WebSocket reconnection on disconnection

## 🔍 Monitoring and Debugging

### WebSocket Connection Logs

Check browser console for:
```
WebSocket connected for call updates
WebSocket message received: {type: 'call_started', ...}
```

### Django Logs

Check Django console for:
```
WebSocket connected for user 123
Broadcasting call event to user 123
```

### Redis Monitoring

```bash
redis-cli monitor
```

## 🚨 Troubleshooting

### Common Issues:

1. **WebSocket Connection Failed**
   - Check if Redis is running
   - Verify ASGI configuration
   - Check CORS settings

2. **No Real-time Updates**
   - Verify WebSocket connection in browser console
   - Check Django Channels logs
   - Ensure event broadcasting is called

3. **Authentication Issues**
   - Verify JWT token is being sent
   - Check token expiration
   - Ensure user authentication in consumer

## 🎯 Integration Points

### Where to Add Event Broadcasting:

1. **Call Initiation**: When Twilio/VoIP calls start
2. **Call Routing**: When calls are assigned to agents
3. **Call Status Updates**: When call status changes in telephony system
4. **Agent Availability**: When agents change status manually

### API Endpoints to Update:

- `POST /api/calls/start/` - Add WebSocket broadcast
- `POST /api/calls/end/` - Add WebSocket broadcast
- `POST /api/agents/status/` - Add WebSocket broadcast
- `PUT /api/agents/{id}/` - Add status change broadcast

## ✨ Result

Users will now see:
- **Real-time agent tracking**: "konsa agent nay call pick ki hai"
- **Live outbound call monitoring**: "outbound call main jab call start hota hai to kon say agent call start kar raha hai"
- **Instant status updates**: No page refresh needed
- **Connection reliability**: Auto-reconnection ensures consistent updates

The system provides complete visibility into which agents are handling which calls in real-time, exactly as requested!