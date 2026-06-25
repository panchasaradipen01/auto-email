'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { markNotificationAsRead, clearNotifications } from '@/store/slices/uiSlice';
import { Bell, Trash2, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2.5 z-50 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5 dark:border-gray-900">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notifications ({unreadCount} new)
              </h4>
              {notifications.length > 0 && (
                <button
                  onClick={() => dispatch(clearNotifications())}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-rose-600 dark:hover:bg-gray-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => dispatch(markNotificationAsRead(notif.id))}
                    className={`flex items-start gap-3 rounded-xl p-2.5 transition cursor-pointer ${
                      notif.read
                        ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        : 'bg-indigo-50/20 hover:bg-indigo-50/40 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20'
                    }`}
                  >
                    <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1">
                      <p className={`text-xs leading-relaxed ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-gray-100'}`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
