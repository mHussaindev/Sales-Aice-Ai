'use client';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
 
interface HomePageWrapperProps {
  children: React.ReactNode;
}
 
export default function HomePageWrapper({ children }: HomePageWrapperProps) {
  const { setTheme, theme } = useTheme();
 
  useEffect(() => {
    // Force dark theme on home page
    if (theme !== 'dark') {
      setTheme('dark');
    }
  }, [setTheme, theme]);
 
  // Always render with light theme classes on home page
  return (
    <div className="home-page-container light">
      {children}
    </div>
  );
}
 