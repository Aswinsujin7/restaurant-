'use client';

import React from 'react';
import { Order, Payment } from '../lib/types';
import { Printer, Check, X } from 'lucide-react';

interface ThermalReceiptProps {
  order: Order;
  payment?: Payment;
  onClose?: () => void;
  autoPrint?: boolean;
}

export function ThermalReceipt({ order, payment, onClose, autoPrint }: ThermalReceiptProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  React.useEffect(() => {
    if (autoPrint && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.print();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedDate = new Date(payment?.created_at || order.created_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const cgst = (order.tax_amount / 2).toFixed(2);
  const sgst = (order.tax_amount / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Action Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Check className="w-4 h-4" />
            </span>
            <span className="font-bold text-white text-sm">Receipt Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Thermal Slip Body */}
        <div className="overflow-y-auto my-4 p-5 bg-white text-black font-mono text-xs rounded-xl shadow-inner select-none print:m-0 print:p-0 print:shadow-none print:w-full">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
            <h2 className="text-base font-black tracking-wider uppercase">NAGA HOTEL</h2>
            <p className="text-[11px] font-semibold text-gray-700">Chettinad & South Indian Cuisine</p>
            <p className="text-[10px] text-gray-600">42, Anna Salai, Heritage Plaza, Chennai - 600002</p>
            <p className="text-[10px] text-gray-600">GSTIN: 33AAAAA0000A1Z5 | Ph: +91 98765 43210</p>
          </div>

          {/* Meta Details */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Invoice: <strong>{order.order_number}</strong></span>
              <span>
                {order.table_number > 0 ? (
                  <>Table: <strong>T{order.table_number}</strong> ({order.pricing_section || (order.section?.includes('AC') ? 'AC' : 'Non-AC')})</>
                ) : (
                  <>Order: <strong>Walk-in ({order.pricing_section || 'Non-AC'})</strong></>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Date: {formattedDate}</span>
              <span>Guests: {order.guest_count || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer: <strong>{order.customer_name}</strong></span>
              <span>Cashier: {payment?.cashier_name || 'Front Desk'}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="py-3 border-b border-dashed border-gray-400">
            <div className="grid grid-cols-12 text-[11px] font-bold pb-1 text-gray-700">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amt</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {order.items
                .filter((item) => item.status !== 'CANCELLED')
                .map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                    <span className="col-span-6 truncate">{item.item_name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right">{item.unit_price}</span>
                    <span className="col-span-2 text-right font-semibold">{item.total_price.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Financial Calculation */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-gray-400 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-[10px]">
              <span>CGST (2.5%):</span>
              <span>₹{cgst}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-[10px]">
              <span>SGST (2.5%):</span>
              <span>₹{sgst}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount:</span>
                <span>-₹{order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300">
              <span>TOTAL AMOUNT:</span>
              <span>₹{order.final_total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          {payment && (
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Paid via:</span>
                <span>{payment.payment_method}</span>
              </div>
              {payment.payment_reference && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Ref:</span>
                  <span>{payment.payment_reference}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                <span>Status:</span>
                <span>PAID & SETTLED</span>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center pt-3 text-[10px] text-gray-600 space-y-0.5">
            <p className="font-bold">Thank you for dining at Naga Hotel!</p>
            <p>Please visit again!</p>
            <p className="text-[9px] pt-1">*** System Powered by Naga RMS ***</p>
          </div>
        </div>

        {/* Modal Bottom buttons */}
        {onClose && (
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
