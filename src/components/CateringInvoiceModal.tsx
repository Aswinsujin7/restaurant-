'use client';

import React from 'react';
import { CateringOrder } from '../lib/types';
import { Printer, X, FileText, CheckCircle2, AlertCircle, Phone, Calendar, Users } from 'lucide-react';

interface CateringInvoiceModalProps {
  catering: CateringOrder;
  onClose: () => void;
  onSettleBalance?: (catering: CateringOrder) => void;
  autoPrint?: boolean;
}

export function CateringInvoiceModal({
  catering,
  onClose,
  onSettleBalance,
  autoPrint,
}: CateringInvoiceModalProps) {
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
      if (e.key === 'Escape') {
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

  const formattedDate = new Date(catering.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-white text-base">Catering Tax Invoice</h3>
              <span className="text-xs text-amber-400 font-mono font-bold">
                {catering.invoice_number}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {catering.balance_due > 0 && onSettleBalance && (
              <button
                onClick={() => onSettleBalance(catering)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Settle Balance (₹{catering.balance_due.toLocaleString('en-IN')})
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
              <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-950 border border-black/15">
                Space
              </kbd>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="overflow-y-auto flex-1 my-3 bg-white text-slate-900 p-6 rounded-2xl shadow-inner font-sans text-xs">
          {/* Letterhead */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">NAGA HOTEL</h1>
              <p className="text-slate-600 text-[11px] font-medium">
                Premium Chettinad & Multicuisine Catering Services
              </p>
              <p className="text-slate-500 text-[10px]">
                Main Road, Opp. Bus Stand, Tamil Nadu • Contact: +91 94441 22334
              </p>
              <p className="text-slate-500 text-[10px]">
                GSTIN: 33AAAAA0000A1Z5 • FSSAI License: 12423001000892
              </p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-900 text-white uppercase tracking-wider block mb-1">
                TAX INVOICE
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 block">
                {catering.invoice_number}
              </span>
              <span className="text-[11px] text-slate-600 block">Date: {formattedDate}</span>
            </div>
          </div>

          {/* Client & Event Info */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Billed To (Client):
              </span>
              <h4 className="text-sm font-black text-slate-900">{catering.customer_name}</h4>
              <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{catering.customer_phone}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Event Details:
              </span>
              <h4 className="text-sm font-black text-slate-900">{catering.event_name}</h4>
              <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Scheduled: {catering.event_date}</span>
              </p>
              <p className="text-slate-600 text-[11px] flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Guests: {catering.pax_count} Pax</span>
              </p>
            </div>
          </div>

          {/* Package Description Table */}
          <table className="w-full text-left my-4 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] uppercase font-bold text-slate-600">
                <th className="py-2">Description / Menu Package</th>
                <th className="py-2 text-center">Pax (Plates)</th>
                <th className="py-2 text-right">Rate / Plate</th>
                <th className="py-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              <tr>
                <td className="py-2.5 pr-2">
                  <span className="font-bold text-slate-900 block">{catering.event_name} Feast</span>
                  <span className="text-slate-600 text-[10px] block mt-0.5 leading-relaxed">
                    {catering.menu_summary}
                  </span>
                  {catering.notes && (
                    <span className="text-amber-800 text-[10px] italic block mt-1">
                      Note: {catering.notes}
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-center font-bold">{catering.pax_count}</td>
                <td className="py-2.5 text-right font-medium">₹{catering.price_per_plate}</td>
                <td className="py-2.5 text-right font-black">
                  ₹{catering.subtotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals & Payment Status Box */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-slate-900">
            {/* Left: Payment Status */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Payment Status
              </span>
              <div className="mt-1 flex items-center gap-2">
                {catering.status === 'FULLY_PAID' ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    FULLY PAID & SETTLED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ADVANCE RECEIVED • BALANCE PENDING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Processed by Cashier: <strong>{catering.cashier_name}</strong>
              </p>
            </div>

            {/* Right: Breakdown */}
            <div className="space-y-1.5 text-right text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{catering.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{catering.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>Total Contract:</span>
                <span>₹{catering.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Advance Paid ({catering.payment_method}):</span>
                <span>- ₹{catering.advance_paid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-rose-700 pt-1 border-t border-slate-300">
                <span>Balance Due:</span>
                <span>₹{catering.balance_due.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500">
            This is a computer-generated catering tax invoice from Naga Hotel. Valid without physical signature.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          Close Invoice
        </button>
      </div>
    </div>
  );
}
