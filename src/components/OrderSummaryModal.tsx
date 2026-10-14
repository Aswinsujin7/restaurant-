'use client';

import React from 'react';
import { ChefHat, ShoppingBag, X, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { VegBadge } from './StatusBadge';

export interface OrderSummaryItem {
  id: string;
  name: string;
  itemNumber: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isVeg?: boolean;
}

export interface OrderSummaryModalProps {
  isOpen: boolean;
  orderType: 'DINE_IN' | 'PARCEL';
  title?: string;
  subtitle?: string;
  tableLabel?: string;
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  priceModeLabel?: string;
  items: OrderSummaryItem[];
  subtotal: number;
  packagingCharge?: number;
  taxAmount: number;
  grandTotal: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OrderSummaryModal({
  isOpen,
  orderType,
  title,
  subtitle,
  tableLabel,
  customerName = 'Walk-in Guest',
  customerPhone,
  guestCount = 1,
  priceModeLabel,
  items,
  subtotal,
  packagingCharge = 0,
  taxAmount,
  grandTotal,
  isSubmitting,
  onConfirm,
  onCancel,
}: OrderSummaryModalProps) {
  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              {orderType === 'PARCEL' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  {orderType === 'PARCEL' ? 'Parcel / Takeaway' : 'Quick Dine-In'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {title || 'Order Summary & Kitchen Dispatch'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {subtitle ||
                  'Review items and confirm transmission to Kitchen Display System (KDS)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Customer</span>
            <span className="font-bold text-white truncate block">{customerName}</span>
            {customerPhone && (
              <span className="text-[10px] text-slate-400 font-mono block">{customerPhone}</span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              {orderType === 'PARCEL' ? 'Service Type' : 'Table / Section'}
            </span>
            <span className="font-bold text-amber-300 truncate block">
              {tableLabel || (orderType === 'PARCEL' ? 'Counter Parcel' : 'Walk-in')}
            </span>
          </div>
          {orderType === 'DINE_IN' && (
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Guests</span>
              <span className="font-bold text-white block">{guestCount} Guest{guestCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Pricing Mode</span>
            <span className="font-semibold text-slate-300 block">{priceModeLabel || 'Standard'}</span>
          </div>
          {orderType === 'PARCEL' && (
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Items Count</span>
              <span className="font-bold text-white block">{totalQuantity} dishes</span>
            </div>
          )}
        </div>

        {/* Items Table List */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2 pb-1 border-b border-slate-800">
            <span>Dish ({items.length} items • {totalQuantity} qty)</span>
            <div className="flex items-center gap-6">
              <span>Qty × Price</span>
              <span>Line Total</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
            {items.map((it) => (
              <div
                key={it.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-black text-amber-400 flex items-center justify-center shrink-0">
                    #{it.itemNumber}
                  </span>
                  <VegBadge isVeg={Boolean(it.isVeg)} />
                  <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                    {it.name}
                  </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-mono">
                  <span className="text-slate-400">
                    {it.quantity} × ₹{it.unitPrice.toFixed(2)}
                  </span>
                  <span className="font-black text-amber-400 w-16 text-right">
                    ₹{it.lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Food Subtotal ({totalQuantity} items)</span>
            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
          </div>
          {packagingCharge > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Packaging / Parcel Charge</span>
              <span className="font-mono">₹{packagingCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>GST (5%)</span>
            <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-amber-400 pt-1.5 border-t border-slate-800">
            <span>Grand Total</span>
            <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* KDS Routing Alert */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
          <ChefHat className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Kitchen Display System (KDS) will immediately receive this order as <strong>NEW</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Edit Cart</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || items.length === 0}
            className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transmitting to Kitchen...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Send to Kitchen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
