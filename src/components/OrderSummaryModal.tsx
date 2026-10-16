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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] space-y-4 text-[#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#10B981] border border-emerald-200 flex items-center justify-center">
              {orderType === 'PARCEL' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#10B981] text-white">
                  {orderType === 'PARCEL' ? 'Parcel / Takeaway' : 'Quick Dine-In'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                  {title || 'Order Summary & Kitchen Dispatch'}
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                {subtitle ||
                  'Review items and confirm transmission to Kitchen Display System (KDS)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
          <div>
            <span className="text-[10px] text-[#64748B] block uppercase font-bold">Customer</span>
            <span className="font-bold text-[#0F172A] truncate block">{customerName}</span>
            {customerPhone && (
              <span className="text-[10px] text-[#64748B] font-mono block">{customerPhone}</span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block uppercase font-bold">
              {orderType === 'PARCEL' ? 'Service Type' : 'Table / Section'}
            </span>
            <span className="font-bold text-[#10B981] truncate block">
              {tableLabel || (orderType === 'PARCEL' ? 'Counter Parcel' : 'Walk-in')}
            </span>
          </div>
          {orderType === 'DINE_IN' && (
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-bold">Guests</span>
              <span className="font-bold text-[#0F172A] block">{guestCount} Guest{guestCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <div>
            <span className="text-[10px] text-[#64748B] block uppercase font-bold">Pricing Mode</span>
            <span className="font-semibold text-[#0F172A] block">{priceModeLabel || 'Standard'}</span>
          </div>
          {orderType === 'PARCEL' && (
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-bold">Items Count</span>
              <span className="font-bold text-[#0F172A] block">{totalQuantity} dishes</span>
            </div>
          )}
        </div>

        {/* Items Table List */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] px-2 pb-1 border-b border-[#E2E8F0]">
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
                className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 border border-[#E2E8F0] text-[10px] font-black text-[#10B981] flex items-center justify-center shrink-0">
                    #{it.itemNumber}
                  </span>
                  <VegBadge isVeg={Boolean(it.isVeg)} />
                  <span className="font-bold text-[#0F172A] truncate max-w-[200px] sm:max-w-xs">
                    {it.name}
                  </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-mono">
                  <span className="text-[#64748B]">
                    {it.quantity} × ₹{it.unitPrice.toFixed(2)}
                  </span>
                  <span className="font-black text-[#0F172A] w-16 text-right">
                    ₹{it.lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#64748B]">
            <span>Food Subtotal ({totalQuantity} items)</span>
            <span className="font-mono text-[#0F172A] font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          {packagingCharge > 0 && (
            <div className="flex justify-between text-[#64748B]">
              <span>Packaging / Parcel Charge</span>
              <span className="font-mono text-[#0F172A] font-medium">₹{packagingCharge.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#64748B]">
            <span>GST (5%)</span>
            <span className="font-mono text-[#0F172A] font-medium">₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-[#10B981] pt-1.5 border-t border-[#E2E8F0]">
            <span>Grand Total</span>
            <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* KDS Routing Alert */}
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800">
          <ChefHat className="w-4 h-4 shrink-0 text-[#10B981]" />
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
            className="py-3 px-4 rounded-xl border border-[#E2E8F0] bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Edit Cart</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || items.length === 0}
            className="py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
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
