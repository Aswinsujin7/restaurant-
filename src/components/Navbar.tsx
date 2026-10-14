'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRestaurant } from '../context/RestaurantContext';
import { RoleSwitcher } from './RoleSwitcher';
import {
  Utensils,
  RotateCcw,
  Radio,
  History,
  MenuSquare,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const { state, stats, resetToDemo } = useRestaurant();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetToDemo();
    setShowResetConfirm(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-2.5 gap-3">
          {/* Logo & Hotel Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-white">NAGA HOTEL</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    RMS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Chettinad & South Indian Cuisine
                </p>
              </div>
            </Link>

            {/* Mobile Realtime Indicator */}
            <div className="flex md:hidden items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Role Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            <RoleSwitcher />
          </div>

          {/* Quick Actions & Live Info */}
          <div className="flex items-center gap-3">
            {/* Live Metrics Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <span className="text-slate-400">Tables:</span>
              <span className="font-bold text-emerald-400">{stats.freeTables} Free</span>
              <span className="text-slate-600">|</span>
              <span className="font-bold text-amber-400">{stats.occupiedTables} Occ</span>
              {stats.billRequestedTables > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="font-bold text-purple-400 animate-pulse">
                    {stats.billRequestedTables} Bill Req
                  </span>
                </>
              )}
            </div>

            {/* Admin shortcuts stay inside the Admin Hub role. */}
            {state.activeRole === 'admin' && (
              <>
                <Link
                  href="/admin/billing"
                  title="Billing History & Reports"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                  <History className="w-4 h-4" />
                </Link>

                <Link
                  href="/admin/menu"
                  title="Menu Management"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                  <MenuSquare className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Reset Demo button */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                title="Reset sample data for testing"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>

              {showResetConfirm && (
                <div className="absolute right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <p className="text-xs text-slate-300 font-medium">
                    Reset all tables, orders, and demo data to default fresh state?
                  </p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors"
                    >
                      Yes, Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current Staff Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                {state.activeStaff.full_name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">
                  {state.activeStaff.full_name}
                </p>
                <p className="text-[10px] font-medium text-amber-400/90 capitalize leading-tight">
                  {state.activeRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
