'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { CateringOrder, PaymentMethod } from '../lib/types';
import {
  X,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
} from 'lucide-react';

interface CateringOrderModalProps {
  onClose: () => void;
  onSuccess: (order: CateringOrder) => void;
}

export function CateringOrderModal({ onClose, onSuccess }: CateringOrderModalProps) {
  const { createCateringOrder } = useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [paxCount, setPaxCount] = useState('100');
  const [pricePerPlate, setPricePerPlate] = useState('350');
  const [menuSummary, setMenuSummary] = useState(
    'Mutton Dum Biryani, Chicken 65, Malabar Parotta, Salna, Onion Raitha, Elaneer Payasam'
  );
  const [advancePaid, setAdvancePaid] = useState('15000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Financial calculations
  const parsedPax = parseInt(paxCount) || 0;
  const parsedPrice = parseFloat(pricePerPlate) || 0;
  const subtotal = parsedPax * parsedPrice;
  const taxAmount = Number(((subtotal * 0.05).toFixed(2)));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));
  const parsedAdvance = Math.min(grandTotal, parseFloat(advancePaid) || 0);
  const balanceDue = Math.max(0, Number((grandTotal - parsedAdvance).toFixed(2)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Customer name and contact number are required.');
      return;
    }
    if (parsedPax <= 0) {
      setErrorMessage('Please enter a valid guest / pax count.');
      return;
    }
    if (parsedPrice <= 0) {
      setErrorMessage('Please specify price per plate.');
      return;
    }

    const result = createCateringOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      eventName: eventName.trim() || 'Grand Catering Feast',
      eventDate,
      paxCount: parsedPax,
      pricePerPlate: parsedPrice,
      menuSummary: menuSummary.trim() || 'Custom Catering Menu Spread',
      advancePaid: parsedAdvance,
      paymentMethod,
      paymentReference: paymentRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success && result.catering) {
      onSuccess(result.catering);
    } else {
      setErrorMessage(result.error || 'Failed to create catering invoice');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Category C
                </span>
                <h2 className="text-lg font-black text-white">New Catering Order / Bill</h2>
              </div>
              <p className="text-xs text-slate-400">
                Bulk food event booking, per-plate pricing, advance receipt & tax invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Row 1: Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Client / Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. K. Selvam / ABC Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Contact Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 98840 12345"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Event Name / Occasion
              </label>
              <input
                type="text"
                placeholder="e.g. Wedding Reception / Birthday Party"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Event Date
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Pax Count and Rate per Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Guest Count (Pax) *</span>
              </label>
              <input
                type="number"
                min="10"
                required
                value={paxCount}
                onChange={(e) => setPaxCount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Price Per Plate (₹) *
              </label>
              <input
                type="number"
                min="50"
                required
                value={pricePerPlate}
                onChange={(e) => setPricePerPlate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Menu Summary Text */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Selected Menu Items / Spread
            </label>
            <textarea
              rows={2}
              value={menuSummary}
              onChange={(e) => setMenuSummary(e.target.value)}
              placeholder="List dishes included in this catering package..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Financial Calculation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>
                Contract Subtotal ({parsedPax} plates × ₹{parsedPrice})
              </span>
              <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST (5%)</span>
              <span className="font-bold text-white">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
              <span>Total Contract Value</span>
              <span className="text-amber-400 text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Row 5: Advance Payment & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-emerald-400 block mb-1">
                Advance Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-sm font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Remaining Balance Due:{' '}
                <strong className="text-rose-400 font-bold">
                  ₹{balanceDue.toLocaleString('en-IN')}
                </strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Advance Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['UPI', 'CASH', 'CARD'] as PaymentMethod[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMethod(mode)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      paymentMethod === mode
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: Venue / Delivery Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Venue / Special Delivery Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Delivery at Anna Nagar Community Hall by 11:30 AM with warmers"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Book Catering Order & Generate Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
