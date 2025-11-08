"""
Django Backend Debug Script
Add this to your Django views or run in Django shell to debug the dashboard API

Run in Django shell:
python manage.py shell
exec(open('debug_dashboard.py').read())
"""

from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import json

def debug_dashboard_data(user_id=None):
    """Debug function to check what data is being returned by dashboard API"""
    
    print("🔍 DEBUGGING DASHBOARD DATA")
    print("=" * 50)
    
    # Get user
    if user_id:
        try:
            user = User.objects.get(id=user_id)
            print(f"✅ User found: {user.username} (ID: {user.id})")
        except User.DoesNotExist:
            print(f"❌ User with ID {user_id} not found")
            return
    else:
        # Get first user
        user = User.objects.first()
        if not user:
            print("❌ No users found in database")
            return
        print(f"🔄 Using first user: {user.username} (ID: {user.id})")
    
    # Check if Call model exists and get call counts
    try:
        from your_app.models import Call  # Replace 'your_app' with actual app name
        
        # Total calls in database
        total_calls = Call.objects.count()
        print(f"📊 Total calls in database: {total_calls}")
        
        # Calls associated with this user
        user_calls = Call.objects.filter(user=user).count()
        print(f"👤 Calls for user {user.username}: {user_calls}")
        
        # Calls by type
        inbound_calls = Call.objects.filter(user=user, call_type='inbound').count()
        outbound_calls = Call.objects.filter(user=user, call_type='outbound').count()
        print(f"📞 Inbound calls: {inbound_calls}")
        print(f"📞 Outbound calls: {outbound_calls}")
        
        # Check date filtering (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_calls = Call.objects.filter(
            user=user, 
            created_at__gte=thirty_days_ago
        ).count()
        print(f"📅 Calls in last 30 days: {recent_calls}")
        
        # Check call statuses
        call_statuses = Call.objects.filter(user=user).values_list('status', flat=True).distinct()
        print(f"📋 Call statuses in DB: {list(call_statuses)}")
        
        # Sample call data
        sample_calls = Call.objects.filter(user=user)[:3]
        print("📝 Sample call data:")
        for call in sample_calls:
            print(f"  - ID: {call.id}, Type: {getattr(call, 'call_type', 'unknown')}, "
                  f"Status: {getattr(call, 'status', 'unknown')}, "
                  f"Date: {getattr(call, 'created_at', 'unknown')}")
        
    except ImportError as e:
        print(f"❌ Could not import Call model: {e}")
        print("💡 Make sure to replace 'your_app' with your actual Django app name")
    except Exception as e:
        print(f"❌ Error checking calls: {e}")
    
    # Check billing cycle calculation
    print("\n🗓️ BILLING CYCLE DEBUG")
    print("-" * 30)
    
    # Typical billing cycle (monthly)
    now = timezone.now()
    billing_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month = billing_start.replace(month=billing_start.month + 1) if billing_start.month < 12 else billing_start.replace(year=billing_start.year + 1, month=1)
    billing_end = next_month - timedelta(seconds=1)
    
    print(f"📅 Current billing cycle:")
    print(f"  Start: {billing_start}")
    print(f"  End: {billing_end}")
    print(f"  Now: {now}")
    
    try:
        # Check calls in current billing cycle
        cycle_calls = Call.objects.filter(
            user=user,
            created_at__gte=billing_start,
            created_at__lte=billing_end
        ).count()
        print(f"📊 Calls in current billing cycle: {cycle_calls}")
        
        cycle_inbound = Call.objects.filter(
            user=user,
            call_type='inbound',
            created_at__gte=billing_start,
            created_at__lte=billing_end
        ).count()
        
        cycle_outbound = Call.objects.filter(
            user=user,
            call_type='outbound',
            created_at__gte=billing_start,
            created_at__lte=billing_end
        ).count()
        
        print(f"📞 Billing cycle inbound: {cycle_inbound}")
        print(f"📞 Billing cycle outbound: {cycle_outbound}")
        
    except Exception as e:
        print(f"❌ Error checking billing cycle calls: {e}")
    
    print("\n🔧 SUGGESTED FIXES:")
    print("-" * 20)
    print("1. Check if calls are associated with the correct user")
    print("2. Verify call_type field values ('inbound' vs 'outbound')")
    print("3. Check date filtering in your dashboard API")
    print("4. Ensure call status filtering isn't excluding all calls")
    print("5. Verify database relationships between User and Call models")

if __name__ == "__main__":
    debug_dashboard_data()