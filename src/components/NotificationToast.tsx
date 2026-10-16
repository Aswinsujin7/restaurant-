'use client';

import React, { useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { playAlertChime } from './SoundAlert';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function NotificationToast() {
  const { state, clearNotification } = useRestaurant();

  useEffect(() => {
    if (state.notifications.length > 0) {
      const latest = state.notifications[0];
      if (latest.sound) {
        if (latest.type === 'success') {
          playAlertChime('success');
        } else if (latest.type === 'warning') {
          playAlertChime('ready');
        } else {
          playAlertChime('order');
        }
      }
    }
  }, [state.notifications]);

  if (state.notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {state.notifications.slice(0, 3).map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border bg-white text-[#0F172A] border-[#E2E8F0] transition-all animate-in slide-in-from-bottom-5"
        >
          <div className="mt-0.5 shrink-0">
            {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
            {notif.type === 'warning' && <Bell className="w-5 h-5 text-[#F59E0B] animate-bounce" />}
            {notif.type === 'error' && <AlertCircle className="w-5 h-5 text-[#EF4444]" />}
            {notif.type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-wide text-[#0F172A]">{notif.title}</h4>
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{notif.message}</p>
          </div>
          <button
            onClick={() => clearNotification(notif.id)}
            className="text-slate-400 hover:text-[#0F172A] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
