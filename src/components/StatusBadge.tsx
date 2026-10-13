import React from 'react';
import { TableStatus, OrderStatus, OrderItemStatus } from '../lib/types';

export function TableStatusBadge({ status }: { status: TableStatus }) {
  if (status === 'FREE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        FREE
      </span>
    );
  }

  if (status === 'BILL_REQUESTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
        BILL REQUESTED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
      OCCUPIED
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus | OrderItemStatus }) {
  switch (status) {
    case 'NEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          NEW
        </span>
      );
    case 'PREPARING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          PREPARING
        </span>
      );
    case 'READY':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          READY
        </span>
      );
    case 'SERVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          SERVED
        </span>
      );
    case 'BILL_REQUESTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 animate-pulse">
          BILL REQUESTED
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          PAID
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
          CANCELLED
        </span>
      );
    default:
      return null;
  }
}

export function VegBadge({ isVeg }: { isVeg: boolean }) {
  if (isVeg) {
    return (
      <span
        title="Vegetarian"
        className="w-4 h-4 border border-emerald-600 rounded flex items-center justify-center p-0.5 shrink-0"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
      </span>
    );
  }
  return (
    <span
      title="Non-Vegetarian"
      className="w-4 h-4 border border-rose-600 rounded flex items-center justify-center p-0.5 shrink-0"
    >
      <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-rose-600"></span>
    </span>
  );
}
