'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Menu,
  Clock,
  Sparkles,
  Zap,
  PlusCircle,
  Radio,
  Receipt,
  Users,
} from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { stats, state } = useRestaurant();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute title & subtitle based on current route
  const getHeaderMeta = () => {
    if (pathname === '/') {
      return {
        title: 'SR Hotel Dashboard',
        subtitle: 'Overview of floor tables, live kitchen tickets & sales',
      };
    }
    if (pathname.startsWith('/cashier')) {
      return {
        title: 'Cashier Billing Counter',
        subtitle: 'Table billing, fast parcel checkout & catering orders',
      };
    }
    if (pathname.startsWith('/waiter')) {
      return {
        title: 'Waiter Mobile POS',
        subtitle: 'Floor seating, dish selection & kitchen order dispatch',
      };
    }
    if (pathname.startsWith('/kitchen')) {
      return {
        title: 'Kitchen Display System (KDS)',
        subtitle: 'Live ticket queue, preparation stages & orders dispatch',
      };
    }
    if (pathname.startsWith('/admin/menu')) {
      return {
        title: 'Menu Products & Pricing',
        subtitle: 'Dishes catalog, AC / Non-AC rates & pricing audit history',
      };
    }
    if (pathname.startsWith('/admin/inventory')) {
      return {
        title: 'Inventory & Stock Management',
        subtitle: 'Grocery supplies, portion deductions & low-stock alerts',
      };
    }
    if (pathname.startsWith('/admin/billing')) {
      return {
        title: 'Sales Reports & Billing History',
        subtitle: 'Settled receipts, revenue breakdown & reprint archive',
      };
    }
    return {
      title: 'SR Hotel RMS',
      subtitle: 'Supermarket & Restaurant Management System',
    };
  };

  const { title, subtitle } = getHeaderMeta();

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile hamburger & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2 -ml-2 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-xl lg:hidden focus:outline-none"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight truncate">
                {title}
              </h1>
              <p className="text-xs text-[#64748B] font-medium hidden sm:block truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Status Indicators, Clock & New Sale Action */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Live Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>System Live</span>
            </div>

            {/* Table status counters */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
              <span className="text-slate-500">Tables:</span>
              <span className="text-emerald-600 font-bold">{stats.freeTables} Free</span>
              <span className="text-slate-300">/</span>
              <span className="text-amber-600 font-bold">{stats.occupiedTables} Occ</span>
              {stats.billRequestedTables > 0 && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-purple-600 font-black animate-pulse">
                    {stats.billRequestedTables} Bill Req
                  </span>
                </>
              )}
            </div>

            {/* Realtime Clock */}
            {currentTime && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTime}</span>
              </div>
            )}

            {/* Primary Action Button: Emerald Green New Sale Button */}
            <Link
              href="/cashier?tab=parcel"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>New Sale</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
