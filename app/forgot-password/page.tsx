'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || email === "") {
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.', {
        position: 'bottom-right',
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/send-password-recovery-email/`, 
        { email: email }
      );
      
      if (response.data.status === '410') {
        toast.success(`Password recovery email sent to ${email}`, { 
          position: 'bottom-right' 
        });
        setEmailSent(true);
      } else if (response.data.status === '420') {
        setEmailSent(true);
      } else if (response.data.status === '404') {
        setError('No account found with this email address.');
        toast.error('No account found with this email address.', {
          position: 'bottom-right',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send email. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage, { 
        position: 'bottom-right' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-start justify-center min-h-screen bg-gray-50 dark:bg-gray-900 pt-45 px-4 sm:px-0">
        <div className="w-[100%] max-w-sm bg-white dark:bg-gray-800 my-12 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img
              src="/aicelogo-final.png"
              alt="Logo"
              className="w-40 h-40"
            />
          </div>

          {/* Success Message */}
          <div className="text-center">
            <div className="text-gray-700 dark:text-gray-200 text-[24px] font-semibold mb-4">
              Check Your Email
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              We've sent a password recovery link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions to reset your password.
            </div>
            
            <div className="space-y-3">
              <Link 
                href="/login" 
                className="block w-full bg-blue-600 dark:bg-[#0E4683] hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-3 rounded-md transition duration-300 text-center"
              >
                Back to Login
              </Link>
              
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="block w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-md transition duration-300"
              >
                Try Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 dark:bg-gray-900 pt-45 px-4 sm:px-0">
      <div className="w-[100%] max-w-sm bg-white dark:bg-gray-800 my-12 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">

        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="/aicelogo-final.png"
            alt="Logo"
            className="w-40 h-40"
          />
        </div>

        {/* Title */}
        <div className="text-gray-700 dark:text-gray-200 text-[24px] font-semibold text-center mb-6">
          Forgot Password?
        </div>

        <div className="text-gray-600 dark:text-gray-300 text-sm mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded">
            <input
              type="email"
              value={email}
              required
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="w-full px-4 py-[5px] text-12px bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
            />
          </div>

          {/* Display error message if validation fails */}
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}

          {/* Submit Button */}
          <div className="mb-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-gray-900 dark:text-[#1A2639] bg-yellow-500 dark:bg-[#FFD700] font-medium py-3 rounded-md transition duration-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Email...
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-[#0E4683] hover:bg-blue-700 dark:hover:bg-blue-800 text-bold text-white font-medium py-3 rounded-md transition duration-300"
                disabled={loading}
              >
                Send Recovery Email
              </button>
            )}
          </div>
        </form>

        {/* Back to Login Link */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 dark:text-[#0E4683] hover:text-orange-500 dark:hover:text-[#FF7043]">
            Back to Login
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 dark:text-[#0E4683] hover:text-orange-500 dark:hover:text-[#FF7043]">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;