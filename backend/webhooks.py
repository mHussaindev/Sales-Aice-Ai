# webhooks.py - Stripe Webhook Handler for Subscription Management
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import stripe
import json
import logging
from datetime import datetime
from django.utils import timezone

# Configure logging
logger = logging.getLogger(__name__)

# Set Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events for subscription management
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    
    if not endpoint_secret:
        logger.error('❌ STRIPE_WEBHOOK_SECRET not configured')
        return HttpResponseBadRequest('Webhook secret not configured')
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        
        logger.info(f"📡 Received Stripe webhook: {event['type']} - {event['id']}")
        
        # Handle different event types
        event_type = event['type']
        event_data = event['data']['object']
        
        if event_type == 'payment_intent.succeeded':
            handle_payment_succeeded(event_data, event['id'])
            
        elif event_type == 'payment_intent.payment_failed':
            handle_payment_failed(event_data, event['id'])
            
        elif event_type == 'customer.subscription.created':
            handle_subscription_created(event_data, event['id'])
            
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data, event['id'])
            
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_cancelled(event_data, event['id'])
            
        elif event_type == 'invoice.payment_succeeded':
            handle_invoice_paid(event_data, event['id'])
            
        elif event_type == 'invoice.payment_failed':
            handle_invoice_failed(event_data, event['id'])
            
        elif event_type == 'customer.subscription.trial_will_end':
            handle_trial_ending(event_data, event['id'])
            
        else:
            logger.info(f"⚠️ Unhandled event type: {event_type}")
            
        logger.info(f"✅ Successfully processed webhook: {event['id']}")
        return HttpResponse('Webhook processed successfully', status=200)
        
    except ValueError as e:
        logger.error(f"❌ Invalid webhook payload: {e}")
        return HttpResponseBadRequest("Invalid payload")
        
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"❌ Invalid webhook signature: {e}")
        return HttpResponseBadRequest("Invalid signature")
        
    except Exception as e:
        logger.error(f"❌ Webhook processing error: {e}", exc_info=True)
        return HttpResponseBadRequest(f"Webhook error: {str(e)}")

def handle_payment_succeeded(payment_intent, event_id):
    """Handle successful payment - updates subscription status"""
    logger.info(f"✅ Processing payment success: {payment_intent['id']}")
    
    try:
        # Extract metadata
        metadata = payment_intent.get('metadata', {})
        subscription_id = metadata.get('subscription_id')
        package_id = metadata.get('package_id')
        action_type = metadata.get('action_type')
        
        logger.info(f"Payment metadata: subscription_id={subscription_id}, package_id={package_id}, action_type={action_type}")
        
        if subscription_id:
            # Import here to avoid circular imports
            from .models import UserSubscription
            
            try:
                subscription = UserSubscription.objects.get(id=subscription_id)
                
                # Update subscription based on action type
                if action_type == 'subscription_purchase':
                    subscription.status = 'active'
                    subscription.stripe_payment_intent_id = payment_intent['id']
                    
                elif action_type in ['upgrade', 'downgrade']:
                    subscription.status = 'active'
                    if package_id:
                        # Update plan details
                        subscription.plan_id = package_id
                        # Note: You might want to fetch plan details from your Plan model
                        
                subscription.last_payment_date = timezone.now()
                subscription.save()
                
                logger.info(f"✅ Subscription {subscription_id} updated successfully")
                
                # Log webhook event
                log_webhook_event(event_id, 'payment_intent.succeeded', subscription_id, 'success')
                
            except UserSubscription.DoesNotExist:
                logger.error(f"❌ Subscription {subscription_id} not found")
                
        else:
            logger.warning("⚠️ No subscription_id in payment metadata")
            
    except Exception as e:
        logger.error(f"❌ Error processing payment success: {e}", exc_info=True)
        log_webhook_event(event_id, 'payment_intent.succeeded', subscription_id, 'error', str(e))

def handle_payment_failed(payment_intent, event_id):
    """Handle failed payment"""
    logger.warning(f"❌ Processing payment failure: {payment_intent['id']}")
    
    try:
        metadata = payment_intent.get('metadata', {})
        subscription_id = metadata.get('subscription_id')
        
        if subscription_id:
            from .models import UserSubscription
            
            try:
                subscription = UserSubscription.objects.get(id=subscription_id)
                subscription.status = 'past_due'
                subscription.save()
                
                logger.info(f"⚠️ Subscription {subscription_id} marked as past_due")
                log_webhook_event(event_id, 'payment_intent.payment_failed', subscription_id, 'success')
                
            except UserSubscription.DoesNotExist:
                logger.error(f"❌ Subscription {subscription_id} not found")
                
    except Exception as e:
        logger.error(f"❌ Error processing payment failure: {e}", exc_info=True)
        log_webhook_event(event_id, 'payment_intent.payment_failed', subscription_id, 'error', str(e))

def handle_subscription_created(subscription, event_id):
    """Handle new subscription created"""
    logger.info(f"➕ Processing subscription created: {subscription['id']}")
    
    try:
        from .models import UserSubscription
        
        # Find subscription by Stripe subscription ID
        try:
            user_subscription = UserSubscription.objects.get(
                stripe_subscription_id=subscription['id']
            )
            
            # Update subscription details from Stripe
            user_subscription.status = subscription['status']
            user_subscription.current_period_start = datetime.fromtimestamp(
                subscription['current_period_start'], tz=timezone.utc
            )
            user_subscription.current_period_end = datetime.fromtimestamp(
                subscription['current_period_end'], tz=timezone.utc
            )
            user_subscription.cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            
            # Extract plan information from subscription items
            if subscription.get('items', {}).get('data'):
                price_id = subscription['items']['data'][0]['price']['id']
                user_subscription.stripe_price_id = price_id
                
            user_subscription.save()
            
            logger.info(f"✅ Subscription {subscription['id']} updated successfully")
            log_webhook_event(event_id, 'customer.subscription.created', user_subscription.id, 'success')
            
        except UserSubscription.DoesNotExist:
            logger.warning(f"⚠️ UserSubscription not found for Stripe subscription {subscription['id']}")
            
    except Exception as e:
        logger.error(f"❌ Error processing subscription created: {e}", exc_info=True)
        log_webhook_event(event_id, 'customer.subscription.created', None, 'error', str(e))

def handle_subscription_updated(subscription, event_id):
    """Handle subscription changes (plan changes, cancellations, etc.)"""
    logger.info(f"🔄 Processing subscription updated: {subscription['id']}")
    
    try:
        from .models import UserSubscription
        
        try:
            user_subscription = UserSubscription.objects.get(
                stripe_subscription_id=subscription['id']
            )
            
            # Update subscription details
            old_status = user_subscription.status
            user_subscription.status = subscription['status']
            user_subscription.current_period_start = datetime.fromtimestamp(
                subscription['current_period_start'], tz=timezone.utc
            )
            user_subscription.current_period_end = datetime.fromtimestamp(
                subscription['current_period_end'], tz=timezone.utc
            )
            user_subscription.cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            
            # Handle cancellation
            if subscription.get('canceled_at'):
                user_subscription.canceled_at = datetime.fromtimestamp(
                    subscription['canceled_at'], tz=timezone.utc
                )
            
            # Handle plan changes
            if subscription.get('items', {}).get('data'):
                new_price_id = subscription['items']['data'][0]['price']['id']
                if new_price_id != user_subscription.stripe_price_id:
                    logger.info(f"Plan changed from {user_subscription.stripe_price_id} to {new_price_id}")
                    user_subscription.stripe_price_id = new_price_id
                    # Update plan details if needed
                    
            user_subscription.save()
            
            logger.info(f"✅ Subscription {subscription['id']} updated: {old_status} -> {subscription['status']}")
            log_webhook_event(event_id, 'customer.subscription.updated', user_subscription.id, 'success')
            
        except UserSubscription.DoesNotExist:
            logger.error(f"❌ UserSubscription not found for Stripe subscription {subscription['id']}")
            
    except Exception as e:
        logger.error(f"❌ Error processing subscription updated: {e}", exc_info=True)
        log_webhook_event(event_id, 'customer.subscription.updated', None, 'error', str(e))

def handle_subscription_cancelled(subscription, event_id):
    """Handle subscription cancellation"""
    logger.info(f"🗑️ Processing subscription cancelled: {subscription['id']}")
    
    try:
        from .models import UserSubscription
        
        try:
            user_subscription = UserSubscription.objects.get(
                stripe_subscription_id=subscription['id']
            )
            
            user_subscription.status = 'canceled'
            if subscription.get('canceled_at'):
                user_subscription.canceled_at = datetime.fromtimestamp(
                    subscription['canceled_at'], tz=timezone.utc
                )
            
            user_subscription.save()
            
            logger.info(f"✅ Subscription {subscription['id']} marked as canceled")
            log_webhook_event(event_id, 'customer.subscription.deleted', user_subscription.id, 'success')
            
        except UserSubscription.DoesNotExist:
            logger.error(f"❌ UserSubscription not found for Stripe subscription {subscription['id']}")
            
    except Exception as e:
        logger.error(f"❌ Error processing subscription cancellation: {e}", exc_info=True)
        log_webhook_event(event_id, 'customer.subscription.deleted', None, 'error', str(e))

def handle_invoice_paid(invoice, event_id):
    """Handle successful invoice payment"""
    logger.info(f"💰 Processing invoice paid: {invoice['id']}")
    
    try:
        from .models import Invoice, UserSubscription
        
        # Create or update invoice record
        invoice_obj, created = Invoice.objects.get_or_create(
            stripe_invoice_id=invoice['id'],
            defaults={
                'customer_email': invoice.get('customer_email', ''),
                'amount': invoice['amount_paid'] / 100,  # Convert from cents
                'status': 'paid',
                'currency': invoice.get('currency', 'usd'),
                'paid_at': datetime.fromtimestamp(
                    invoice['status_transitions']['paid_at'], tz=timezone.utc
                ) if invoice.get('status_transitions', {}).get('paid_at') else timezone.now()
            }
        )
        
        if not created:
            invoice_obj.status = 'paid'
            invoice_obj.amount = invoice['amount_paid'] / 100
            invoice_obj.paid_at = datetime.fromtimestamp(
                invoice['status_transitions']['paid_at'], tz=timezone.utc
            ) if invoice.get('status_transitions', {}).get('paid_at') else timezone.now()
            invoice_obj.save()
        
        # Update related subscription if exists
        if invoice.get('subscription'):
            try:
                subscription = UserSubscription.objects.get(
                    stripe_subscription_id=invoice['subscription']
                )
                subscription.last_invoice_paid_at = timezone.now()
                subscription.save()
            except UserSubscription.DoesNotExist:
                pass
        
        action = 'created' if created else 'updated'
        logger.info(f"✅ Invoice {invoice['id']} {action} successfully")
        log_webhook_event(event_id, 'invoice.payment_succeeded', None, 'success')
        
    except Exception as e:
        logger.error(f"❌ Error processing invoice payment: {e}", exc_info=True)
        log_webhook_event(event_id, 'invoice.payment_succeeded', None, 'error', str(e))

def handle_invoice_failed(invoice, event_id):
    """Handle failed invoice payment"""
    logger.warning(f"💸 Processing invoice payment failed: {invoice['id']}")
    
    try:
        from .models import Invoice, UserSubscription
        
        # Create or update invoice record
        invoice_obj, created = Invoice.objects.get_or_create(
            stripe_invoice_id=invoice['id'],
            defaults={
                'customer_email': invoice.get('customer_email', ''),
                'amount': invoice['amount_due'] / 100,
                'status': 'payment_failed',
                'currency': invoice.get('currency', 'usd')
            }
        )
        
        if not created:
            invoice_obj.status = 'payment_failed'
            invoice_obj.save()
        
        # Update related subscription status
        if invoice.get('subscription'):
            try:
                subscription = UserSubscription.objects.get(
                    stripe_subscription_id=invoice['subscription']
                )
                subscription.status = 'past_due'
                subscription.save()
                logger.info(f"⚠️ Subscription {invoice['subscription']} marked as past_due due to failed invoice")
            except UserSubscription.DoesNotExist:
                pass
        
        logger.info(f"✅ Failed invoice {invoice['id']} processed")
        log_webhook_event(event_id, 'invoice.payment_failed', None, 'success')
        
    except Exception as e:
        logger.error(f"❌ Error processing failed invoice: {e}", exc_info=True)
        log_webhook_event(event_id, 'invoice.payment_failed', None, 'error', str(e))

def handle_trial_ending(subscription, event_id):
    """Handle trial period ending soon"""
    logger.info(f"⏰ Processing trial ending: {subscription['id']}")
    
    try:
        from .models import UserSubscription
        
        try:
            user_subscription = UserSubscription.objects.get(
                stripe_subscription_id=subscription['id']
            )
            
            # You can add logic here to send trial ending notifications
            logger.info(f"⚠️ Trial ending soon for subscription {subscription['id']}")
            log_webhook_event(event_id, 'customer.subscription.trial_will_end', user_subscription.id, 'success')
            
        except UserSubscription.DoesNotExist:
            logger.error(f"❌ UserSubscription not found for trial ending: {subscription['id']}")
            
    except Exception as e:
        logger.error(f"❌ Error processing trial ending: {e}", exc_info=True)
        log_webhook_event(event_id, 'customer.subscription.trial_will_end', None, 'error', str(e))

def log_webhook_event(event_id, event_type, subscription_id, status, error_message=None):
    """Log webhook events for monitoring and debugging"""
    try:
        from .models import WebhookEvent
        
        WebhookEvent.objects.create(
            stripe_event_id=event_id,
            event_type=event_type,
            subscription_id=subscription_id,
            status=status,
            error_message=error_message,
            processed_at=timezone.now()
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to log webhook event: {e}")

# Health check endpoint for webhook
def webhook_health(request):
    """Simple health check for webhook endpoint"""
    return HttpResponse('Webhook endpoint is healthy', status=200)