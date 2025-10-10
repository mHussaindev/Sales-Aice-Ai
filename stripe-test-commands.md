# 🧪 Webhook Testing Commands - Copy Paste Karke Run Karo

## Step 1: Stripe CLI Install Karo
# Windows mein PowerShell admin mode mein run karo:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop install stripe

## Step 2: Stripe Account Connect Karo
stripe login

## Step 3: Test Webhook Events
# Basic webhook test:
stripe trigger payment_intent.succeeded

# Subscription webhook test:
stripe trigger customer.subscription.created

# Failed payment test:
stripe trigger payment_intent.payment_failed

## Step 4: Listen to Real Webhooks (Advanced)
# Agar tumhara Django backend chal raha ho:
stripe listen --forward-to localhost:8000/api/webhooks/stripe/

## Test Results Dekhne Ke Liye:
# Browser mein ye URL open karo:
# https://dashboard.stripe.com/test/events

# Yahan tumhein sab webhook events dikhengi