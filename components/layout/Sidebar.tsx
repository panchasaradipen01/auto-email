'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Send,
  UploadCloud,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Templates', path: '/templates', icon: FileText },
    { name: 'Campaigns', path: '/campaigns', icon: Send },
    { name: 'CSV Upload', path: '/csv', icon: UploadCloud },
    { name: 'Email Logs', path: '/logs', icon: ScrollText },
  ];

  return (
    <aside
      className={`fixed bottom-0 top-0 left-0 z-40 flex flex-col border-r border-gray-100 bg-white transition-all duration-300 dark:border-gray-900 dark:bg-gray-950 ${
        sidebarOpen ? 'w-60' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-indigo-600 dark:text-indigo-400">
          <div className="rounded-xl bg-indigo-50 p-2 dark:bg-indigo-950/40">
            <Mail className="h-5 w-5" />
          </div>
          {sidebarOpen && <span className="text-md tracking-tight font-extrabold text-gray-950 dark:text-white">MailFlow</span>}
        </Link>
        
        {sidebarOpen && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition active:scale-[0.98] ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Trigger (icon-only mode) */}
      {!sidebarOpen && (
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="mx-auto my-3 rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar Footer (Logout) */}
      <div className="border-t border-gray-50 p-3 dark:border-gray-900">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
