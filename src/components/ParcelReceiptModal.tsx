'use client';

import React from 'react';
import { ParcelOrder } from '../lib/types';
import { Printer, X, CheckCircle, Package } from 'lucide-react';

interface ParcelReceiptModalProps {
  parcel: ParcelOrder;
  onClose: () => void;
}

export function ParcelReceiptModal({ parcel, onClose }: ParcelReceiptModalProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formattedDate = new Date(parcel.created_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
            <span className="font-bold text-white text-sm">Parcel Receipt & KOT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Slip Content */}
        <div className="overflow-y-auto flex-1 my-3 bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-mono text-xs select-all">
          <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
            <h2 className="text-base font-black tracking-wider uppercase">NAGA HOTEL</h2>
            <p className="text-[10px] text-slate-600 font-sans">
              Authentic Chettinad & Multicuisine Restaurant
            </p>
            <p className="text-[10px] text-slate-600 font-sans">
              GSTIN: 33AAAAA0000A1Z5 • FSSAI: 12423001000892
            </p>
          </div>

          {/* Token Box */}
          <div className="my-3 py-2 px-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-400 text-center">
            <span className="text-[10px] font-sans font-black text-slate-500 uppercase tracking-widest block">
              PARCEL TOKEN NUMBER
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {parcel.token_number}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              [PAID & VERIFIED]
            </span>
          </div>

          <div className="space-y-1 py-2 border-b border-dashed border-slate-400 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Customer:</span>
              <span className="font-bold">{parcel.customer_name}</span>
            </div>
            {parcel.customer_phone && (
              <div className="flex justify-between">
                <span className="text-slate-600">Mobile:</span>
                <span>{parcel.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Time:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cashier:</span>
              <span>{parcel.cashier_name}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase pb-1">
              <span>Item & Qty</span>
              <span>Amount</span>
            </div>
            {parcel.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                <div className="max-w-[70%]">
                  <span className="font-bold">{item.item_name}</span>
                  <span className="text-slate-500 text-[10px] ml-1">× {item.quantity}</span>
                </div>
                <span className="font-semibold">₹{item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Item Subtotal</span>
              <span>₹{parcel.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Packaging Charges</span>
              <span>₹{parcel.packaging_charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">GST (5%)</span>
              <span>₹{parcel.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
              <span>TOTAL PAID</span>
              <span>₹{parcel.final_total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="pt-2 text-center space-y-1">
            <p className="text-[10px] text-slate-600">
              Paid via <strong>{parcel.payment_method}</strong> ({parcel.payment_reference || 'COUNTER'})
            </p>
            <p className="text-[10px] text-slate-500 font-sans italic">
              Thank you! Please collect your takeaway parcel at the delivery counter.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          Close Slip
        </button>
      </div>
    </div>
  );
}
