'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { MenuItem, Order, Payment, PaymentMethod, PricingSection } from '../lib/types';
import { ThermalReceipt } from './ThermalReceipt';
import { VegBadge } from './StatusBadge';
import { getMenuItemNumber } from './MenuItemSearch';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  X,
  Keyboard,
  Edit,
  Snowflake,
  Sun,
  AlertCircle,
  Receipt,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
} from 'lucide-react';

export interface FastBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPricingSection?: PricingSection;
}

export function FastBillingModal({
  isOpen,
  onClose,
  initialPricingSection = 'NON_AC',
}: FastBillingModalProps) {
  const { state, createWalkInOrder, addItemsToOrder, processPayment } = useRestaurant();

  // Mode & Bill Meta
  const [pricingSection, setPricingSection] = useState<PricingSection>(initialPricingSection);
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');

  // Dish Search & Dropdown State
  const [dishSearchQuery, setDishSearchQuery] = useState<string>('');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Quantity Input State
  const [quantityInput, setQuantityInput] = useState<string>('1');

  // Cart / Bill Items
  const [cart, setCart] = useState<
    Array<{
      item: MenuItem;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>
  >([]);

  // Print Preview & Settlement State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for keyboard focus and duplicate event guards
  const dishSearchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const isAddingItemRef = useRef<boolean>(false);
  const activeOrderIdRef = useRef<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPricingSection(initialPricingSection);
      setCustomerName('Walk-in Guest');
      setDishSearchQuery('');
      setSelectedDish(null);
      setIsDropdownOpen(false);
      setHighlightedIndex(0);
      setQuantityInput('1');
      setCart([]);
      setIsPrintPreviewOpen(false);
      setPreviewOrder(null);
      setCompletedPayment(null);
      setErrorMessage(null);
      activeOrderIdRef.current = null;

      // Autofocus dish search field immediately on mount
      setTimeout(() => {
        dishSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialPricingSection]);

  // Compute unit price for any menu item based on current pricing section
  const getUnitPrice = useCallback(
    (item: MenuItem): number => {
      const nonAcPrice = item.price_non_ac ?? item.non_ac_price ?? item.price;
      const acPrice = item.price_ac ?? item.ac_price ?? nonAcPrice;
      return pricingSection === 'AC' ? acPrice : nonAcPrice;
    },
    [pricingSection]
  );

  // Filter available menu items based on query
  const matchingDishes = useMemo(() => {
    const rawQ = dishSearchQuery.trim();
    if (!rawQ) return [];

    const q = rawQ.toLowerCase();
    const cleanNum = q.startsWith('#') ? q.slice(1).trim() : q;
    const isNumeric = /^\d+$/.test(cleanNum);

    return state.menuItems
      .filter((item) => item.is_available && (item.is_active ?? true))
      .filter((item) => {
        const itemNum = String(getMenuItemNumber(item));
        if (isNumeric) {
          if (itemNum === cleanNum || itemNum.startsWith(cleanNum)) {
            return true;
          }
        }
        if (q.startsWith('#') && itemNum === cleanNum) {
          return true;
        }
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const category = state.categories.find((c) => c.id === item.category_id);
        const catMatch = category?.name.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch;
      })
      .slice(0, 10); // Show top 10 matches
  }, [dishSearchQuery, state.menuItems, state.categories]);

  // Sync dropdown open state and reset highlighted index when query changes
  useEffect(() => {
    if (dishSearchQuery.trim().length > 0 && !selectedDish) {
      setIsDropdownOpen(true);
      setHighlightedIndex(0);
    } else {
      setIsDropdownOpen(false);
    }
  }, [dishSearchQuery, selectedDish]);

  // Scroll highlighted dropdown item into view
  useEffect(() => {
    if (isDropdownOpen && dropdownListRef.current) {
      const activeEl = dropdownListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  // Select a dish from search results and move focus directly to quantity input
  const handleSelectDish = useCallback(
    (dish: MenuItem) => {
      setSelectedDish(dish);
      setDishSearchQuery(dish.name);
      setIsDropdownOpen(false);
      setQuantityInput('1');

      // Move focus immediately to quantity input and select text ('1')
      const focusQty = () => {
        if (quantityInputRef.current) {
          quantityInputRef.current.focus();
          try {
            quantityInputRef.current.select();
          } catch {}
        }
      };
      requestAnimationFrame(focusQty);
      setTimeout(focusQty, 25);
    },
    []
  );

  // Add the selected dish and quantity to current bill, then immediately focus dish search for next product
  const handleAddCurrentItem = useCallback(() => {
    // Prevent duplicate Enter events from adding the same dish twice
    if (isAddingItemRef.current) return;
    isAddingItemRef.current = true;
    setTimeout(() => {
      isAddingItemRef.current = false;
    }, 200);

    if (!selectedDish) return;

    const parsedQty = parseInt(quantityInput, 10);
    const qty = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty;
    const unitPrice = getUnitPrice(selectedDish);

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((entry) => entry.item.id === selectedDish.id);
      if (existingIdx >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          unitPrice,
          totalPrice: Number((newQty * unitPrice).toFixed(2)),
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            item: selectedDish,
            quantity: qty,
            unitPrice,
            totalPrice: Number((qty * unitPrice).toFixed(2)),
          },
        ];
      }
    });

    // Clear dish search and quantity fields, then automatically focus dish search for next product
    setDishSearchQuery('');
    setSelectedDish(null);
    setQuantityInput('1');
    setIsDropdownOpen(false);

    const focusSearch = () => {
      if (dishSearchInputRef.current) {
        dishSearchInputRef.current.focus();
      }
    };
    requestAnimationFrame(focusSearch);
    setTimeout(focusSearch, 25);
  }, [selectedDish, quantityInput, getUnitPrice]);

  // Update item quantity directly in the cart
  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((entry) => {
          if (entry.item.id !== itemId) return entry;
          const newQty = entry.quantity + delta;
          return {
            ...entry,
            quantity: newQty,
            totalPrice: Number((newQty * entry.unitPrice).toFixed(2)),
          };
        })
        .filter((entry) => entry.quantity > 0)
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((entry) => entry.item.id !== itemId));
  };

  // Bill Financial Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.totalPrice, 0);
  }, [cart]);

  const taxRate = 5; // 5% GST (2.5% CGST + 2.5% SGST)
  const taxAmount = useMemo(() => {
    return Number(((subtotal * 0.05).toFixed(2)));
  }, [subtotal]);

  const finalTotal = useMemo(() => {
    return Number((subtotal + taxAmount).toFixed(2));
  }, [subtotal, taxAmount]);

  // Prepare and open Bill Print Preview (Step 11 & 12)
  const handleOpenPrintPreview = useCallback(() => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one item to the bill before printing.');
      return;
    }
    setErrorMessage(null);

    // Reuse existing order ID if already created, or create a new walk-in order in store
    let orderId = activeOrderIdRef.current;
    if (!orderId) {
      const orderRes = createWalkInOrder(
        customerName.trim() || 'Walk-in Guest',
        1,
        state.activeStaff.id,
        pricingSection
      );
      if (orderRes.success && orderRes.orderId) {
        orderId = orderRes.orderId;
        activeOrderIdRef.current = orderId;

        // Add items to the order
        addItemsToOrder(
          orderId,
          cart.map((entry) => ({
            menuItemId: entry.item.id,
            quantity: entry.quantity,
          })),
          pricingSection
        );
      }
    }

    const orderNumber =
      state.orders.find((o) => o.id === orderId)?.order_number ||
      `NAGA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(state.orders.length + 1)
        .toString()
        .padStart(4, '0')}`;

    const orderForBill: Order = {
      id: orderId || `walkin-${Date.now()}`,
      order_number: orderNumber,
      table_id: '',
      table_number: 0,
      section: pricingSection === 'AC' ? 'AC Section (Walk-in Counter)' : 'Non-AC Section (Walk-in Counter)',
      pricing_section: pricingSection,
      customer_name: customerName.trim() || 'Walk-in Guest',
      guest_count: 1,
      waiter_id: state.activeStaff.id,
      status: 'BILL_REQUESTED',
      subtotal,
      tax_rate: 5,
      tax_amount: taxAmount,
      discount_amount: 0,
      final_total: finalTotal,
      created_at: new Date().toISOString(),
      items: cart.map((entry, idx) => ({
        id: `bill-item-${idx}`,
        order_id: orderId || '',
        menu_item_id: entry.item.id,
        item_name: entry.item.name,
        quantity: entry.quantity,
        unit_price: entry.unitPrice,
        total_price: entry.totalPrice,
        status: 'SERVED',
        round_number: 1,
        pricing_section: pricingSection,
        created_at: new Date().toISOString(),
      })),
    };

    setPreviewOrder(orderForBill);
    setIsPrintPreviewOpen(true);
  }, [
    cart,
    customerName,
    pricingSection,
    subtotal,
    taxAmount,
    finalTotal,
    state.activeStaff.id,
    state.orders,
    createWalkInOrder,
    addItemsToOrder,
  ]);

  // Reset state for next customer
  const handleResetForNextCustomer = useCallback(() => {
    setCart([]);
    setDishSearchQuery('');
    setSelectedDish(null);
    setQuantityInput('1');
    setIsPrintPreviewOpen(false);
    setPreviewOrder(null);
    setCompletedPayment(null);
    setErrorMessage(null);
    activeOrderIdRef.current = null;
    requestAnimationFrame(() => {
      dishSearchInputRef.current?.focus();
    });
  }, []);

  // Settle bill payment and directly trigger print preview & window.print() (Space bar print workflow)
  const handleExecuteSettleAndPrint = useCallback(() => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one item to the bill before printing.');
      return;
    }
    setErrorMessage(null);

    // Reuse existing order ID if already created, or create a new walk-in order in store
    let orderId = activeOrderIdRef.current;
    if (!orderId) {
      const orderRes = createWalkInOrder(
        customerName.trim() || 'Walk-in Guest',
        1,
        state.activeStaff.id,
        pricingSection
      );
      if (orderRes.success && orderRes.orderId) {
        orderId = orderRes.orderId;
        activeOrderIdRef.current = orderId;

        // Add items to the order
        addItemsToOrder(
          orderId,
          cart.map((entry) => ({
            menuItemId: entry.item.id,
            quantity: entry.quantity,
          })),
          pricingSection
        );
      }
    }

    const orderNumber =
      state.orders.find((o) => o.id === orderId)?.order_number ||
      `NAGA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(state.orders.length + 1)
        .toString()
        .padStart(4, '0')}`;

    const orderForBill: Order = {
      id: orderId || `walkin-${Date.now()}`,
      order_number: orderNumber,
      table_id: '',
      table_number: 0,
      section: pricingSection === 'AC' ? 'AC Section (Walk-in Counter)' : 'Non-AC Section (Walk-in Counter)',
      pricing_section: pricingSection,
      customer_name: customerName.trim() || 'Walk-in Guest',
      guest_count: 1,
      waiter_id: state.activeStaff.id,
      status: 'PAID',
      subtotal,
      tax_rate: 5,
      tax_amount: taxAmount,
      discount_amount: 0,
      final_total: finalTotal,
      created_at: new Date().toISOString(),
      items: cart.map((entry, idx) => ({
        id: `bill-item-${idx}`,
        order_id: orderId || '',
        menu_item_id: entry.item.id,
        item_name: entry.item.name,
        quantity: entry.quantity,
        unit_price: entry.unitPrice,
        total_price: entry.totalPrice,
        status: 'SERVED',
        round_number: 1,
        pricing_section: pricingSection,
        created_at: new Date().toISOString(),
      })),
    };

    setPreviewOrder(orderForBill);
    setIsPrintPreviewOpen(true);

    if (orderId && !completedPayment) {
      const ref =
        paymentMethod === 'UPI'
          ? paymentReference || `UPI-${Date.now().toString().slice(-8)}`
          : paymentMethod === 'CARD'
          ? paymentReference || `CARD-${Date.now().toString().slice(-6)}`
          : `CASH-${Date.now().toString().slice(-6)}`;

      const payRes = processPayment(orderId, {
        paymentMethod,
        paymentReference: ref,
        discountAmount: 0,
        cashierId: state.activeStaff.id,
        cashierName: state.activeStaff.full_name,
      });

      if (payRes.success && payRes.payment) {
        setCompletedPayment(payRes.payment);
      }
    }

    // Trigger printing automatically (last la space bar kudutha print la print aganum)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  }, [
    cart,
    customerName,
    pricingSection,
    subtotal,
    taxAmount,
    finalTotal,
    completedPayment,
    paymentMethod,
    paymentReference,
    state.activeStaff.id,
    state.activeStaff.full_name,
    state.orders,
    createWalkInOrder,
    addItemsToOrder,
    processPayment,
  ]);

  // Keyboard navigation for dish search input
  const handleDishSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Space bar: When query is empty and cart has items, trigger print directly!
    if (e.code === 'Space' || e.key === ' ') {
      if (dishSearchQuery.trim() === '' && cart.length > 0) {
        e.preventDefault();
        handleExecuteSettleAndPrint();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (matchingDishes.length > 0) {
        setIsDropdownOpen(true);
        setHighlightedIndex((prev) => (prev + 1) % matchingDishes.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (matchingDishes.length > 0) {
        setIsDropdownOpen(true);
        setHighlightedIndex((prev) => (prev - 1 + matchingDishes.length) % matchingDishes.length);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      } else {
        dishSearchInputRef.current?.blur();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingDishes.length > 0) {
        const dish = matchingDishes[highlightedIndex] || matchingDishes[0];
        handleSelectDish(dish);
      }
    }
  };

  // Keyboard navigation for quantity input
  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCurrentItem();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedDish(null);
      setDishSearchQuery('');
      setQuantityInput('1');
      dishSearchInputRef.current?.focus();
    }
  };

  // Global Space key print workflow
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Global Escape handling to close preview or reset for next customer
      if (e.key === 'Escape') {
        if (isPrintPreviewOpen) {
          if (completedPayment) {
            handleResetForNextCustomer();
          } else {
            setIsPrintPreviewOpen(false);
          }
          return;
        }
      }

      // Spacebar print trigger
      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement;

        // If bill preview is open, pressing Space re-prints receipt!
        if (isPrintPreviewOpen) {
          e.preventDefault();
          if (typeof window !== 'undefined') window.print();
          return;
        }

        // Only block space if user is typing non-empty text in another input
        const isTypingText =
          activeEl &&
          activeEl !== dishSearchInputRef.current &&
          ((activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).value.trim() !== '') ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true');

        if (isTypingText) return;
        if (isDropdownOpen) return;
        if (cart.length === 0) return;

        // When search is empty and cart has items, Space triggers PRINT!
        e.preventDefault();
        handleExecuteSettleAndPrint();
      } else if (e.key === 'Enter') {
        if (isPrintPreviewOpen) {
          e.preventDefault();
          if (typeof window !== 'undefined') window.print();
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [
    isOpen,
    isDropdownOpen,
    isPrintPreviewOpen,
    cart.length,
    completedPayment,
    handleExecuteSettleAndPrint,
    handleResetForNextCustomer,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#10B981] border border-emerald-200">
              <Keyboard className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0F172A]">
                  Fast Keyboard Billing Counter
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-[#10B981] border border-emerald-200">
                  ⚡ 100% Keyboard Driven
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Chettinad & Multicuisine Billing • SR Hotel POS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {/* Section Switcher (AC / Non-AC) */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setPricingSection('NON_AC')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  pricingSection === 'NON_AC'
                    ? 'bg-[#10B981] text-white font-black shadow-sm'
                    : 'text-emerald-700 hover:bg-slate-200'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>🌿 Non-AC</span>
              </button>
              <button
                type="button"
                onClick={() => setPricingSection('AC')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  pricingSection === 'AC'
                    ? 'bg-cyan-600 text-white font-black shadow-sm'
                    : 'text-cyan-700 hover:bg-slate-200'
                }`}
              >
                <Snowflake className="h-3.5 w-3.5" />
                <span>❄️ AC</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A] transition-colors cursor-pointer"
              aria-label="Close terminal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visible Keyboard Shortcut Banner */}
        <div className="border-b border-[#E2E8F0] bg-slate-50 px-4 py-2 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <span className="font-bold text-[#10B981] flex items-center gap-1">
              <Keyboard className="h-3.5 w-3.5" />
              Keyboard Workflow:
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-xs">Type</kbd>
                <span>Search Dish</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-xs">↑ / ↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-xs">Enter</kbd>
                <span>Select Dish → Qty</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-xs">Enter</kbd>
                <span>Add Item to Bill</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-xs">Esc</kbd>
                <span>Clear / Unfocus</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 border border-emerald-200 font-bold">Space</kbd>
                <span>Verify & Print</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Terminal Workspace: Left = Controls & Search, Right = Current Bill */}
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT: Dish Search, Dropdown & Quantity Inputs */}
          <div className="space-y-4">
            {/* Meta Row: Customer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Customer / Guest Name:
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in Guest or Mr. Kumar"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Active Pricing Section:
                </label>
                <div
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${
                    pricingSection === 'AC'
                      ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {pricingSection === 'AC' ? <Snowflake className="h-4 w-4 text-cyan-600" /> : <Sun className="h-4 w-4 text-emerald-600" />}
                    <span>{pricingSection === 'AC' ? 'AC Pricing Active' : 'Non-AC Pricing Active'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPricingSection((s) => (s === 'AC' ? 'NON_AC' : 'AC'))}
                    className="text-[10px] font-bold text-[#10B981] hover:underline cursor-pointer"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </div>

            {/* Fast Keyboard Entry Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" />
                  Step 1 & 2: Search Dish & Select
                </span>
                {selectedDish && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    Selected: {selectedDish.name} (₹{getUnitPrice(selectedDish)})
                  </span>
                )}
              </div>

              {/* Dish Search Input Field */}
              <div className="relative">
                <div className="relative flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <Search className="ml-3 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    ref={dishSearchInputRef}
                    type="text"
                    value={dishSearchQuery}
                    onChange={(e) => {
                      setDishSearchQuery(e.target.value);
                      if (selectedDish && e.target.value !== selectedDish.name) {
                        setSelectedDish(null);
                      }
                    }}
                    onKeyDown={handleDishSearchKeyDown}
                    placeholder={
                      cart.length > 0
                        ? 'Type next dish # or name, or press [Space] to print bill...'
                        : 'Type dish # or name... (e.g. 1, 6, Biryani, Parotta)'
                    }
                    autoComplete="off"
                    className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                    aria-label="Search dish name"
                  />
                  {dishSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setDishSearchQuery('');
                        setSelectedDish(null);
                        dishSearchInputRef.current?.focus();
                      }}
                      className="mr-3 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Live Dropdown Matching Dishes (Step 2, 3, 9) */}
                {isDropdownOpen && matchingDishes.length > 0 && (
                  <div
                    ref={dropdownListRef}
                    className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    role="listbox"
                  >
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-[#64748B] flex justify-between">
                      <span>Matches ({matchingDishes.length}) — Use ↑ ↓ arrows & Enter</span>
                      <span>Press [Esc] to cancel</span>
                    </div>

                    {matchingDishes.map((dish, idx) => {
                      const isHighlighted = idx === highlightedIndex;
                      const unitPrice = getUnitPrice(dish);
                      const itemNum = getMenuItemNumber(dish);
                      const category = state.categories.find((c) => c.id === dish.category_id);

                      return (
                        <div
                          key={dish.id}
                          onClick={() => handleSelectDish(dish)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-emerald-50 text-[#0F172A] border-l-4 border-l-[#10B981]'
                              : 'hover:bg-slate-50 text-[#0F172A]'
                          }`}
                          role="option"
                          aria-selected={isHighlighted}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-[#10B981] border border-slate-200">
                              #{itemNum}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <VegBadge isVeg={dish.is_veg} />
                                <span className="font-bold text-sm text-[#0F172A] truncate">
                                  {dish.name}
                                </span>
                                <span className="text-[10px] text-[#64748B]">
                                  ({category?.name || 'Dish'})
                                </span>
                              </div>
                              {dish.description && (
                                <p className="text-[11px] text-[#64748B] truncate max-w-sm">
                                  {dish.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <span className="text-sm font-black text-[#10B981]">
                                ₹{unitPrice.toFixed(2)}
                              </span>
                              <span className="block text-[9px] text-[#64748B]">
                                {pricingSection === 'AC' ? '❄️ AC Rate' : '🌿 Non-AC'}
                              </span>
                            </div>
                            {isHighlighted && (
                              <span className="rounded bg-[#10B981] px-2 py-1 text-[10px] font-black text-white shadow">
                                ↵ Select
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3 & 4: Quantity Input */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A]">
                      Step 3: Enter Quantity (Defaults to 1):
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      Press <kbd className="rounded bg-slate-100 px-1 py-0.5 text-slate-700 font-mono border border-slate-200">Enter</kbd> to add to bill, or change number
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => {
                          const curr = parseInt(quantityInput, 10) || 1;
                          setQuantityInput(String(Math.max(1, curr - 1)));
                        }}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <input
                        ref={quantityInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantityInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setQuantityInput(val);
                        }}
                        onFocus={(e) => {
                          try {
                            e.target.select();
                          } catch {}
                        }}
                        onKeyDown={handleQuantityKeyDown}
                        className="w-16 bg-transparent text-center text-base font-black text-[#0F172A] focus:outline-none"
                        aria-label="Item quantity"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const curr = parseInt(quantityInput, 10) || 1;
                          setQuantityInput(String(curr + 1));
                        }}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCurrentItem}
                      disabled={!selectedDish}
                      className="flex items-center gap-1.5 rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-black text-white hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item [↵ Enter]</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Suggestions / Most Popular Items for 1-click add */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-bold text-[#64748B] block mb-2">
                Fast Click / Touch Shortcuts (Popular Dishes):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.menuItems.slice(0, 8).map((item) => {
                  const num = getMenuItemNumber(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectDish(item)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-[#10B981] hover:text-[#0F172A] transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="font-mono text-[10px] font-bold text-[#10B981] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                        #{num}
                      </span>
                      <span>{item.name}</span>
                      <span className="text-[#10B981] font-bold">₹{getUnitPrice(item)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Current Bill / Cart & Financials */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#10B981]" />
                  <h3 className="font-bold text-[#0F172A] text-sm">
                    Current Bill Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Trash2 className="h-3 w-3" /> Clear Bill
                  </button>
                )}
              </div>

              {/* Items Table */}
              <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B] space-y-2">
                    <Receipt className="h-8 w-8 mx-auto opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold text-[#0F172A]">Bill is currently empty</p>
                    <p className="text-[11px] text-[#64748B]">
                      Type dish name in search box and press <kbd className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-700">Enter</kbd> to add items
                    </p>
                  </div>
                ) : (
                  cart.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs transition-colors hover:border-slate-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <VegBadge isVeg={entry.item.is_veg} />
                          <span className="font-bold text-[#0F172A] truncate">
                            {entry.item.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B]">
                          ₹{entry.unitPrice.toFixed(2)} each ({pricingSection})
                        </span>
                      </div>

                      {/* Touch & Click Qty Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(entry.item.id, -1)}
                            className="rounded p-1 text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                            aria-label={`Decrease ${entry.item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-[#0F172A]">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(entry.item.id, 1)}
                            className="rounded p-1 text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                            aria-label={`Increase ${entry.item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="w-16 text-right font-black text-[#10B981]">
                          ₹{entry.totalPrice.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(entry.item.id)}
                          className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          aria-label={`Remove ${entry.item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Summary & Actions */}
            <div className="mt-4 border-t border-[#E2E8F0] pt-3 space-y-3">
              <div className="space-y-1.5 text-xs text-[#64748B]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-[#0F172A]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>GST (5% - 2.5% CGST + 2.5% SGST):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-slate-200 pt-2 text-sm font-bold text-[#0F172A]">
                  <span>Total Payable:</span>
                  <span className="text-xl font-black text-[#10B981]">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons: Spacebar Print Workflow */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExecuteSettleAndPrint}
                  disabled={cart.length === 0}
                  className="w-full rounded-2xl bg-[#10B981] hover:bg-[#059669] py-3.5 text-sm font-black text-white transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4 text-white" />
                  <span>Settle & Print Thermal Receipt</span>
                  <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] font-mono text-white">
                    Press [Space]
                  </span>
                </button>

                <p className="text-center text-[10px] text-[#64748B]">
                  ⚡ Workflow: <kbd className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 text-slate-700 font-mono">Enter</kbd> to add items → When finished, press <kbd className="rounded bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 font-mono border border-emerald-200">Space</kbd> to print!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Print Preview & Settlement Modal (Step 11 & 12) */}
      {isPrintPreviewOpen && previewOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-purple-50 p-2 text-purple-600 border border-purple-200">
                  <Printer className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Bill Verification & Print Slip</h3>
                  <p className="text-[11px] text-[#64748B]">Order #{previewOrder.order_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Edit Bill Items</span>
                </button>
                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0F172A]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">
                  Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 border-[#10B981] text-emerald-700 ring-2 ring-emerald-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mb-1" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mb-1" />
                    <span>UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1" />
                    <span>Card</span>
                  </button>
                </div>
              </div>

              {/* Exact 80mm Thermal Receipt Layout (Step 12) */}
              <div className="bg-white p-5 text-black font-mono text-xs rounded-2xl border border-slate-200 shadow-inner select-none print:m-0 print:p-0">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
                  <h2 className="text-base font-black tracking-wider uppercase">SR HOTEL</h2>
                  <p className="text-[11px] font-semibold text-gray-700">Chettinad & South Indian Cuisine</p>
                  <p className="text-[10px] text-gray-600">42, Anna Salai, Heritage Plaza, Chennai - 600002</p>
                  <p className="text-[10px] text-gray-600">GSTIN: 33AAAAA0000A1Z5 | Ph: +91 98765 43210</p>
                </div>

                <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Invoice: <strong>{previewOrder.order_number}</strong></span>
                    <span>Section: <strong>{pricingSection}</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer: <strong>{previewOrder.customer_name}</strong></span>
                    <span>Cashier: {state.activeStaff.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                    <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2.5 border-b border-dashed border-gray-400">
                  <div className="grid grid-cols-12 text-[11px] font-bold pb-1 text-gray-700">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Amt</span>
                  </div>
                  {previewOrder.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] py-0.5">
                      <span className="col-span-6 truncate">{it.item_name}</span>
                      <span className="col-span-2 text-center">{it.quantity}</span>
                      <span className="col-span-2 text-right">₹{it.unit_price}</span>
                      <span className="col-span-2 text-right">₹{it.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Financials */}
                <div className="py-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{previewOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (2.5%):</span>
                    <span>₹{(previewOrder.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (2.5%):</span>
                    <span>₹{(previewOrder.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-gray-400 font-bold text-sm">
                    <span>NET TOTAL:</span>
                    <span>₹{previewOrder.final_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>Paid Via:</span>
                    <span>{paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-gray-400 text-center space-y-0.5">
                  <p className="text-[10px] font-bold">THANK YOU! VISIT AGAIN</p>
                  <p className="text-[9px] text-gray-500">For feedback: feedback@srhotel.com</p>
                </div>
              </div>
            </div>

            {/* Print Confirmation Actions */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#0F172A] border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Edit className="w-3.5 h-3.5 text-[#10B981]" />
                <span>← Edit Bill Items</span>
              </button>
              <button
                type="button"
                onClick={handleResetForNextCustomer}
                className="px-3 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-600 hover:text-[#0F172A] border border-slate-200 cursor-pointer shadow-xs"
              >
                Next Bill [Esc]
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Re-print Thermal Receipt [Space / Enter]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
