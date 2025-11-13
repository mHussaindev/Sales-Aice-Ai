'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import HomePageWrapper from '@/components/HomePageWrapper';

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { user, login } = useAuth();
  const router = useRouter()
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useLayoutEffect(() => {
    // Ensure user is not null before comparing the role
    if (user) {
      if (user.role === "user") {
        router.push('/dashboard');
      } else if (user.role === "admin") {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {debugger
    e.preventDefault();
    setLoading(true);
    setError('');  // Reset previous errors

    // Validate if both fields are not empty
    if (!email || !password) {
      setError('Please fill in all fields.');
      toast.error('Please fill in all fields.', {
        position: 'bottom-right',
      });
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.', {
        position: 'bottom-right',
      });
      setLoading(false);
      return;
    }

    // Validate password length (at least 6 characters)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      toast.error('Password must be at least 6 characters.', {
        position: 'bottom-right',
      });
      setLoading(false);
      return;
    }

    try {
      // Call login function from context
    await login(email, password);  // This will handle API request and state updates
    
    } catch (error: any) {
      setError('Login failed. Please check your credentials and try again.');
      toast.error('Login failed. Please check your credentials and try again.', {
        position: 'bottom-right',
      });
      console.error('Error during login', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <HomePageWrapper>
    <div className="flex items-start justify-center min-h-screen bg-gray-50 dark:bg-gray-900 pt-45 px-4 sm:px-0 ">
      <div className="w-[100%] max-w-sm bg-white dark:bg-gray-800 my-12 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">

        {/* Logo */}
        <div className="flex justify-center mb-5">
          
            <img
              src="aicelogo-final.png"
              alt="Logo"
              
              className="w-40 h-40"
            />
          
        </div>

        {/* Title */}
        <div className="text-gray-700 dark:text-gray-200 text-[24px] font-semibold text-center mb-6">
          Log in to your Account
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-3 border border-gray-300 dark:border-gray-600 rounded">
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-[5px] text-12px bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-[5px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
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
                Logging In
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-[#0E4683] hover:bg-blue-700 dark:hover:bg-blue-800 text-bold text-white font-medium py-3 rounded-md transition duration-300"
                disabled={loading}  // Disable while loading
              >
                Log in
              </button>
            )}
          </div>
        </form>

        {/* Forgot Password & SignUp Links */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/forgot-password" className="hover:underline hover:text-blue-600 dark:hover:text-blue-400">
            Forgot password?
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 dark:text-[#0E4683] hover:text-orange-500 dark:hover:text-[#FF7043]">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
    </HomePageWrapper>
  );
};

export default LoginPage;
