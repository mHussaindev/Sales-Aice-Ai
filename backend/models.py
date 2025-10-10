# models.py - Database Models for Webhook Integration
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

class UserSubscription(models.Model):
    """User subscription model with Stripe integration"""
    
    STATUS_CHOICES = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('unpaid', 'Unpaid'),
        ('incomplete', 'Incomplete'),
        ('incomplete_expired', 'Incomplete Expired'),
        ('paused', 'Paused'),
    ]
    
    # Basic subscription info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan_id = models.CharField(max_length=100, help_text="Internal plan identifier")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='incomplete')
    
    # Stripe identifiers
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True, unique=True)
    stripe_price_id = models.CharField(max_length=100, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    
    # Subscription periods
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    
    # Cancellation info
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)
    
    # Payment tracking
    last_payment_date = models.DateTimeField(null=True, blank=True)
    last_invoice_paid_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_subscriptions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.plan_id} ({self.status})"
    
    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in ['active', 'trialing']
    
    @property
    def is_trial(self):
        """Check if subscription is in trial period"""
        return self.status == 'trialing'
    
    @property
    def days_until_renewal(self):
        """Calculate days until next renewal"""
        if self.current_period_end:
            delta = self.current_period_end - timezone.now()
            return max(0, delta.days)
        return 0

class Invoice(models.Model):
    """Invoice tracking for Stripe payments"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('payment_failed', 'Payment Failed'),
        ('uncollectible', 'Uncollectible'),
        ('void', 'Void'),
    ]
    
    # Stripe identifiers
    stripe_invoice_id = models.CharField(max_length=100, unique=True)
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    
    # Invoice details
    customer_email = models.EmailField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='usd')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Payment info
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_failed_at = models.DateTimeField(null=True, blank=True)
    
    # Description and metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.stripe_invoice_id} - ${self.amount} ({self.status})"

class WebhookEvent(models.Model):
    """Track webhook events for monitoring and debugging"""
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('error', 'Error'),
        ('pending', 'Pending'),
    ]
    
    # Event details
    stripe_event_id = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=50)
    subscription_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Processing status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # Event data
    event_data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    processed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'webhook_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_event_id']),
            models.Index(fields=['event_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Webhook {self.stripe_event_id} - {self.event_type} ({self.status})"

class Plan(models.Model):
    """Subscription plans/packages"""
    
    BILLING_INTERVALS = [
        ('month', 'Monthly'),
        ('year', 'Yearly'),
        ('week', 'Weekly'),
        ('day', 'Daily'),
    ]
    
    # Plan details
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='usd')
    billing_interval = models.CharField(max_length=10, choices=BILLING_INTERVALS, default='month')
    
    # Stripe integration
    stripe_price_id = models.CharField(max_length=100, unique=True)
    stripe_product_id = models.CharField(max_length=100, blank=True)
    
    # Plan features
    features = models.JSONField(default=list, blank=True)
    limits = models.JSONField(default=dict, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'plans'
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_interval}"
    
    @property
    def monthly_price(self):
        """Convert price to monthly equivalent for comparison"""
        if self.billing_interval == 'month':
            return self.price
        elif self.billing_interval == 'year':
            return self.price / 12
        elif self.billing_interval == 'week':
            return self.price * 4.33  # Average weeks per month
        elif self.billing_interval == 'day':
            return self.price * 30.44  # Average days per month
        return self.price

class PaymentMethod(models.Model):
    """User payment methods"""
    
    TYPE_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('bank_account', 'Bank Account'),
        ('paypal', 'PayPal'),
    ]
    
    # User and Stripe info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    stripe_payment_method_id = models.CharField(max_length=100, unique=True)
    stripe_customer_id = models.CharField(max_length=100)
    
    # Payment method details
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='card')
    brand = models.CharField(max_length=20, blank=True)  # visa, mastercard, etc.
    last4 = models.CharField(max_length=4, blank=True)
    exp_month = models.IntegerField(null=True, blank=True)
    exp_year = models.IntegerField(null=True, blank=True)
    
    # Status
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        if self.type == 'card':
            return f"{self.brand.upper() if self.brand else 'Card'} ****{self.last4}"
        return f"{self.type.title()} Payment Method"

# Additional utility models

class SubscriptionHistory(models.Model):
    """Track subscription changes for audit purposes"""
    
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('upgraded', 'Upgraded'),
        ('downgraded', 'Downgraded'),
        ('canceled', 'Canceled'),
        ('reactivated', 'Reactivated'),
        ('renewed', 'Renewed'),
        ('payment_failed', 'Payment Failed'),
    ]
    
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_plan = models.CharField(max_length=100, blank=True)
    new_plan = models.CharField(max_length=100, blank=True)
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    
    # Context
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscription_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subscription.user.username} - {self.action} on {self.created_at.date()}"