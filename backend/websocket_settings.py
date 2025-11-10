"""
Django Channels Configuration for WebSocket Support
Add these settings to your Django settings.py file
"""

# WebSocket Configuration
ASGI_APPLICATION = 'your_project_name.asgi.application'  # Replace with your project name

# Channel layers configuration for Redis
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],  # Redis server configuration
            "capacity": 1500,  # Maximum number of messages in a channel
            "expiry": 60,  # Message expiry time in seconds
        },
    },
}

# Alternative: In-memory channel layer for development (not recommended for production)
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer'
#     }
# }

# WebSocket allowed hosts (add your domain)
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'your-domain.com']

# CORS settings for WebSocket connections
CORS_ALLOW_ALL_ORIGINS = True  # For development only
CORS_ALLOWED_ORIGINS = [
    "http://https://salesaiceailive-production.up.railway.app/",  # Next.js development server
    "https://your-domain.com",  # Production domain
]

# WebSocket specific settings
WEBSOCKET_ACCEPT_ALL = True  # For development

# Logging configuration for WebSocket debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'backend.consumers': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}