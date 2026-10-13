'use client';

import React from 'react';
import Link from 'next/link';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Receipt,
  UtensilsCrossed,
  ChefHat,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Zap,
  Users,
  Database,
  Radio,
} from 'lucide-react';

export default function Home() {
  const { state, stats, resetToDemo, setRole } = useRestaurant();

  const roleModules = [
    {
      title: '1. Cashier Dashboard',
      role: 'cashier',
      path: '/cashier',
      icon: Receipt,
      badge: `${stats.billRequestedTables} Bill Requests Pending`,
      badgeColor: stats.billRequestedTables > 0 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
      description:
        'Live table occupancy board, automated itemized billing, multi-mode settlements (UPI QR, Cash tendered & change calculator, Card terminal), and instant table releasing.',
      primaryAction: 'Launch Cashier Counter',
      accentColor: 'from-amber-500 to-amber-700',
    },
    {
      title: '2. Waiter Mobile POS',
      role: 'waiter',
      path: '/waiter',
      icon: UtensilsCrossed,
      badge: `${stats.freeTables} Tables Available`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description:
        'Mobile-friendly table seat allocator, unique order session creator, digital menu browsing with veg/non-veg tags, KOT kitchen submissions, and one-tap bill requests.',
      primaryAction: 'Open Waiter POS',
      accentColor: 'from-emerald-500 to-teal-700',
    },
    {
      title: '3. Kitchen Display System (KDS)',
      role: 'kitchen',
      path: '/kitchen',
      icon: ChefHat,
      badge: `${stats.pendingKitchenTickets} Active Tickets`,
      badgeColor: stats.pendingKitchenTickets > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
      description:
        'Touchscreen kitchen tickets with elapsed timers, round badges for add-on items, item-level prep checklists, status progression (NEW → PREPARING → READY → SERVED), and chime alerts.',
      primaryAction: 'Open Kitchen KDS',
      accentColor: 'from-orange-500 to-rose-700',
    },
    {
      title: '4. Admin Menu & Billing Hub',
      role: 'admin',
      path: '/admin/menu',
      icon: ShieldCheck,
      badge: `${state.menuItems.length} Dishes Configured`,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      description:
        'Complete culinary catalog CRUD, real-time stock availability toggling, category organization, revenue summaries, and historical printable thermal tax receipts.',
      primaryAction: 'Open Admin Hub',
      accentColor: 'from-blue-500 to-indigo-700',
    },
  ];

  const workflowSteps = [
    { num: '01', title: 'FREE TABLE', desc: 'Table is available in the hall' },
    { num: '02', title: 'Waiter Assigns', desc: 'Enters customer name & guest count' },
    { num: '03', title: 'Unique Order Created', desc: 'Generates fresh isolated order ID' },
    { num: '04', title: 'KOT Submitted', desc: 'Dishes sent with special instructions' },
    { num: '05', title: 'Kitchen Prepares', desc: 'NEW → PREPARING → READY' },
    { num: '06', title: 'Bill Requested', desc: 'Waiter triggers bill at dining completion' },
    { num: '07', title: 'Cashier Payment', desc: 'UPI / Cash / Card settled with GST' },
    { num: '08', title: 'Table Freed', desc: 'Order closed, table returns to FREE' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next.js • TypeScript • Supabase • Tailwind CSS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                NAGA HOTEL <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                  Restaurant Management System
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                An enterprise-grade, high-performance restaurant POS designed for fast-paced dining
                operations. Real-time synchronization across Cashier counter, mobile Waiter terminals,
                and Kitchen Display Systems (KDS).
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/cashier"
                  onClick={() => setRole('cashier')}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Cashier Counter</span>
                </Link>
                <Link
                  href="/waiter"
                  onClick={() => setRole('waiter')}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition-all flex items-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                  <span>Waiter Mobile POS</span>
                </Link>
                <Link
                  href="/kitchen"
                  onClick={() => setRole('kitchen')}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition-all flex items-center gap-2"
                >
                  <ChefHat className="w-4 h-4 text-orange-400" />
                  <span>Kitchen Screen</span>
                </Link>
              </div>
            </div>

            {/* Quick Live Stats Pill Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 max-w-md w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live System Status
                  </span>
                </div>
                <button
                  onClick={resetToDemo}
                  title="Reset tables to default"
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Demo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Free Tables</span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    {stats.freeTables} / {stats.totalTables}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Occupied Tables</span>
                  <span className="text-xl font-black text-amber-400 mt-1 block">
                    {stats.occupiedTables}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Bill Requests</span>
                  <span className="text-xl font-black text-purple-400 mt-1 block">
                    {stats.billRequestedTables}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Today Revenue</span>
                  <span className="text-xl font-black text-white mt-1 block">
                    ₹{stats.todaySales.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span>
                  Real-time broadcast engine active across all open browser windows & tabs.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature Cards Grid */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-1 w-full">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-white">Select a Dashboard to Begin</h2>
          <p className="text-xs text-slate-400">
            Switch between cashier, waiter, and kitchen roles with real-time state synchronization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all hover:translate-y-[-2px] group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.accentColor} flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-slate-950" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <Link
                    href={item.path}
                    onClick={() => setRole(item.role as any)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-slate-950"
                  >
                    <span>{item.primaryAction}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step-by-Step Table and Order Lifecycle Flow Diagram */}
        <div className="mt-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Strict Dining & Billing Architecture
            </span>
            <h3 className="text-xl font-black text-white">
              End-to-End Table & Order Lifecycle Flow
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Guaranteed isolation: Every session receives a brand-new unique order ID. Previous
              records are preserved in immutable billing history.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col justify-between text-center relative group hover:border-amber-500/50 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-500/80 block">
                    {step.num}
                  </span>
                  <h4 className="text-xs font-black text-white mt-1 leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{step.desc}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-900 flex justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 bg-slate-950 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Naga Hotel • Restaurant Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/cashier" className="hover:text-slate-300">
              Cashier
            </Link>
            <Link href="/waiter" className="hover:text-slate-300">
              Waiter
            </Link>
            <Link href="/kitchen" className="hover:text-slate-300">
              Kitchen KDS
            </Link>
            <Link href="/admin/menu" className="hover:text-slate-300">
              Admin Menu
            </Link>
            <Link href="/admin/billing" className="hover:text-slate-300">
              Billing History
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
