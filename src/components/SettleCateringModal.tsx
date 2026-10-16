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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 shadow-2xl text-[#0F172A]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <h3 className="font-black text-[#0F172A] text-base">Settle Catering Balance</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-[#EF4444] text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <div className="my-4 space-y-3">
          <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Invoice Number:</span>
              <span className="font-bold text-[#0F172A]">{catering.invoice_number}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Client Name:</span>
              <span className="font-bold text-[#0F172A]">{catering.customer_name}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Event / Occasion:</span>
              <span className="text-[#0F172A]">{catering.event_name}</span>
            </div>
            <div className="flex justify-between text-base font-black text-[#EF4444] pt-2 border-t border-[#E2E8F0]">
              <span>Outstanding Balance Due:</span>
              <span>₹{catering.balance_due.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1.5">
              Select Settlement Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'CASH', 'CARD'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === mode
                      ? 'bg-[#10B981] text-white font-bold shadow-xs'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">
              Transaction / Reference Note
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Cash Memo"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            className="flex-2 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Settlement (₹{catering.balance_due.toLocaleString('en-IN')})</span>
            <kbd className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white border border-white/20">
              Space
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
