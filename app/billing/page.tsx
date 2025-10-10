// ...existing code...
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Clock,
  Phone,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  DollarSign,
  Download,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import PaymentForm from '../../components/PaymentForm';
import { axiosInstance } from '../../utils/axiosInstance';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTheme } from 'next-themes';

// Stripe promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

// Enhanced types for comprehensive billing
type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'failed' | 'processing';
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
type PaymentMethodType = 'card' | 'bank' | 'paypal';


// Available Plans Interface for API
interface AvailablePlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isCurrentPlan: boolean;
  type: 'downgrade' | 'current' | 'upgrade';
  popular?: boolean; // optional, since only some plans have it
}

// Plans Comparison API Response
interface PlansComparisonResponse {
  success?: boolean;
  message?: string;
  plans: AvailablePlan[];
  current_plan_id?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  due_date?: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  description: string;
  period_start: string;
  period_end: string;
  download_url?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  brand?: string; // For cards
  last4?: string; // For cards
  exp_month?: string;
  exp_year?: string;
  bank_name?: string; // For bank accounts
  account_last4?: string; // For bank accounts
  email?: string; // For PayPal
  is_default: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  price_monthly: number;
  price_yearly?: number;
  billing_cycle: 'monthly' | 'yearly';
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  features: string[];
  usage: {
    calls_used: number;
    calls_limit: number;
    minutes_used: number;
    minutes_limit: number;
  };
}

interface BillingData {
  subscription: Subscription;
  upcoming_invoice?: {
    amount: number;
    date: string;
    description: string;
  };
  payment_methods: PaymentMethod[];
  invoices: Invoice[];
  billing_address?: {
    name: string;
    company?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

// Available plans for upgrade/downgrade - Will be fetched from API
// Mock data as fallback
const fallbackPlans: AvailablePlan[] = [
  {
    id: 'plan_starter',
    name: 'Starter Plan',
    price: 19.99,
    features: [
      'Up to 1,000 minutes/month',
      'Basic AI agents',
      'Standard analytics',
      'Email support'
    ],
    isCurrentPlan: false,
    type: 'downgrade'
  },
  {
    id: 'plan_pro',
    name: 'Professional Plan',
    price: 49.99,
    features: [
      'Up to 5,000 minutes/month',
      'Advanced AI agents',
      'Real-time analytics',
      'Priority support',
      'Custom integrations'
    ],
    isCurrentPlan: true,
    type: 'current',
    popular: true
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise Plan',
    price: 99.99,
    features: [
      'Unlimited minutes',
      'Premium AI agents',
      'Advanced analytics & reporting',
      '24/7 dedicated support',
      'Custom integrations',
      'White-label solution'
    ],
    isCurrentPlan: false,
    type: 'upgrade'
  }
];

// Mock data for comprehensive billing
const mockBillingData: BillingData = {
  subscription: {
    id: 'sub_123',
    plan_name: 'Professional Plan',
    plan_id: 'plan_pro',
    status: 'active',
    current_period_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    price_monthly: 49.99,
    price_yearly: 499.99,
    billing_cycle: 'monthly',
    cancel_at_period_end: false,
    features: [
      'Up to 5,000 minutes/month',
      'Advanced AI agents',
      'Real-time analytics',
      'Priority support',
      'Custom integrations'
    ],
    usage: {
      calls_used: 342,
      calls_limit: 1000,
      minutes_used: 1847,
      minutes_limit: 5000
    }
  },
  upcoming_invoice: {
    amount: 49.99,
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    description: 'Professional Plan - Monthly billing'
  },
  payment_methods: [
    {
      id: 'pm_001',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      exp_month: '12',
      exp_year: '2027',
      is_default: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
    },
    {
      id: 'pm_002',
      type: 'card',
      brand: 'Mastercard',
      last4: '8888',
      exp_month: '06',
      exp_year: '2026',
      is_default: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
    }
  ],
  invoices: [
    {
      id: 'inv_001',
      invoice_number: 'INV-2025-001',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      amount: 49.99,
      tax: 4.00,
      total: 53.99,
      status: 'paid',
      description: 'Professional Plan - October 2025',
      period_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      period_end: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      download_url: '/invoices/inv_001.pdf',
      items: [
        {
          description: 'Professional Plan (Monthly)',
          quantity: 1,
          unit_price: 49.99,
          total: 49.99
        }
      ]
    },
    {
      id: 'inv_002',
      invoice_number: 'INV-2025-002',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      amount: 49.99,
      tax: 4.00,
      total: 53.99,
      status: 'paid',
      description: 'Professional Plan - September 2025',
      period_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      period_end: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      download_url: '/invoices/inv_002.pdf',
      items: [
        {
          description: 'Professional Plan (Monthly)',
          quantity: 1,
          unit_price: 49.99,
          total: 49.99
        }
      ]
    }
  ],
  billing_address: {
    name: 'John Smith',
    company: 'Acme Corporation',
    address_line1: '123 Business St',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'US'
  }
};

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getStatusColor(status: InvoiceStatus | SubscriptionStatus, theme?: string): string {
  const isDark = theme === 'dark';
  switch (status) {
    case 'paid':
    case 'active': return isDark ? 'bg-emerald-600/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'processing': return isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700';
    case 'overdue':
    case 'past_due': return isDark ? 'bg-red-600/30 text-red-300' : 'bg-red-100 text-red-700';
    case 'failed': return isDark ? 'bg-red-600/30 text-red-300' : 'bg-red-100 text-red-700';
    case 'trialing': return isDark ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700';
    case 'canceled':
    case 'paused': return isDark ? 'bg-gray-600/30 text-gray-300' : 'bg-gray-100 text-gray-700';
    default: return isDark ? 'bg-gray-600/30 text-gray-300' : 'bg-gray-100 text-gray-700';
  }
}

function getStatusIcon(status: InvoiceStatus | SubscriptionStatus, theme?: string) {
  const iconColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  switch (status) {
    case 'paid':
    case 'active': return <CheckCircle className={`h-4 w-4 ${iconColor}`} />;
    case 'pending':
    case 'processing': return <Clock className={`h-4 w-4 ${iconColor}`} />;
    case 'overdue':
    case 'past_due':
    case 'failed': return <AlertCircle className={`h-4 w-4 ${iconColor}`} />;
    default: return <Clock className={`h-4 w-4 ${iconColor}`} />;
  }
}

// Custom Payment Method Update Component
function UpdatePaymentMethodForm({ onSuccess, onError, onCancel, isProcessing, setIsProcessing }: {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !customerInfo.name || !customerInfo.email) {
      onError('Please fill in all required fields');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🔄 Creating payment method...');
      
      // Create payment method directly with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Payment method created:', paymentMethod.id);
      
      // Call backend to save payment method
      // const response = await axiosInstance.put(`/api/payments/payment-methods/${paymentMethod.id}`, {      
      //   set_as_default: true
      // });

      const response = await axiosInstance.put(
        'api/subscriptions/api/payment-methods/Detail/',
        {
          pm_id: paymentMethod.id,
          set_as_default: true
        }
      );


      console.log('✅ Payment method saved to backend');
      onSuccess();

    } catch (err: any) {
      console.error('❌ Payment method update failed:', err);
      onError(err?.response?.data?.detail || err?.message || 'Failed to update payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
          Card Information *
        </label>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  backgroundColor: 'transparent',
                  '::placeholder': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Your card details are securely encrypted and never stored on our servers</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !customerInfo.name || !customerInfo.email}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Updating...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Update
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showDowngradeConfirmModal, setShowDowngradeConfirmModal] = useState<boolean>(false);
  const [showPlanChangeConfirmModal, setShowPlanChangeConfirmModal] = useState<boolean>(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState<boolean>(false);
  
  // Form states
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelFeedback, setCancelFeedback] = useState<string>('');
  
  // Plans state - From API (start with empty array, show dashes when no data)
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Function to fetch billing data from API
  const fetchBillingData = async () => {
    try {
      console.log('🔄 Fetching billing data from API...');
      const response = await axiosInstance.get('/api/subscriptions/user/billing-data/');
      
      console.log('📡 Billing Data API Response:', response);
      console.log('📡 Billing Response Data:', response.data);
      
      // Check for nested billing_data structure
      const apiData = response.data?.billing_data || response.data;
      
      if (apiData && apiData.subscription) {
        console.log('✅ Billing data fetched successfully:', apiData);
        
        // Ensure required properties exist
        const billingData = {
          ...apiData,
          subscription: {
            ...apiData.subscription,
            features: apiData.subscription.features || [],
            usage: apiData.subscription.usage || {
              calls_used: 0,
              calls_limit: 0,
              minutes_used: 0,
              minutes_limit: 0
            }
          },
          payment_methods: apiData.payment_methods || [],
          invoices: apiData.invoices || []
        };
        
        setBillingData(billingData);
        return billingData;
      } else {
        console.warn('⚠️ No billing data in API response, setting null');
        setBillingData(null);
        return null;
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch billing data:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      
      // Set null instead of fallback data if API fails
      console.log('📝 Setting billing data to null - will show dashes');
      setBillingData(null);
      return null;
    }
  };

  // Function to fetch available plans from API
  const fetchAvailablePlans = async () => {
    setPlansLoading(true);
    setPlansError(null);
    
    try {
      console.log('🔄 Fetching available plans from plans-comparison API...');
      const response = await axiosInstance.get('/api/subscriptions/user/plans-comparison/');
      
      console.log('📡 Plans Comparison API Response:', response);
      console.log('📡 Plans Response Data:', response.data);
      
      if (response.data && response.data.plans) {
        // Plans comparison API returns plans directly in the expected format
        const plansResponse = response.data;
        console.log('✅ Plans fetched successfully:', plansResponse);
        
        setAvailablePlans(plansResponse.plans);
      } else if (response.data && Array.isArray(response.data)) {
        // If API returns array directly
        console.log('✅ Plans array received directly:', response.data);
        setAvailablePlans(response.data);
      } else {
        console.warn('⚠️ No plans data in API response, setting empty array');
        console.warn('Response structure:', response.data);
        setAvailablePlans([]);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch plans from plans-comparison API:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      
      setPlansError(error?.response?.data?.detail || error?.message || 'Failed to load plans');
      
      // Set empty array instead of fallback data
      console.log('📝 Setting plans to empty array - will show dashes');
      setAvailablePlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch billing data from API
        if (mounted) {
          await fetchBillingData();
          await fetchAvailablePlans();
        }

        // Fetch available plans from API
        if (mounted) {
          await fetchAvailablePlans();
        }

      } catch (e: any) {
        if (!mounted) return;
        console.error('❌ Failed to load data:', e);
        
        // setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleDownloadInvoice = (invoiceId: string, downloadUrl: string) => {
    console.log('Downloading invoice:', invoiceId);
    // In real app, this would trigger download
    window.open(downloadUrl, '_blank');
  };

  // Handler functions
  const handleChangePaymentMethod = () => {
    console.log('Opening custom payment method update modal');
    setShowUpdatePaymentModal(true);
  };

  const handleCancelSubscription = () => {
    console.log('Opening cancellation modal');
    setShowCancelModal(true);
  };

  const handleUpgradePlan = () => {
    console.log('Opening plan upgrade modal');
    setShowUpgradeModal(true);
  };

  const handleDowngradePlan = () => {
    console.log('Opening plan downgrade modal');
    setShowUpgradeModal(true);
  };

  // Payment Method Update Handlers
  const handlePaymentUpdateSuccess = async () => {
    console.log('✅ Payment method updated successfully');
    setShowUpdatePaymentModal(false);
    // Refresh billing data from API
    await fetchBillingData();
    await fetchAvailablePlans();
    // Show success notification (you can add toast here)
  };

  const handlePaymentUpdateError = (error: string) => {
    console.error('❌ Payment method update failed:', error);
    // Show error notification (you can add toast here)
    alert(`Error: ${error}`);
  };

  const handlePaymentUpdateCancel = () => {
    console.log('Payment method update cancelled');
    setShowUpdatePaymentModal(false);
  };

  const handlePlanSelect = (plan: any) => {
    console.log(`📋 Plan selected: ${plan.name} (${plan.type})`);
    setSelectedPlan(plan);
    setShowUpgradeModal(false);
    
    // Show custom plan change confirmation modal
    console.log('✅ Opening plan change confirmation');
    setShowPlanChangeConfirmModal(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('✅ Payment successful:', paymentData);
    setIsProcessing(false);
    setShowPaymentModal(false);
    
    try {
      if (selectedPlan) {
        // Show immediate success message - webhook will handle the actual processing
        if (selectedPlan.type === 'upgrade' || selectedPlan.type === 'downgrade') {
          alert(`Payment successful! Plan ${selectedPlan.type} to ${selectedPlan.name} is being processed. Changes will be reflected shortly.`);
        } else {
          alert(`Payment successful! Your subscription to ${selectedPlan.name} is being activated.`);
        }
        
        // Start polling for webhook completion
        console.log('🔄 Starting webhook completion polling...');
        pollForSubscriptionUpdate(billingData?.subscription?.id);
        
      } else {
        // Payment method update only
        alert('Payment method updated successfully!');
        // Immediate refresh for payment method updates
        setTimeout(async () => {
          await fetchBillingData();
          await fetchAvailablePlans();
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Error in payment success handler:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      alert(`Payment was successful, but there was an issue: ${errorMessage}. Please contact support if subscription doesn't update automatically.`);
    }
    
    // Reset states
    setSelectedPlan(null);
  };

  // Helper function to poll for subscription updates after webhook processing
  const pollForSubscriptionUpdate = async (subscriptionId: string | undefined) => {
    if (!subscriptionId) {
      console.warn('No subscription ID available for polling');
      setTimeout(async () => {
        await fetchBillingData();
        await fetchAvailablePlans();
      }, 5000);
      return;
    }

    let attempts = 0;
    const maxAttempts = 15; // 30 seconds max (15 attempts × 2 seconds)
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`🔍 Polling attempt ${attempts}/${maxAttempts} for subscription update...`);
        
        // Fetch fresh billing data
        const updatedData = await fetchBillingData();
        await fetchAvailablePlans();
        
        // Check if subscription has been updated (this is basic - you might want more sophisticated checks)
        if (updatedData || attempts >= maxAttempts) {
          console.log('✅ Subscription data refreshed');
          if (attempts >= maxAttempts) {
            console.warn('⚠️ Max polling attempts reached - subscription may still be processing');
          }
          return;
        }
        
        // Continue polling
        setTimeout(poll, 2000); // Poll every 2 seconds
        
      } catch (error) {
        console.error('❌ Error during polling:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      }
    };
    
    // Start polling after a short delay to give webhook time to process
    setTimeout(poll, 3000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setIsProcessing(false);
    alert(`Payment failed: ${error}`);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🗑️ Cancelling subscription...');
      
      // Call DELETE API to cancel subscription with webhook metadata
      await axiosInstance.delete('/api/subscriptions/user/subscription/', {
        data: {
          reason: cancelReason,
          feedback: cancelFeedback,
          // Add metadata for webhook tracking
          metadata: {
            cancellation_reason: cancelReason,
            user_feedback: cancelFeedback,
            subscription_id: billingData?.subscription?.id,
            cancelled_by: 'user_request'
          }
        }
      });
      
      console.log('✅ Subscription cancellation request sent successfully');
      
      alert('Subscription cancellation scheduled. You will retain access until the end of your billing period. Changes will be reflected shortly.');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelFeedback('');
      
      // Start polling for webhook completion
      try {
        console.log('🔄 Starting webhook polling for cancellation...');
        pollForSubscriptionUpdate(billingData?.subscription?.id);
      } catch (refreshError) {
        console.warn('Failed to start polling after cancellation:', refreshError);
        // Fallback to simple refresh after delay
        setTimeout(async () => {
          await fetchBillingData();
          await fetchAvailablePlans();
        }, 5000);
      }
      
    } catch (error: any) {
      console.error('❌ Cancellation failed:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to cancel subscription. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeConfirm = () => {
    console.log('🔽 User confirmed downgrade to:', selectedPlan?.name);
    setShowDowngradeConfirmModal(false);
    setShowPaymentModal(true);
  };

  const handleDowngradeCancel = () => {
    console.log('User cancelled downgrade');
    setShowDowngradeConfirmModal(false);
    setSelectedPlan(null);
  };

  const handlePlanChangeConfirm = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      console.log(`🔄 ${selectedPlan.type === 'upgrade' ? 'Upgrading' : 'Downgrading'} subscription plan...`);
      
      const requestData = {
        new_package_id: selectedPlan.id,
        action: selectedPlan.type, // 'upgrade' or 'downgrade'
        proration_behavior: "create_prorations",
        // Add metadata for webhook tracking
        metadata: {
          plan_name: selectedPlan.name,
          action_type: selectedPlan.type,
          old_plan_id: billingData?.subscription?.plan_id,
          new_plan_id: selectedPlan.id
        }
      };
      
      console.log('📡 PUT request to subscription API:', requestData);
      await axiosInstance.put('/api/subscriptions/user/subscription/', requestData);
      
      console.log('✅ Plan change request sent successfully');
      alert(`Plan ${selectedPlan.type === 'upgrade' ? 'upgrade' : 'downgrade'} to ${selectedPlan.name} initiated! Changes will be reflected shortly via webhook.`);
      
      // Start polling for webhook completion
      console.log('🔄 Starting webhook polling for plan change...');
      pollForSubscriptionUpdate(billingData?.subscription?.id);
      
      setShowPlanChangeConfirmModal(false);
      setSelectedPlan(null);
      
    } catch (error: any) {
      console.error('❌ Failed to change plan:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      alert(`Failed to change plan: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlanChangeCancel = () => {
    console.log('User cancelled plan change');
    setShowPlanChangeConfirmModal(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-96 bg-gray-700 rounded mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-300 mb-2">Failed to Load Billing Data</h2>
            <p className="text-red-200/80 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Handle null billingData - show dashes instead of returning null
  const subscription = billingData?.subscription;
  const usage = subscription?.usage;
  const usagePercentage = usage ? Math.round(((usage?.minutes_used || 0) / (usage?.minutes_limit || 1)) * 100) : 0;
  const callsPercentage = usage ? Math.round(((usage?.calls_used || 0) / (usage?.calls_limit || 1)) * 100) : 0;

  if (!mounted) return null;

  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-[#0B1220] text-gray-900 dark:text-white p-6 py-25">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <CreditCard className="h-8 w-8 text-gray-700 dark:text-gray-300" />
              Billing & Subscription
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleUpgradePlan}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white"
            >
              <TrendingUp className="h-4 w-4" />
              Upgrade Plan
            </button>
            <button 
              onClick={handleDowngradePlan}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-sm font-medium text-white"
            >
              <TrendingUp className="h-4 w-4 rotate-180" />
              Downgrade Plan
            </button>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Subscription Overview */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{subscription?.plan_name || "--"}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {subscription ? getStatusIcon(subscription.status, theme) : <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${subscription ? getStatusColor(subscription.status, theme) : 'bg-gray-100 dark:bg-gray-600/30 text-gray-600 dark:text-gray-300'}`}>
                    {subscription?.status || "--"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subscription ? formatCurrency(subscription.price_monthly) : "--"}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
                </div>
                {subscription?.price_yearly && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(subscription.price_yearly)}/year (save 17%)
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Plan Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscription?.features && subscription.features.length > 0 ? (
                  subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>--</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next billing */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Next billing date</div>
                <div className="font-medium text-gray-900 dark:text-white">{subscription ? formatDate(subscription.current_period_end) : "--"}</div>
              </div>
              {billingData?.upcoming_invoice && (
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Amount due</div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(billingData.upcoming_invoice.amount)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            {/* Minutes Usage */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Minutes Usage</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{usagePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {(usage?.minutes_used || 0).toLocaleString()} / {(usage?.minutes_limit || 0).toLocaleString()} minutes
              </div>
            </div>

            {/* Calls Usage */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Calls Usage</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{callsPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${callsPercentage > 80 ? 'bg-red-500' : callsPercentage > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(callsPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {(usage?.calls_used || 0).toLocaleString()} / {(usage?.calls_limit || 0).toLocaleString()} calls
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Billing Address */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Payment Methods */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
              <button 
                onClick={handleChangePaymentMethod}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300"
              >
                <Plus className="h-4 w-4" />
                Add Method
              </button>
            </div>
            
            <div className="space-y-3">
              {billingData?.payment_methods && billingData.payment_methods.length > 0 ? (
                billingData.payment_methods.map((method) => (
                <div 
                  key={method.id} 
                  className={`p-4 rounded-lg border ${method.is_default ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/5' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        {method.type === 'card' ? (
                          <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {method.type === 'card' 
                            ? `${method.brand} •••• ${method.last4}`
                            : method.type === 'bank'
                            ? `${method.bank_name} •••• ${method.account_last4}`
                            : method.email
                          }
                        </div>
                        {method.type === 'card' && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Expires {method.exp_month}/{method.exp_year}
                          </div>
                        )}
                        {method.is_default && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Default</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                  --
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Billing Address</h2>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                <Settings className="h-4 w-4" />
                Edit
              </button>
            </div>
            
            {billingData?.billing_address ? (
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{billingData.billing_address.name}</div>
                {billingData.billing_address.company && (
                  <div className="text-gray-600 dark:text-gray-400">{billingData.billing_address.company}</div>
                )}
                <div className="text-gray-700 dark:text-gray-300">
                  {billingData.billing_address.address_line1}
                  {billingData.billing_address.address_line2 && (
                    <><br />{billingData.billing_address.address_line2}</>
                  )}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  {billingData.billing_address.city}, {billingData.billing_address.state} {billingData.billing_address.postal_code}
                </div>
                <div className="text-gray-700 dark:text-gray-300">{billingData.billing_address.country}</div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                --
              </div>
            )}
          </div>
        </div>

        {/* Invoice History */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice History</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {billingData?.invoices ? billingData.invoices.length : "--"} invoices
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {billingData?.invoices && billingData.invoices.length > 0 ? (
                  billingData.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{invoice.description}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                      <div className="text-xs">
                        {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Subtotal: {formatCurrency(invoice.amount)}
                        {invoice.tax > 0 && ` + Tax: ${formatCurrency(invoice.tax)}`}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invoice.status, theme)}`}>
                        {getStatusIcon(invoice.status, theme)}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {invoice.download_url && (
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.download_url!)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </button>
                        )}
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      --
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E1627] p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Subscription Management</h2>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <button 
              onClick={handleUpgradePlan}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white"
            >
              <TrendingUp className="h-4 w-4" />
              Upgrade Plan
            </button>
            <button 
              onClick={handleDowngradePlan}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4 rotate-180" />
              Downgrade Plan
            </button>
            <button 
              onClick={handleChangePaymentMethod}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 hover:bg-gray-800 rounded-md text-sm"
            >
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </button>
            <button 
              onClick={handleCancelSubscription}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-700 text-red-400 hover:bg-red-900/20 rounded-md text-sm"
            >
              <AlertCircle className="h-4 w-4" />
              Cancel Subscription
            </button>
          </div>
          
          {subscription?.cancel_at_period_end && (
            <div className="mt-4 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Subscription Scheduled for Cancellation</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                Your subscription will be canceled at the end of the current billing period on {formatDate(subscription.current_period_end)}.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>

    {/* Upgrade Plan Modal */}
    {showUpgradeModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0E1627] rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Change Your Plan</h2>
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {availablePlans.length > 0 ? (
              availablePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative rounded-xl border p-6 ${
                  plan.isCurrentPlan 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/5' 
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-transparent'
                } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.isCurrentPlan ? null : handlePlanSelect(plan)}
                  disabled={plan.isCurrentPlan}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    plan.isCurrentPlan
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : plan.type === 'upgrade'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : plan.type === 'downgrade'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {plan.isCurrentPlan 
                    ? 'Current Plan' 
                    : plan.type === 'upgrade' 
                    ? '⬆️ Upgrade to This Plan'
                    : plan.type === 'downgrade'
                    ? '⬇️ Downgrade to This Plan'
                    : 'Select Plan'
                  }
                </button>
              </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-400">
                --
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Payment Modal */}
    {showPaymentModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0E1627] rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedPlan 
                ? selectedPlan.type === 'upgrade' 
                  ? `⬆️ Upgrade to ${selectedPlan.name}`
                  : selectedPlan.type === 'downgrade'
                  ? `⬇️ Downgrade to ${selectedPlan.name}`
                  : `Subscribe to ${selectedPlan.name}`
                : 'Update Payment Method'
              }
            </h2>
            <button 
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPlan(null);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <PaymentForm
            packageName={selectedPlan?.name || 'Payment Method Update'}
            packagePrice={selectedPlan?.price || 0}
            packageId={selectedPlan?.id || 'payment_update'}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    )}

    {/* Cancel Subscription Modal */}
    {showCancelModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0E1627] rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-red-600 dark:text-red-400">Cancel Subscription</h4>
            <button 
              onClick={() => setShowCancelModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're sorry to see you go! Please help us improve by telling us why you're canceling.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                Reason for cancellation *
              </label>
              {[
                'Too expensive',
                'Not using it enough',
                'Missing features',
                'Technical issues',
                'Found better alternative',
                'Other'
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                Additional feedback (optional)
              </label>
              <textarea
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                placeholder="Help us understand how we can improve..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Important</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your subscription will remain active until the end of your current billing period.
                You can reactivate anytime before then.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={!cancelReason || isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Canceling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Downgrade Confirmation Modal */}
    {showDowngradeConfirmModal && selectedPlan && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0E1627] rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400">Confirm Downgrade</h2>
            <button 
              onClick={handleDowngradeCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Downgrade to {selectedPlan.name}
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${selectedPlan.price}/month
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Important Changes</span>
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <p>• Your monthly cost will decrease from ${billingData?.subscription.price_monthly} to ${selectedPlan.price}</p>
                <p>• Some features may no longer be available</p>
                <p>• Usage limits will be reduced</p>
                <p>• Changes take effect at the next billing cycle</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">What you'll get with {selectedPlan.name}:</h4>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                You can upgrade back to your current plan anytime
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDowngradeCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDowngradeConfirm}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-4 w-4 rotate-180" />
              Confirm Downgrade
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Plan Change Confirmation Modal */}
    {showPlanChangeConfirmModal && selectedPlan && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0E1627] rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${
              selectedPlan.type === 'upgrade' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              {selectedPlan.type === 'upgrade' ? '⬆️ Confirm Upgrade' : '⬇️ Confirm Downgrade'}
            </h2>
            <button 
              onClick={handlePlanChangeCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            {/* Plan Comparison */}
            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Current Plan */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Plan</div>
                  <div className="font-medium text-gray-900 dark:text-white">{billingData?.subscription.plan_name}</div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    ${billingData?.subscription.price_monthly}/month
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-600"></div>
                    {selectedPlan.type === 'upgrade' ? (
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-1" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-1 rotate-180" />
                    )}
                    <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-600"></div>
                  </div>
                </div>
                
                {/* New Plan */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Plan</div>
                  <div className="font-medium text-gray-900 dark:text-white">{selectedPlan.name}</div>
                  <div className={`text-lg font-bold ${
                    selectedPlan.type === 'upgrade' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    ${selectedPlan.price}/month
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Change */}
            <div className={`rounded-lg p-4 mb-4 ${
              selectedPlan.type === 'upgrade' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                selectedPlan.type === 'upgrade' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Billing Changes</span>
              </div>
              <div className={`text-sm space-y-1 ${
                selectedPlan.type === 'upgrade' 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                <p>
                  • Monthly cost will {selectedPlan.type === 'upgrade' ? 'increase' : 'decrease'} by{' '}
                  <strong>
                    ${Math.abs(selectedPlan.price - (billingData?.subscription.price_monthly || 0)).toFixed(2)}
                  </strong>
                </p>
                <p>• Changes take effect immediately with prorated billing</p>
                <p>• Next billing date: {formatDate(billingData?.subscription.current_period_end || '')}</p>
              </div>
            </div>

            {/* New Plan Features */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">What you'll get with {selectedPlan.name}:</h4>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {selectedPlan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedPlan.type === 'downgrade' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
                <div className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                  ⚠️ Some features may be removed. You can upgrade back anytime.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePlanChangeCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePlanChangeConfirm}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                selectedPlan.type === 'upgrade' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {selectedPlan.type === 'upgrade' ? 'Upgrading...' : 'Downgrading...'}
                </>
              ) : (
                <>
                  {selectedPlan.type === 'upgrade' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingUp className="h-4 w-4 rotate-180" />
                  )}
                  Confirm {selectedPlan.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Custom Update Payment Method Modal */}
    {showUpdatePaymentModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Update Payment Method</h4>
                  {/* <p className="text-sm text-gray-600 dark:text-gray-400">Add a new payment method to your account</p> */}
                </div>
              </div>
              <button 
                onClick={handlePaymentUpdateCancel}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Elements stripe={stripePromise}>
              <UpdatePaymentMethodForm
                onSuccess={handlePaymentUpdateSuccess}
                onError={handlePaymentUpdateError}
                onCancel={handlePaymentUpdateCancel}
                isProcessing={isProcessingPayment}
                setIsProcessing={setIsProcessingPayment}
              />
            </Elements>
          </div>
        </div>
      </div>
    )}
  </>
  );
}