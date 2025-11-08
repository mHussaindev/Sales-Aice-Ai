# urls.py - URL Configuration for Backend APIs and WebSocket Endpoints
from django.urls import path
from . import views
from . import webhooks
from . import realtime_views

urlpatterns = [
    # Call Management APIs
    path('api/calls/', views.call_list_api, name='call_list_api'),
    path('api/calls/data/', views.call_data_api, name='call_data_api'),
    path('api/calls/start-call/', views.start_call_api, name='start_call_api'),
    path('api/endcall/', views.end_call_api, name='end_call_api'),
    
    # Agent Management APIs
    path('api/agents/', views.agents_list_api, name='agents_list_api'),
    path('api/agents/status/', views.agent_status_api, name='agent_status_api'),
    path('api/agents/outbound/', views.outbound_agents_api, name='outbound_agents_api'),
    
    # Real-time WebSocket webhook endpoints
    path('api/webhooks/transcript/', realtime_views.webhook_transcript_update, name='webhook_transcript'),
    path('api/webhooks/emotion/', realtime_views.webhook_emotion_update, name='webhook_emotion'),
    path('api/webhooks/call-started/', realtime_views.webhook_call_started, name='webhook_call_started'),
    path('api/webhooks/call-ended/', realtime_views.webhook_call_ended, name='webhook_call_ended'),
    
    # WebSocket status and testing
    path('api/websocket/status/', realtime_views.websocket_status, name='websocket_status'),
    path('api/test/realtime/', realtime_views.test_realtime_update, name='test_realtime'),
    
    # Stripe webhook
    path('api/webhooks/stripe/', webhooks.stripe_webhook, name='stripe_webhook'),
    
    # Health check for webhook
    path('webhooks/health/', webhooks.webhook_health, name='webhook_health'),
]

# Add these URLs to your main Django project urls.py:
# 
# from django.urls import path, include
# 
# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('', include('backend.urls')),  # Include backend URLs
#     # ... other paths
# ]