'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { CateringOrder, PaymentMethod } from '../lib/types';
import { X, CheckCircle2, DollarSign } from 'lucide-react';

interface SettleCateringModalProps {
  catering: CateringOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export function SettleCateringModal({ catering, onClose, onSuccess }: SettleCateringModalProps) {
  const { settleCateringBalance } = useRestaurant();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSettle = () => {
    setErrorMessage(null);
    const result = settleCateringBalance(catering.id, paymentMethod, paymentRef.trim() || undefined);
    if (result.success) {
      onSuccess();
    } else {
      setErrorMessage(result.error || 'Failed to settle catering balance');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        const activeEl = document.activeElement;
        const isTypingText =
          activeEl &&
          (activeEl.tagName === 'TEXTAREA' ||
            (activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'text' && (activeEl as HTMLInputElement).value !== ''));
        if (!isTypingText) {
          e.preventDefault();
          handleSettle();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catering.id, paymentMethod, paymentRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-black text-white text-base">Settle Catering Balance</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <div className="my-4 space-y-3">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Invoice Number:</span>
              <span className="font-bold text-white">{catering.invoice_number}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Client Name:</span>
              <span className="font-bold text-white">{catering.customer_name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Event / Occasion:</span>
              <span className="text-white">{catering.event_name}</span>
            </div>
            <div className="flex justify-between text-base font-black text-rose-400 pt-2 border-t border-slate-800">
              <span>Outstanding Balance Due:</span>
              <span>₹{catering.balance_due.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select Settlement Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'CASH', 'CARD'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    paymentMethod === mode
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Transaction / Reference Note
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Cash Memo"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            className="flex-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Settlement (₹{catering.balance_due.toLocaleString('en-IN')})</span>
            <kbd className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-950 border border-black/20">
              Space
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
