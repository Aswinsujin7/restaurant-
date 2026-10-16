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
  Boxes,
  History,
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
      badgeColor:
        stats.billRequestedTables > 0
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-slate-100 text-slate-600 border-slate-200',
      description:
        'Manage table bills, fast parcel tickets, catering orders, and instant receipt settlements.',
      primaryAction: 'Go to cashier counter',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    },
    {
      title: 'Waiter Mobile POS',
      role: 'waiter',
      path: '/waiter',
      icon: UtensilsCrossed,
      number: '02',
      badge: `${stats.freeTables} tables free`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        'Floor seating, browse dishes with dish numbers, take orders, and send tickets directly to kitchen.',
      primaryAction: 'Open waiter POS',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
    },
    {
      title: 'Kitchen Display (KDS)',
      role: 'kitchen',
      path: '/kitchen',
      icon: ChefHat,
      number: '03',
      badge: `${stats.pendingKitchenTickets} active tickets`,
      badgeColor:
        stats.pendingKitchenTickets > 0
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-100 text-slate-600 border-slate-200',
      description:
        'Realtime prep screen, live ticket timers, audio alerts, and instant ready/served status dispatch.',
      primaryAction: 'Open kitchen screen',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
    },
    {
      title: 'Menu, Tables & Pricing',
      role: 'admin',
      path: '/admin/menu',
      icon: ShieldCheck,
      number: '04',
      badge: `${state.menuItems.length} dishes`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description:
        'Maintain dish catalog, AC / Non-AC rates, table sections, and inspect comprehensive audit logs.',
      primaryAction: 'Open menu hub',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    },
    {
      title: 'Inventory Management',
      role: 'admin',
      path: '/admin/inventory',
      icon: Boxes,
      number: '05',
      badge: `${state.inventoryItems.length} stock items`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        'Track grocery stock, auto portion deductions, stock movements, and low stock warnings.',
      primaryAction: 'Manage inventory',
      iconBg: 'bg-teal-50 text-teal-600 border border-teal-200',
    },
    {
      title: 'Billing History & Reports',
      role: 'admin',
      path: '/admin/billing',
      icon: History,
      number: '06',
      badge: `${state.payments.length} receipts`,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description:
        'Daily sales breakdown by Cash, UPI, and Card. Filter settled orders and reprint 80mm receipts.',
      primaryAction: 'View sales reports',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-200',
    },
  ];

  return (
    <div className="min-h-full flex flex-col bg-[#F1F5F9] text-[#0F172A]">
      {/* Welcome Hero Banner */}
      <section className="bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_.9fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                <span>Modern Restaurant & POS Console</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#64748B]">
                  Hospitality & Supermarket Solutions
                </p>
                <h1 className="text-3xl font-black leading-tight tracking-tight text-[#0F172A] sm:text-5xl">
                  Welcome to <span className="text-[#10B981]">SR Hotel</span>
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-[#64748B]">
                  Streamlined daily operations at a glance. Select any workspace below to coordinate tables, kitchen tickets, fast billing, and inventory stock in realtime.
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">
                  {stats.freeTables}
                  <span className="ml-1 text-xs font-semibold text-[#64748B]">
                    / {stats.freeTables + stats.occupiedTables}
                  </span>
                </p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">Tables Available</p>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">{stats.occupiedTables}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">Tables in Service</p>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <ChefHat className="h-4 w-4" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">{stats.pendingKitchenTickets}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">Kitchen Orders</p>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Clock3 className="h-4 w-4" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">{stats.billRequestedTables}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">Bills to Settle</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Modules Grid */}
      <section className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#10B981]">
              Operational Modules
            </p>
            <h2 className="text-2xl font-black text-[#0F172A]">Choose your workspace</h2>
          </div>
          <p className="text-xs text-[#64748B]">
            All updates synchronize instantaneously across roles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roleModules.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black tracking-wider text-slate-300">
                        {item.number}
                      </span>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#0F172A] transition-colors group-hover:text-[#10B981]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#E2E8F0] pt-4">
                  <Link
                    href={item.path}
                    onClick={() => setRole(item.role as any)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#10B981] transition-colors hover:text-[#059669]"
                  >
                    <span>{item.primaryAction}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-4 text-center text-xs text-[#64748B]">
        © 2026 SR Hotel <span className="mx-1 text-slate-300">•</span> Restaurant & Supermarket Management System
      </footer>
    </div>
  );
}
