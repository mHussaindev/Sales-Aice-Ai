# settings_stripe.py - Stripe Configuration for Django Settings
"""
Add these settings to your Django settings.py file:

1. Add to INSTALLED_APPS:
   - Add your app to INSTALLED_APPS if not already there

2. Add Stripe Configuration:
"""

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY = 'pk_test_...'  # Your Stripe publishable key
STRIPE_SECRET_KEY = 'sk_test_...'       # Your Stripe secret key
STRIPE_WEBHOOK_SECRET = 'whsec_...'     # Your webhook endpoint secret

# Add to LOGGING configuration for webhook monitoring:
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/webhooks.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'webhooks': {  # Replace with your app name
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Database settings (ensure these models are included):
# Make sure to run migrations after adding the models:
# python manage.py makemigrations
# python manage.py migrate

# CORS settings (if using CORS):
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Your Next.js frontend
    "https://your-domain.com",  # Your production domain
]

# CSRF settings for webhooks:
CSRF_TRUSTED_ORIGINS = [
    "https://your-domain.com",
]

# Security settings for production:
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'your-domain.com',
    '.ngrok.io',  # For testing with ngrok
]

"""
Environment Variables (.env file):
Create a .env file in your project root:

STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
"""

# Example of loading from environment variables:
import os
from dotenv import load_dotenv

load_dotenv()

STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')