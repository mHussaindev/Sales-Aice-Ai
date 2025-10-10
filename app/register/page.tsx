'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Loader2, Loader } from "lucide-react";
import Image from 'next/image';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/utils/axiosInstance';
import { useTheme } from 'next-themes';
const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false); // Modal visibility state
  const [resentEmail, setResentEmail] = useState(false)
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce function to limit the number of API calls
  const debounce = (func: any, delay: any) => {
    let timeout: any;
    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Function to verify username availability with debounce
  const verifyUsernameAvailability = debounce(async (username: string) => {debugger
    try {
      // console.log("verifying username");
      // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/check-username/`, {
      //   username: username,
      // });

       console.log("verifying username");
      const response = await axiosInstance.post('/api/auth/user-name-exist/', {
        user_name: username,
      });

     
      

      if (response.data.user_name_exists) {
        setUsernameMessage('');
        setUsernameError('Username is already taken');
      } else {
        setUsernameMessage('Username is available');
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error verifying username:', error);
    }
  }, 500); // Debounced with a 500ms delay

  // Handle username change and verify availability
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    console.log('Input value:', newUsername);  // This should log the input value
    setUsername(newUsername);  // Update the state with new username
    if (newUsername.trim() === "") {
      setUsernameMessage("");
      setUsernameError("");
    } else {
      verifyUsernameAvailability(newUsername);  // Debounced API call (if needed)
    }
  };




  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    verifyEmailAvailability(newEmail);
  };
 

  const verifyEmailAvailability = async (email_exist: string) => {debugger
    try {
      console.log("verifying email");
      // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/check-email/`, {
      //   email: email,
      // });
      const response = await axiosInstance.post('/api/auth/user-email-exist/', {
        email_exist: email_exist,
      });

      if (response.data.email_exist) {
        setEmailError('Email is already in use.');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
    }
  };

  const handleSubmit = async (e: any) => {debugger
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation checks
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      toast.error('Please fill in all fields.', {
        position: 'bottom-right'
      });
      return;
    }

    if (usernameError) {
      setError('Username is not available. Please use another username.');
      setLoading(false);
      toast.error('Username is not available. Please use another username.', {
        position: 'bottom-right'
      });
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      toast.error('Password must be at least 8 characters long.', {
        position: 'bottom-right'
      });
      return;
    }

    try {
      // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/register/`, {
      //   username: username,
      //   email: email,
      //   password: password,
      // });

      const response = await axiosInstance.post('/api/auth/register/', {
        user_name: username,
        email: email,
        password: password,
      });

      

      if (response.data) {
        toast.success(`Verification email sent to ${email}`, {
          position: 'bottom-right'
        });
        setModalOpen(true);
      }
    } catch (error: any) {
      setError('Registration failed. Please try again later.');
      toast.error('Registration failed. Please try again later.', {
        position: 'bottom-right'
      });
      console.error('Error during registration', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/resend-verification-email/`, { email });
      if (response.data.message === 'email resent') {
        toast.success(`Verification Email resent to ${email}`, { position: 'bottom-right' });
        setResentEmail(true)
        setLoading(false);
      }
      else if (response.data.message === 'email verified') {
        toast.success(`Email is already verified. Please Login!`, { position: 'bottom-right' });
        setLoading(false);
        router.push('/login')
      }
    } catch (error) {
      toast.error('Failed to resend email. Please try again later.', { position: 'bottom-right' });
      setLoading(false);

    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 dark:bg-gray-900 pt-40 px-4 sm:px-0 ">
      <div className="w-[100%] max-w-sm bg-white dark:bg-gray-800 my-12 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex justify-center mb-5">
          <img
            src="aicelogo-final.png"
            alt="Logo"
            className="w-40 h-40"
          />
        </div>

        <div className="text-gray-700 dark:text-gray-300 text-[24px] font-semibold text-center mb-6">
          Register your account
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="w-full px-4 py-[5px] bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400"
            />
            {/* {usernameError && <div className="text-red-500 text-sm mt-2">{usernameError}</div>} */}
            {/* {usernameMessage && <div className="text-[#0E4683] text-sm mt-2">{usernameMessage}</div>} */}
          </div>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="w-full px-4 py-[5px] bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400"
            />
            {emailError && <div className="text-red-500 dark:text-red-400 text-sm mt-2">{emailError}</div>}
          </div>

          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-[5px] bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400"
            />
            {password && password.length < 8 && <div className="text-red-500 dark:text-red-400 text-sm mt-2">Password must be at least 8 characters</div>}
          </div>

          <div className="mb-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-white dark:text-gray-900 bg-blue-600 dark:bg-yellow-400 font-medium py-3 rounded-md transition duration-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-blue-600 dark:bg-yellow-400 hover:bg-blue-700 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-medium py-3 rounded-md transition duration-300"
              >
                Register
              </button>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 dark:text-yellow-400 hover:text-blue-800 dark:hover:text-yellow-300">
              Login now
            </Link>
          </div>
        </form>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80 text-center mt-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Verification Email Sent</h2>
            {resentEmail ? (<p className="text-gray-700 dark:text-gray-300">We have resent you a verification email at <strong className="text-gray-900 dark:text-white">{email}</strong>. Please check your inbox.</p>)
              :
              (<p className="text-gray-700 dark:text-gray-300">We have sent you a verification email at <strong className="text-gray-900 dark:text-white">{email}</strong>. Please check your inbox.</p>
              )}
            <div className="mt-4">
              <button
                onClick={handleResendEmail}
                className="bg-blue-600 dark:bg-yellow-400 hover:bg-blue-700 dark:hover:bg-yellow-500 text-white dark:text-gray-900 px-4 py-2 rounded-md mr-2 transition duration-300"
              >
                {loading ? (<div className="flex items-center justify-center gap-2 text-white dark:text-gray-900 bg-blue-600 dark:bg-yellow-400 font-medium rounded-md transition duration-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resending Link
                </div>) : (<button
                  type="submit"
                  className="w-full bg-blue-600 dark:bg-yellow-400 text-white dark:text-gray-900 font-medium rounded-md transition duration-300"
                >
                  Resend Link
                </button>)}

              </button>
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-black dark:text-white px-4 py-2 rounded-md transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     



    </div>
  );
};

export default RegisterPage;
