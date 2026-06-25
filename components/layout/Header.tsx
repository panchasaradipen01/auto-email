'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import NotificationBell from './NotificationBell';
import { Menu, Sun, Moon, User } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6 transition-all duration-300 dark:border-gray-900 dark:bg-gray-950"
      style={{ paddingLeft: sidebarOpen ? '16.5rem' : '6.5rem' }}
    >
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-150 hover:text-gray-900 dark:hover:bg-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Personalized Email Workspace
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Widget */}
        <div className="flex items-center gap-3.5 pl-3 border-l border-gray-100 dark:border-gray-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {session?.user?.name || 'User'}
            </span>
            <span className="text-[10px] text-gray-400">
              {session?.user?.email || 'authenticated'}
            </span>
          </div>
          <div className="rounded-xl bg-indigo-50/50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </header>
  );
}
