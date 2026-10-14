'use client';

import React from 'react';
import Link from 'next/link';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Receipt,
  UtensilsCrossed,
  ChefHat,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
  Clock3,
} from 'lucide-react';

export default function Home() {
  const { state, stats, setRole } = useRestaurant();

  const roleModules = [
    {
      title: 'Cashier Dashboard',
      role: 'cashier',
      path: '/cashier',
      icon: Receipt,
      number: '01',
      badge: `${stats.billRequestedTables} bill requests`,
      badgeColor: stats.billRequestedTables > 0 ? 'bg-purple-500/15 text-purple-300 border-purple-400/25' : 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Manage table bills, parcel and catering orders, payments, and receipts from one counter.',
      primaryAction: 'Go to cashier',
      accentColor: 'from-amber-300 to-amber-600',
    },
    {
      title: 'Waiter POS',
      role: 'waiter',
      path: '/waiter',
      icon: UtensilsCrossed,
      number: '02',
      badge: `${stats.freeTables} tables free`,
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
      description: 'Seat guests, browse the menu, add items to an order, and send tickets to the kitchen.',
      primaryAction: 'Open waiter POS',
      accentColor: 'from-emerald-300 to-emerald-600',
    },
    {
      title: 'Kitchen Display',
      role: 'kitchen',
      path: '/kitchen',
      icon: ChefHat,
      number: '03',
      badge: `${stats.pendingKitchenTickets} active tickets`,
      badgeColor: stats.pendingKitchenTickets > 0 ? 'bg-orange-500/15 text-orange-300 border-orange-400/25' : 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Track incoming kitchen orders, update preparation progress, and mark dishes ready to serve.',
      primaryAction: 'Open kitchen',
      accentColor: 'from-orange-300 to-orange-600',
    },
    {
      title: 'Admin Menu & Billing',
      role: 'admin',
      path: '/admin/menu',
      icon: ShieldCheck,
      number: '04',
      badge: `${state.menuItems.length} menu items`,
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-400/25',
      description: 'Maintain dishes and availability, review billing activity, and print past receipts.',
      primaryAction: 'Open admin hub',
      accentColor: 'from-sky-300 to-sky-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <section className="relative isolate overflow-hidden border-b border-amber-500/15 bg-gradient-to-br from-[#252722] via-slate-950 to-[#171c1e]">
        <div className="absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 -z-10 h-80 w-80 rounded-full bg-orange-700/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Restaurant operations, made simple</span>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-200/70">Chettinad & South Indian Dining</p>
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
                Welcome to <span className="text-amber-400">Naga Hotel</span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Your daily service at a glance. Choose a workspace to keep the dining room, kitchen, and counter moving together.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Users className="h-4 w-4" /></div>
              <p className="text-2xl font-black text-white">{stats.freeTables}<span className="ml-1 text-sm font-semibold text-slate-400">/ {stats.freeTables + stats.occupiedTables}</span></p>
              <p className="mt-1 text-xs font-medium text-slate-400">Tables available</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><TrendingUp className="h-4 w-4" /></div>
              <p className="text-2xl font-black text-white">{stats.occupiedTables}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Tables in service</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300"><ChefHat className="h-4 w-4" /></div>
              <p className="text-2xl font-black text-white">{stats.pendingKitchenTickets}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Kitchen tickets</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300"><Clock3 className="h-4 w-4" /></div>
              <p className="text-2xl font-black text-white">{stats.billRequestedTables}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Bills to settle</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Your workspaces</p>
            <h2 className="text-2xl font-black text-white sm:text-3xl">Where would you like to start?</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-400">Choose the area you are working in. Live restaurant data stays in sync across each role.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
          {roleModules.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="group flex min-h-64 flex-col justify-between rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/95 to-[#202729] p-5 shadow-xl shadow-black/15 transition duration-200 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-black/25 sm:p-6">
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accentColor} text-slate-950 shadow-lg shadow-black/20 transition-transform group-hover:scale-105`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black tracking-[0.18em] text-amber-200/45">{item.number}</span>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white transition-colors group-hover:text-amber-300">{item.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
                <div className="mt-6 border-t border-slate-700/70 pt-4">
                  <Link href={item.path} onClick={() => setRole(item.role as any)} className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 transition-colors hover:text-amber-200">
                    {item.primaryAction}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-slate-950/70 py-5 text-center text-xs text-slate-500">
        © 2026 Naga Hotel <span className="mx-1 text-amber-700">•</span> Restaurant Management System
      </footer>
    </div>
  );
}
