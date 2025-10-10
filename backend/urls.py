# urls.py - URL Configuration for Stripe Webhooks
from django.urls import path
from . import webhooks

urlpatterns = [
    # Stripe webhook endpoint
    path('webhooks/stripe/', webhooks.stripe_webhook, name='stripe_webhook'),
    
    # Health check for webhook
    path('webhooks/health/', webhooks.webhook_health, name='webhook_health'),
]

# Add these URLs to your main urls.py:
# 
# from django.urls import path, include
# 
# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/', include('your_app.urls')),  # Replace 'your_app' with your app name
#     # ... other paths
# ]