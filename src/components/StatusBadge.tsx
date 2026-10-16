import React from 'react';
import { TableStatus, OrderStatus, OrderItemStatus } from '../lib/types';

export function TableStatusBadge({ status }: { status: TableStatus }) {
  if (status === 'FREE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
        FREE
      </span>
    );
  }

  if (status === 'BILL_REQUESTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
        BILL REQUESTED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
      OCCUPIED
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus | OrderItemStatus }) {
  switch (status) {
    case 'NEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          NEW
        </span>
      );
    case 'PREPARING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          PREPARING
        </span>
      );
    case 'READY':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          READY
        </span>
      );
    case 'SERVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          SERVED
        </span>
      );
    case 'BILL_REQUESTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
          BILL REQUESTED
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          PAID
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
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
        className="w-4 h-4 border border-emerald-600 bg-white rounded flex items-center justify-center p-0.5 shrink-0"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
      </span>
    );
  }
  return (
    <span
      title="Non-Vegetarian"
      className="w-4 h-4 border border-rose-600 bg-white rounded flex items-center justify-center p-0.5 shrink-0"
    >
      <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-rose-600"></span>
    </span>
  );
}
