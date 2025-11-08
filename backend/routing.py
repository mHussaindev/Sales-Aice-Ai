"""
Django Channels Routing Configuration for WebSocket Support
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Real-time call updates
    re_path(r'ws/calls/$', consumers.CallConsumer.as_asgi()),
    
    # Call monitoring for supervisors
    re_path(r'ws/monitor/$', consumers.CallMonitorConsumer.as_asgi()),
    
    # Agent-specific call updates
    re_path(r'ws/calls/(?P<agent_id>\w+)/$', consumers.CallConsumer.as_asgi()),
]