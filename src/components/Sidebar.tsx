'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRestaurant } from '../context/RestaurantContext';
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  MenuSquare,
  Boxes,
  History,
  RotateCcw,
  Utensils,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { state, stats, resetToDemo, setRole } = useRestaurant();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => pathname.startsWith('/admin'));

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setIsAdminOpen(true);
    }
  }, [pathname]);

  const mainMenuItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      exact: true,
      badge: null,
    },
    {
      label: 'Cashier / POS',
      path: '/cashier',
      icon: Receipt,
      role: 'cashier' as const,
      badge: stats.billRequestedTables > 0 ? `${stats.billRequestedTables} req` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      label: 'Waiter POS',
      path: '/waiter',
      icon: UtensilsCrossed,
      role: 'waiter' as const,
      badge: `${stats.freeTables} free`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      label: 'Kitchen KDS',
      path: '/kitchen',
      icon: ChefHat,
      role: 'kitchen' as const,
      badge: stats.pendingKitchenTickets > 0 ? `${stats.pendingKitchenTickets} live` : null,
      badgeColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    },
  ];

  const lowStockCount =
    state.inventoryItems?.filter((item) => item.quantity <= item.lowStockThreshold).length || 0;

  const adminSubItems = [
    {
      label: 'Menu & Products',
      path: '/admin/menu',
      icon: MenuSquare,
      badge: null,
    },
    {
      label: 'Inventory Stock',
      path: '/admin/inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      label: 'Sales & Reports',
      path: '/admin/billing',
      icon: History,
      badge: null,
    },
  ];

  const isAdminActive = pathname.startsWith('/admin');

  const handleReset = () => {
    resetToDemo();
    setShowResetConfirm(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-white">SR HOTEL</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  RMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Billing & Inventory System
              </p>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[11px] font-semibold text-slate-300">System Live</span>
          </span>
          <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
            Realtime
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Navigation
          </p>

          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.path
              : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (item.role) setRole(item.role);
                  onClose();
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#10B981]/15 text-[#10B981] font-bold border-l-4 border-[#10B981] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#10B981]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Section (Consolidates Menu, Inventory, and Sales) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isAdminActive
                  ? 'bg-slate-800/90 text-white border border-slate-700/70'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
              aria-expanded={isAdminOpen}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className={`w-4 h-4 transition-colors ${
                    isAdminActive ? 'text-[#10B981]' : 'text-slate-400'
                  }`}
                />
                <span className="font-bold tracking-wide">Admin</span>
              </div>

              <div className="flex items-center gap-2">
                {isAdminActive && (
                  <span className="text-[9px] font-bold text-[#10B981] uppercase px-1.5 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/30">
                    Active
                  </span>
                )}
                {isAdminOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                )}
              </div>
            </button>

            {/* Admin Submenu Items */}
            {isAdminOpen && (
              <div className="ml-4 pl-3.5 border-l-2 border-slate-800 mt-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {adminSubItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = pathname.startsWith(subItem.path);

                  return (
                    <Link
                      key={subItem.path}
                      href={subItem.path}
                      onClick={() => {
                        setRole('admin');
                        onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isSubActive
                          ? 'bg-[#10B981] text-white font-bold shadow-md shadow-emerald-950/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SubIcon
                          className={`w-3.5 h-3.5 transition-colors ${
                            isSubActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span>{subItem.label}</span>
                      </div>

                      {subItem.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            subItem.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Profile & Reset Demo Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0c1322] space-y-2">
          {/* Active Staff info */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-xs font-bold text-[#10B981]">
              {state.activeStaff.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {state.activeStaff.full_name}
              </p>
              <p className="text-[10px] font-medium text-[#10B981] capitalize truncate">
                Role: {state.activeRole}
              </p>
            </div>
          </div>

          {/* Reset Demo Data Button (Red distinct alert styling) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-white bg-red-950/30 hover:bg-red-600/80 border border-red-800/50 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>

            {showResetConfirm && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 border border-red-500/40 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <p className="text-xs text-slate-200 font-medium">
                  Reset all tables, orders, inventory, and demo data to default fresh state?
                </p>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-[#EF4444] hover:bg-red-600 rounded shadow transition-colors cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
