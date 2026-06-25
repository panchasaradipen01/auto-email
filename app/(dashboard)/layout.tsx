'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useEmailQueue } from '@/hooks/useEmailQueue';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard Layout wrapper providing the page grid, Sidebar, Header,
 * ErrorBoundary fallback coverage, and active Server-Sent Events (SSE) listener.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Activate the Server-Sent Events listener to receive background queue progress updates
  useEmailQueue();

  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <div className="min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? '15rem' : '5rem' }}
      >
        {/* Top Header */}
        <Header />

        {/* Content Workspace */}
        <main className="flex-1 px-8 pb-12 pt-24 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
