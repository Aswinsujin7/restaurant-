'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, PaymentMethod, Payment } from '../lib/types';
import { ThermalReceipt } from './ThermalReceipt';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Printer,
  Sparkles,
  Receipt,
  Percent,
} from 'lucide-react';

interface BillModalProps {
  order: Order;
  onClose: () => void;
}

export function BillModal({ order, onClose }: BillModalProps) {
  const { processPayment } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recalculate financial breakdown
  const subtotal = order.subtotal || 0;
  const taxRate = order.tax_rate || 5;
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));

  const parsedDiscount = parseFloat(discountInput) || 0;
  const computedDiscount =
    discountType === 'percent'
      ? Math.min(subtotal, Number(((subtotal * parsedDiscount) / 100).toFixed(2)))
      : Math.min(subtotal, parsedDiscount);

  const finalTotal = Math.max(0, Number((subtotal + taxAmount - computedDiscount).toFixed(2)));

  // Cash change calculation
  const tendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tendered - finalTotal);

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Validation for cash
    if (paymentMethod === 'CASH' && tendered > 0 && tendered < finalTotal) {
      setErrorMessage(`Tendered amount (₹${tendered}) is less than total bill (₹${finalTotal})`);
      setIsProcessing(false);
      return;
    }

    const ref =
      paymentMethod === 'UPI'
        ? paymentReference || `UPI-${Date.now().toString().slice(-8)}`
        : paymentMethod === 'CARD'
        ? paymentReference || `CARD-${Date.now().toString().slice(-6)}`
        : `CASH-REC-${Date.now().toString().slice(-6)}`;

    const result = processPayment(order.id, {
      paymentMethod,
      paymentReference: ref,
      discountAmount: computedDiscount,
    });

    if (result.success && result.payment) {
      setCompletedPayment(result.payment);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1'],
        });
      } catch {
        // Confetti optional
      }
    } else {
      setErrorMessage(result.error || 'Failed to complete payment');
    }
    setIsProcessing(false);
  };

  if (completedPayment) {
    return (
      <ThermalReceipt
        order={{
          ...order,
          discount_amount: computedDiscount,
          final_total: finalTotal,
          status: 'PAID',
        }}
        payment={completedPayment}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {order.table_number > 0 ? `Checkout Table ${order.table_number}` : 'Checkout Walk-in Order'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {order.order_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Customer: <strong className="text-slate-200">{order.customer_name}</strong> •{' '}
                {order.guest_count || 1} Guests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 my-4 pr-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Itemized Order Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800 flex justify-between text-xs font-bold text-slate-300">
              <span>Ordered Items ({order.items.length})</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-44 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {item.quantity}
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">{item.item_name}</span>
                      {item.special_instructions && (
                        <span className="block text-[10px] text-amber-400/90 italic">
                          Note: {item.special_instructions}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-100">
                      ₹{item.total_price.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      ₹{item.unit_price} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Calculation & Discounts */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>GST ({taxRate}% - 2.5% CGST + 2.5% SGST):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Inputs */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                Discount / Offer:
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-1 ${
                      discountType === 'flat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-1 ${
                      discountType === 'percent' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-right focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {computedDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 text-xs font-semibold">
                <span>Discount applied:</span>
                <span>-₹{computedDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Final Amount */}
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Total Payable:
              </span>
              <span className="text-xl font-black text-amber-400">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 ring-2 ring-purple-500/40 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 ring-2 ring-sky-500/40 shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span>Card (POS)</span>
              </button>
            </div>
          </div>

          {/* Method-Specific Input Fields */}
          {paymentMethod === 'UPI' && (
            <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">UPI Payment (GPay, PhonePe, Paytm)</span>
                  <span className="text-[11px] text-purple-300 font-mono">VPA: nagahotel@okhdfcbank</span>
                </div>
                {/* Visual QR Code Badge */}
                <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-[7px] text-white font-mono leading-none">
                    <QrCode className="w-9 h-9 text-purple-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  UPI Transaction ID / Ref No (Optional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 428941098273"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-white block">Cash Calculation</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Cash Tendered (₹):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={finalTotal.toString()}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-300 mb-1">
                    Change / Return:
                  </span>
                  <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-black text-sm">
                    ₹{changeDue.toFixed(2)}
                  </div>
                </div>
              </div>
              {/* Quick Cash Buttons */}
              <div className="flex gap-2">
                {[finalTotal, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashTendered(val.toString())}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-white block">Credit / Debit Card Terminal</span>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Card Last 4 Digits or POS Auth Code:
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Auth-8910 or Card **** 4242"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Confirm Action */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Confirm Payment of ₹{finalTotal.toFixed(2)} & Free Table</span>
          </button>
        </div>
      </div>
    </div>
  );
}
