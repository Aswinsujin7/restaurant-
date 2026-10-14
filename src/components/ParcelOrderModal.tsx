'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { MenuItem, PaymentMethod, ParcelOrder } from '../lib/types';
import { getMenuItemNumber } from './MenuItemSearch';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Search,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface ParcelOrderModalProps {
  onClose: () => void;
  onSuccess: (parcel: ParcelOrder) => void;
}

export function ParcelOrderModal({ onClose, onSuccess }: ParcelOrderModalProps) {
  const { state, createParcelOrder } = useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState(
    state.categories[0]?.id || 'cat-chinese'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [packagingCharge, setPackagingCharge] = useState('20');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter menu items by selected cuisine and search (supports dish # and name)
  const filteredItems = state.menuItems.filter((item) => {
    const rawQ = searchQuery.trim();
    if (rawQ) {
      const q = rawQ.toLowerCase();
      const cleanNum = q.startsWith('#') ? q.slice(1).trim() : q;
      const isNumeric = /^\d+$/.test(cleanNum);
      const itemNum = String(getMenuItemNumber(item));

      const numMatch = isNumeric && (itemNum === cleanNum || itemNum.startsWith(cleanNum));
      const hashMatch = q.startsWith('#') && itemNum === cleanNum;
      const nameMatch = item.name.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);

      return numMatch || hashMatch || nameMatch || descMatch;
    }

    if (selectedCuisine && item.category_id !== selectedCuisine) return false;
    return true;
  });

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  // Compute bill financials
  const cartEntries = Object.entries(cart);
  const cartItemCount = cartEntries.reduce((sum, [, q]) => sum + q, 0);

  const subtotal = cartEntries.reduce((sum, [id, qty]) => {
    const item = state.menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const parsedPkgCharge = parseFloat(packagingCharge) || 0;
  const taxAmount = Number(((subtotal * 0.05).toFixed(2)));
  const finalTotal = Number((subtotal + parsedPkgCharge + taxAmount).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartItemCount === 0) {
      setErrorMessage('Please select at least 1 food item for the parcel order.');
      return;
    }

    const itemsPayload = cartEntries.map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
    }));

    const result = createParcelOrder({
      customerName: customerName.trim() || 'Parcel Walk-in Guest',
      customerPhone: customerPhone.trim(),
      items: itemsPayload,
      packagingCharge: parsedPkgCharge,
      paymentMethod,
      paymentReference: paymentRef.trim() || undefined,
    });

    if (result.success && result.parcel) {
      onSuccess(result.parcel);
    } else {
      setErrorMessage(result.error || 'Failed to generate parcel bill');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Category B
                </span>
                <h2 className="text-lg font-black text-white">New Parcel / Takeaway Bill</h2>
              </div>
              <p className="text-xs text-slate-400">
                Fast counter billing with token generation and packing charge
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

        {/* Modal Body: Left menu picker, Right cart & billing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 flex-1 overflow-hidden">
          {/* Left: Cuisine Tabs & Items (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 lg:pr-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by dish # or name... (e.g. 1, Biryani)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Cuisine Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {state.categories.map((cat) => {
                const isSelected = selectedCuisine === cat.id;
                const emoji =
                  cat.id === 'cat-chinese'
                    ? '🥢'
                    : cat.id === 'cat-south-indian'
                    ? '🥥'
                    : cat.id === 'cat-north-indian'
                    ? '🍛'
                    : cat.id === 'cat-biryani'
                    ? '🍚'
                    : '🥤';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCuisine(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
              {filteredItems.map((item) => {
                const qty = cart[item.id] || 0;
                const itemNum = getMenuItemNumber(item);
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-700/80 font-mono text-[10px] font-black text-amber-400">
                          #{itemNum}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.is_veg ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      </div>
                      <span className="text-xs font-black text-amber-400">₹{item.price}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, -1)}
                            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-amber-400 px-2">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, 1)}
                            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Customer Info, Cart & Settlement (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-3">
              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Guest / Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Selected Items Breakdown */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Parcel Cart ({cartItemCount} items)
                </span>
                {cartEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Select dishes from the left</p>
                ) : (
                  cartEntries.map(([id, qty]) => {
                    const item = state.menuItems.find((m) => m.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between text-xs py-0.5 border-b border-slate-900"
                      >
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {item.name} × {qty}
                        </span>
                        <span className="font-bold text-white">₹{item.price * qty}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Packing Charge & Payment Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Packaging Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={packagingCharge}
                    onChange={(e) => setPackagingCharge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['UPI', 'CASH', 'CARD'] as PaymentMethod[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMethod(mode)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
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

              {/* Financial Summary */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Food Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Packaging Charge</span>
                  <span>₹{parsedPkgCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (5%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-slate-800">
                  <span>Net Payable</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cartItemCount === 0}
              className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bill Parcel & Generate Token (₹{finalTotal.toFixed(0)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
