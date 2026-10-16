'use client';

import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { UserRole } from '../lib/types';
import { ShieldCheck, Receipt, UtensilsCrossed, ChefHat } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function RoleSwitcher() {
  const { state, setRole } = useRestaurant();
  const pathname = usePathname();

  const roles: Array<{
    role: UserRole;
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }> = [
    {
      role: 'cashier',
      label: 'Cashier Counter',
      path: '/cashier',
      icon: Receipt,
      desc: 'Table billing & payments',
    },
    {
      role: 'waiter',
      label: 'Waiter Mobile POS',
      path: '/waiter',
      icon: UtensilsCrossed,
      desc: 'Table orders & KOT',
    },
    {
      role: 'kitchen',
      label: 'Kitchen KDS',
      path: '/kitchen',
      icon: ChefHat,
      desc: 'Live prep tickets',
    },
    {
      role: 'admin',
      label: 'Admin Hub',
      path: '/admin/menu',
      icon: ShieldCheck,
      desc: 'Menu & sales report',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto max-w-full">
      {roles.map((item) => {
        const Icon = item.icon;
        const isActive = state.activeRole === item.role || pathname.startsWith(item.path);

        return (
          <Link
            key={item.role}
            href={item.path}
            onClick={() => setRole(item.role)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[#10B981] text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
