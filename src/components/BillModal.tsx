'use client';

import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, PaymentMethod, Payment, OrderItem, MenuItem, PricingSection } from '../lib/types';
import { ThermalReceipt } from './ThermalReceipt';
import { getMenuItemNumber } from './MenuItemSearch';
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
  Keyboard,
  Plus,
  Minus,
  Trash2,
  Search,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface BillModalProps {
  order: Order;
  onClose: () => void;
}

export function BillModal({ order, onClose }: BillModalProps) {
  const { state, processPayment, updateOrderItems } = useRestaurant();

  const [items, setItems] = useState<OrderItem[]>(order.items || []);
  const [addItemQuery, setAddItemQuery] = useState('');
  const [isAddItemDropdownOpen, setIsAddItemDropdownOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAc = order.pricing_section === 'AC' || (order.section && order.section.toUpperCase().includes('AC'));
  const targetSection: PricingSection = isAc ? 'AC' : 'NON_AC';

  // Recalculate financial breakdown (Omit CANCELLED items from total)
  const subtotal = useMemo(() => {
    return Number(
      items
        .filter((it) => it.status !== 'CANCELLED')
        .reduce((sum, it) => sum + (it.total_price || 0), 0)
        .toFixed(2)
    );
  }, [items]);

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

  // Filter matching dishes when adding an item
  const matchingDishes = useMemo(() => {
    const rawQ = addItemQuery.trim();
    if (!rawQ) return [];
    const q = rawQ.toLowerCase();
    const cleanNum = q.startsWith('#') ? q.slice(1).trim() : q;
    const isNumeric = /^\d+$/.test(cleanNum);

    return state.menuItems
      .filter((m) => m.is_available && (m.is_active ?? true))
      .filter((m) => {
        const itemNum = String(getMenuItemNumber(m));
        if (isNumeric && (itemNum === cleanNum || itemNum.startsWith(cleanNum))) {
          return true;
        }
        if (q.startsWith('#') && itemNum === cleanNum) {
          return true;
        }
        return m.name.toLowerCase().includes(q) || (m.description?.toLowerCase().includes(q) ?? false);
      })
      .slice(0, 8);
  }, [addItemQuery, state.menuItems]);

  const handleUpdateItemQty = (index: number, delta: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        copy[index] = {
          ...target,
          status: 'CANCELLED',
          cancel_reason: 'Cancelled at Cashier Counter',
        };
      } else {
        copy[index] = {
          ...target,
          quantity: newQty,
          total_price: Number((target.unit_price * newQty).toFixed(2)),
          status: target.status === 'CANCELLED' ? 'SERVED' : target.status,
          cancel_reason: target.status === 'CANCELLED' ? undefined : target.cancel_reason,
        };
      }
      updateOrderItems(order.id, copy);
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      updateOrderItems(order.id, copy);
      return copy;
    });
  };

  const handleToggleItemCancel = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const isCurrentlyCancelled = target.status === 'CANCELLED';
      copy[index] = {
        ...target,
        status: isCurrentlyCancelled ? 'SERVED' : 'CANCELLED',
        cancel_reason: isCurrentlyCancelled ? undefined : 'Cancelled at Cashier Counter',
      };
      updateOrderItems(order.id, copy);
      return copy;
    });
  };

  const handleAddDish = (dish: MenuItem) => {
    const nonAcPrice = dish.price_non_ac ?? dish.non_ac_price ?? dish.price;
    const acPrice = dish.price_ac ?? dish.ac_price ?? nonAcPrice;
    const unitPrice = targetSection === 'AC' ? acPrice : nonAcPrice;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.menu_item_id === dish.id || it.item_name.toLowerCase() === dish.name.toLowerCase()
      );
      let next: OrderItem[];
      if (existingIdx >= 0) {
        next = [...prev];
        const existing = next[existingIdx];
        const newQty = existing.quantity + 1;
        next[existingIdx] = {
          ...existing,
          quantity: newQty,
          total_price: Number((existing.unit_price * newQty).toFixed(2)),
        };
      } else {
        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          order_id: order.id,
          menu_item_id: dish.id,
          item_name: dish.name,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice,
          pricing_section: targetSection,
          status: 'SERVED',
          round_number: 99,
          created_at: new Date().toISOString(),
        };
        next = [...prev, newItem];
      }
      updateOrderItems(order.id, next);
      return next;
    });
    setAddItemQuery('');
    setIsAddItemDropdownOpen(false);
  };

  const handleConfirmPayment = () => {
    if (isProcessing) return;
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

  // Spacebar and Enter shortcut listener for fast cashier collection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement;
        // Only block space if user is actively typing inside a text field where spaces are valid
        const isTypingText =
          activeEl &&
          (activeEl.tagName === 'TEXTAREA' ||
            (activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'text'));

        // If not actively typing text, Space confirms payment & prints
        if (!isTypingText) {
          e.preventDefault();
          handleConfirmPayment();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmPayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finalTotal, paymentMethod, tendered, computedDiscount, paymentReference, isProcessing]);

  if (completedPayment) {
    return (
      <ThermalReceipt
        order={{
          ...order,
          items,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: computedDiscount,
          final_total: finalTotal,
          status: 'PAID',
        }}
        payment={completedPayment}
        onClose={onClose}
        autoPrint={true}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#0F172A]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#10B981]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {order.table_number > 0 ? `Checkout Table ${order.table_number}` : 'Checkout Walk-in Order'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-[#0F172A] border border-[#E2E8F0]">
                  {order.order_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                    (order.pricing_section === 'AC' || (order.section && order.section.toUpperCase().includes('AC')))
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {(order.pricing_section === 'AC' || (order.section && order.section.toUpperCase().includes('AC')))
                    ? '❄️ AC Pricing'
                    : '🌿 Non-AC Pricing'}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Customer: <strong className="text-[#0F172A]">{order.customer_name}</strong> •{' '}
                {order.guest_count || 1} Guests
                {order.section ? ` • ${order.section}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Hint Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#0F172A] bg-[#F1F5F9] px-3.5 py-2 mt-3 rounded-xl border border-[#E2E8F0]">
          <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
            <Keyboard className="w-3.5 h-3.5" />
            Fast Cashier Action:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Press <kbd className="bg-white text-[#0F172A] font-black px-1.5 py-0.5 rounded font-mono text-[10px] border border-[#E2E8F0] shadow-xs">Space</kbd> or <kbd className="bg-white text-[#0F172A] font-bold px-1.5 py-0.5 rounded font-mono text-[10px] border border-[#E2E8F0] shadow-xs">Enter</kbd> to collect money & print receipt</span>
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 my-4 pr-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Itemized Order Table with Direct '-' and '+' Controls */}
          <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F172A]">Bill Items ({items.length})</span>
                <span className="text-[10px] text-[#64748B]">
                  • Use <kbd className="bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200">-</kbd> to reduce qty or cancel food
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ⚡ Direct Quick Edit
              </span>
            </div>

            {/* Items list */}
            <div className="divide-y divide-[#E2E8F0] max-h-52 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No items in bill. Add items using the search bar below.
                </div>
              ) : (
                items.map((item, idx) => {
                  const isCancelled = item.status === 'CANCELLED';

                  return (
                    <div
                      key={item.id || idx}
                      className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${
                        isCancelled
                          ? 'bg-red-50/50 border-l-4 border-l-[#EF4444]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {!isCancelled ? (
                          <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, -1)}
                              className="w-7 h-7 flex items-center justify-center text-red-600 hover:text-white rounded bg-red-50 hover:bg-[#EF4444] border border-red-200 font-black cursor-pointer transition-colors shadow-xs"
                              title="Click '-' to reduce quantity or cancel item"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-black text-[#0F172A] text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#0F172A] hover:bg-slate-100 rounded border border-[#E2E8F0] font-bold cursor-pointer transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="w-7 h-7 rounded-lg bg-red-50 text-[#EF4444] text-xs font-black flex items-center justify-center shrink-0 border border-red-200 line-through">
                            {item.quantity}×
                          </span>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold block truncate ${
                                isCancelled ? 'text-slate-400 line-through' : 'text-[#0F172A]'
                              }`}
                            >
                              {item.item_name}
                            </span>
                            {isCancelled && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-[#EF4444] border border-red-200 uppercase tracking-wider">
                                CANCELLED (₹0)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#64748B] block">
                            ₹{item.unit_price} each{item.pricing_section ? ` (${item.pricing_section})` : ''}
                            {isCancelled && (
                              <span className="text-[#EF4444] ml-1.5 italic">
                                • {item.cancel_reason || 'Customer cancelled food'} (Not billed, not printed)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {isCancelled ? (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 line-through block">
                              ₹{item.total_price.toFixed(2)}
                            </span>
                            <span className="font-black text-[#EF4444] text-xs">
                              ₹0.00
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-[#0F172A] text-sm">
                            ₹{item.total_price.toFixed(2)}
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {isCancelled ? (
                            <button
                              type="button"
                              onClick={() => handleToggleItemCancel(idx)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Restore/Uncancel this item"
                            >
                              <RotateCcw className="w-3 h-3 text-[#10B981]" />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleItemCancel(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                              title="Mark as cancelled by customer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete item from bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Extra Dish Section (Always available) */}
            <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] space-y-2">
                <span className="text-[11px] font-bold text-[#0F172A] block">
                  + Add Extra Item to Bill (Counter Adjustment):
                </span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={addItemQuery}
                    onChange={(e) => {
                      setAddItemQuery(e.target.value);
                      setIsAddItemDropdownOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (addItemQuery.trim().length > 0) setIsAddItemDropdownOpen(true);
                    }}
                    placeholder="Search dish # or name to add... (e.g. 1, 6, Biryani, Parotta)"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                  />

                  {/* Dropdown for Add Item */}
                  {isAddItemDropdownOpen && matchingDishes.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-xl divide-y divide-[#E2E8F0]">
                      {matchingDishes.map((dish) => {
                        const nonAcPrice = dish.price_non_ac ?? dish.non_ac_price ?? dish.price;
                        const acPrice = dish.price_ac ?? dish.ac_price ?? nonAcPrice;
                        const unitPrice = targetSection === 'AC' ? acPrice : nonAcPrice;
                        const itemNum = getMenuItemNumber(dish);

                        return (
                          <div
                            key={dish.id}
                            onClick={() => handleAddDish(dish)}
                            className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-[#10B981] bg-slate-100 px-1 py-0.5 rounded border border-[#E2E8F0]">
                                #{itemNum}
                              </span>
                              <span className="font-bold text-[#0F172A]">{dish.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#0F172A] font-bold">₹{unitPrice}</span>
                              <span className="text-[10px] bg-[#10B981] text-white font-bold px-1.5 py-0.5 rounded">
                                + Add
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Bill Calculation & Discounts */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#0F172A]">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B] text-[11px]">
              <span>GST ({taxRate}% - 2.5% CGST + 2.5% SGST):</span>
              <span className="font-medium text-[#0F172A]">₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Inputs */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#0F172A] flex items-center gap-1 font-medium">
                <Percent className="w-3.5 h-3.5 text-[#10B981]" />
                Discount / Offer:
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex bg-white border border-[#E2E8F0] rounded-lg overflow-hidden text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-1 font-bold ${
                      discountType === 'flat' ? 'bg-[#10B981] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-1 font-bold ${
                      discountType === 'percent' ? 'bg-[#10B981] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
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
                  className="w-20 px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-right focus:outline-none focus:border-[#10B981] text-xs font-semibold"
                />
              </div>
            </div>

            {computedDiscount > 0 && (
              <div className="flex justify-between text-[#10B981] text-xs font-semibold">
                <span>Discount applied:</span>
                <span>-₹{computedDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Final Amount */}
            <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Total Payable:
              </span>
              <span className="text-xl font-black text-[#10B981]">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'bg-emerald-50 border-[#10B981] text-[#10B981] ring-2 ring-[#10B981]/30 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-slate-300'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-50 border-[#10B981] text-[#10B981] ring-2 ring-[#10B981]/30 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-emerald-50 border-[#10B981] text-[#10B981] ring-2 ring-[#10B981]/30 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span>Card (POS)</span>
              </button>
            </div>
          </div>

          {/* Method-Specific Input Fields */}
          {paymentMethod === 'UPI' && (
            <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">UPI Payment (GPay, PhonePe, Paytm)</span>
                  <span className="text-[11px] text-[#10B981] font-mono font-bold">VPA: srhotel@okhdfcbank</span>
                </div>
                {/* Visual QR Code Badge */}
                <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center border border-[#E2E8F0] shadow-xs">
                  <div className="w-full h-full bg-[#0F172A] rounded flex flex-col items-center justify-center text-[7px] text-white font-mono leading-none">
                    <QrCode className="w-8 h-8 text-[#10B981]" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  UPI Transaction ID / Ref No (Optional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 428941098273"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#0F172A] block">Cash Calculation</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                    Cash Tendered (₹):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={finalTotal.toString()}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs font-bold focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-[#64748B] mb-1">
                    Change / Return:
                  </span>
                  <div className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#10B981] font-black text-sm">
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
                    className="px-2.5 py-1 text-[11px] rounded bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#0F172A] block">Credit / Debit Card Terminal</span>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Card Last 4 Digits or POS Auth Code:
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Auth-8910 or Card **** 4242"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Confirm Action */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Collect ₹{finalTotal.toFixed(2)} & Print Receipt</span>
            <kbd className="rounded bg-black/20 px-2 py-0.5 text-xs font-mono font-bold text-white border border-white/20">
              Press Space
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
