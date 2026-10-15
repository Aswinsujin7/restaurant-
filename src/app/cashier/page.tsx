'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { BillModal } from '../../components/BillModal';
import { ParcelOrderModal } from '../../components/ParcelOrderModal';
import { ParcelReceiptModal } from '../../components/ParcelReceiptModal';
import { CateringOrderModal } from '../../components/CateringOrderModal';
import { CateringInvoiceModal } from '../../components/CateringInvoiceModal';
import { SettleCateringModal } from '../../components/SettleCateringModal';
import { ThermalReceipt } from '../../components/ThermalReceipt';
import { FastBillingModal } from '../../components/FastBillingModal';
import { Order, RestaurantTable, ParcelOrder, CateringOrder, MenuItem, Payment } from '../../lib/types';
import Link from 'next/link';
import {
  Receipt,
  Users,
  CreditCard,
  History,
  AlertCircle,
  Search,
  Filter,
  ShoppingBag,
  FileText,
  Plus,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Minus,
  X,
  Keyboard,
} from 'lucide-react';

export default function CashierDashboardPage() {
  const { state, stats, getActiveOrderForTable, createWalkInOrder, addItemsToOrder } = useRestaurant();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'B' || tabParam === 'parcel' || tabParam === 'b') {
        setActiveCategory('B_PARCEL');
      }
    }
  }, []);

  // Top Category Tabs: A = Table Bills, B = Parcel Bills, C = Catering Bills
  const [activeCategory, setActiveCategory] = useState<'A_TABLE' | 'B_PARCEL' | 'C_CATERING'>('A_TABLE');

  // Category A: Table Bills State
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [receiptToReprint, setReceiptToReprint] = useState<{ order: Order; payment: Payment } | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED'>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickGuests, setQuickGuests] = useState('1');
  const [quickPriceMode, setQuickPriceMode] = useState<'STANDARD' | 'AC'>('STANDARD');
  const [quickCart, setQuickCart] = useState<Record<string, number>>({});
  const [quickError, setQuickError] = useState('');

  // Category B: Parcel Bills State
  const [showNewParcelModal, setShowNewParcelModal] = useState(false);
  const [selectedParcelForReceipt, setSelectedParcelForReceipt] = useState<ParcelOrder | null>(null);
  const [parcelSearchQuery, setParcelSearchQuery] = useState('');

  // Category C: Catering Bills State
  const [showNewCateringModal, setShowNewCateringModal] = useState(false);
  const [selectedCateringForInvoice, setSelectedCateringForInvoice] = useState<CateringOrder | null>(null);
  const [autoPrintCateringInvoice, setAutoPrintCateringInvoice] = useState(false);
  const [cateringToSettle, setCateringToSettle] = useState<CateringOrder | null>(null);
  const [cateringSearchQuery, setCateringSearchQuery] = useState('');
  const [cateringStatusFilter, setCateringStatusFilter] = useState<'ALL' | 'ADVANCE_PAID' | 'FULLY_PAID'>('ALL');

  // Collect active bill requests for Category A
  const billRequests = state.orders.filter((o) => o.status === 'BILL_REQUESTED');
  const activeWalkInOrders = state.orders.filter((order) => order.table_number === 0 && order.status !== 'PAID' && order.status !== 'CANCELLED');

  // Global Cashier Dashboard Shortcuts: Space to collect pending bill, F2 for quick POS
  React.useEffect(() => {
    const handleCashierKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveCategory('B_PARCEL');
        setShowQuickOrder((prev) => !prev);
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement;
        const isTyping =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true');

        if (isTyping) return;

        // If any modal is active, let that modal's keyboard listener handle Space
        if (
          selectedOrderForBill ||
          showQuickOrder ||
          showNewParcelModal ||
          selectedParcelForReceipt ||
          showNewCateringModal ||
          selectedCateringForInvoice ||
          cateringToSettle ||
          receiptToReprint
        ) {
          return;
        }

        // Priority 1: If there are bill requests awaiting settlement, open the first one!
        if (billRequests.length > 0) {
          e.preventDefault();
          setSelectedOrderForBill(billRequests[0]);
          return;
        }

        // Priority 2: If there are active walk-in orders awaiting billing, open the first one
        if (activeWalkInOrders.length > 0) {
          e.preventDefault();
          setSelectedOrderForBill(activeWalkInOrders[0]);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleCashierKeyDown);
    return () => window.removeEventListener('keydown', handleCashierKeyDown);
  }, [
    billRequests,
    activeWalkInOrders,
    selectedOrderForBill,
    showQuickOrder,
    showNewParcelModal,
    selectedParcelForReceipt,
    showNewCateringModal,
    selectedCateringForInvoice,
    cateringToSettle,
    receiptToReprint,
  ]);

  // Detailed AC and Non-AC specific metrics
  const acTables = state.tables.filter((t) => t.pricing_section === 'AC' || t.is_ac);
  const nonAcTables = state.tables.filter((t) => !(t.pricing_section === 'AC' || t.is_ac));

  const acStats = {
    total: acTables.length,
    free: acTables.filter((t) => t.status === 'FREE').length,
    occupied: acTables.filter((t) => t.status === 'OCCUPIED').length,
    billRequested: acTables.filter((t) => t.status === 'BILL_REQUESTED').length,
  };

  const nonAcStats = {
    total: nonAcTables.length,
    free: nonAcTables.filter((t) => t.status === 'FREE').length,
    occupied: nonAcTables.filter((t) => t.status === 'OCCUPIED').length,
    billRequested: nonAcTables.filter((t) => t.status === 'BILL_REQUESTED').length,
  };

  // Section-aware active metrics (updates dynamically when AC or Non-AC is clicked)
  const activeMetrics =
    sectionFilter === 'AC'
      ? {
          title: '❄️ AC Tables',
          total: acStats.total,
          free: acStats.free,
          occupied: acStats.occupied,
          billRequested: acStats.billRequested,
          subLabel: '6 AC Tables Section',
          freeSub: 'Available in AC Hall',
          occupiedSub: 'Dining in AC Hall',
          billSub: 'Awaiting Settlement in AC',
        }
      : sectionFilter === 'NON_AC'
      ? {
          title: '🌿 Non-AC Tables',
          total: nonAcStats.total,
          free: nonAcStats.free,
          occupied: nonAcStats.occupied,
          billRequested: nonAcStats.billRequested,
          subLabel: '6 Non-AC Tables Section',
          freeSub: 'Available in Non-AC Hall',
          occupiedSub: 'Dining in Non-AC Hall',
          billSub: 'Awaiting Settlement in Non-AC',
        }
      : {
          title: 'All Tables',
          total: state.tables.length,
          free: stats.freeTables,
          occupied: stats.occupiedTables,
          billRequested: stats.billRequestedTables,
          subLabel: 'All 12 Tables (AC + Non-AC)',
          freeSub: `${acStats.free} AC · ${nonAcStats.free} Non-AC Free`,
          occupiedSub: `${acStats.occupied} AC · ${nonAcStats.occupied} Non-AC Dining`,
          billSub: `${acStats.billRequested} AC · ${nonAcStats.billRequested} Non-AC Bill Req`,
        };

  // Filter tables for Category A
  const filteredTables = state.tables.filter((table) => {
    const isAc = table.pricing_section
      ? table.pricing_section === 'AC'
      : (table.is_ac ?? (!table.section?.toLowerCase().includes('non') && (table.section?.toLowerCase().includes('ac') ?? false)));
    if (sectionFilter === 'AC' && !isAc) return false;
    if (sectionFilter === 'NON_AC' && isAc) return false;
    if (sectionFilter !== 'ALL' && sectionFilter !== 'AC' && sectionFilter !== 'NON_AC' && table.section !== sectionFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && table.status !== statusFilter) return false;
    if (tableSearchQuery) {
      const q = tableSearchQuery.toLowerCase();
      const matchTable = `table ${table.table_number}`.includes(q) || table.table_label.toLowerCase().includes(q);
      const matchCust = table.current_customer_name?.toLowerCase().includes(q);
      if (!matchTable && !matchCust) return false;
    }
    return true;
  });

  // Filter parcels for Category B
  const filteredParcels = state.parcels.filter((p) => {
    if (!parcelSearchQuery) return true;
    const q = parcelSearchQuery.toLowerCase();
    return (
      p.token_number.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      (p.customer_phone && p.customer_phone.includes(q))
    );
  });

  // Filter caterings for Category C
  const filteredCaterings = state.caterings.filter((c) => {
    if (cateringStatusFilter !== 'ALL' && c.status !== cateringStatusFilter) return false;
    if (!cateringSearchQuery) return true;
    const q = cateringSearchQuery.toLowerCase();
    return (
      c.invoice_number.toLowerCase().includes(q) ||
      c.customer_name.toLowerCase().includes(q) ||
      c.event_name.toLowerCase().includes(q) ||
      c.customer_phone.includes(q)
    );
  });

  // Financial aggregates
  const totalParcelSales = state.parcels.reduce((sum, p) => sum + p.final_total, 0);
  const totalCateringAdvance = state.caterings.reduce((sum, c) => sum + c.advance_paid, 0);
  const totalCateringBalance = state.caterings.reduce((sum, c) => sum + c.balance_due, 0);

  const sections = ['ALL', 'Main Dining', 'AC Family Hall', 'Garden Terrace'];
  const startQuickOrder = useCallback(() => {
    setActiveCategory('B_PARCEL');
    setQuickCart({});
    setQuickError('');
    setShowQuickOrder(true);
  }, []);

  // Auto-pop Fast Billing modal immediately whenever switching to Parcel Screen (Category B)
  const prevCategoryRef = useRef(activeCategory);
  useEffect(() => {
    if (prevCategoryRef.current !== 'B_PARCEL' && activeCategory === 'B_PARCEL') {
      startQuickOrder();
    }
    prevCategoryRef.current = activeCategory;
  }, [activeCategory, startQuickOrder]);

  const submitQuickOrder = () => {
    const items = Object.entries(quickCart)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (!items.length) return setQuickError('Please add at least one menu item.');
    const pricingSection: 'AC' | 'NON_AC' = quickPriceMode === 'AC' ? 'AC' : 'NON_AC';
    const walkInOrder = createWalkInOrder(quickCustomerName || 'Walk-in Guest', Number(quickGuests) || 1, pricingSection);
    if (!walkInOrder.success || !walkInOrder.orderId) return setQuickError(walkInOrder.error || 'Failed to create order.');
    const added = addItemsToOrder(walkInOrder.orderId, items, pricingSection);
    if (!added.success) return setQuickError(added.error || 'Failed to add items.');
    setShowQuickOrder(false);
    setQuickCart({});
  };

  const openPaidReceipt = (payment: Payment) => {
    const existingOrder = state.orders.find((order) => order.id === payment.order_id);
    const order: Order = existingOrder || {
      id: payment.order_id,
      order_number: payment.order_number,
      table_id: '',
      table_number: payment.table_number,
      customer_name: payment.customer_name,
      status: 'PAID',
      subtotal: payment.subtotal,
      tax_rate: 5,
      tax_amount: payment.tax_amount,
      discount_amount: payment.discount_amount,
      final_total: payment.final_total,
      created_at: payment.created_at,
      items: [{ id: `reprint-${payment.id}`, order_id: payment.order_id, item_name: 'Settled Order Items', quantity: 1, unit_price: payment.subtotal, total_price: payment.subtotal, status: 'SERVED', round_number: 1, created_at: payment.created_at }],
    };
    setReceiptToReprint({ order, payment });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Receipt className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Cashier Counter</h1>
              <p className="text-xs text-slate-400">
                Multi-channel billing operations: Table Dine-in, Takeaway Parcels & Catering Contracts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={startQuickOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-950/40 cursor-pointer"
              title="Fast Keyboard Billing POS (F2)"
            >
              <Keyboard className="w-4 h-4" />
              <span>⚡ Fast Keyboard Billing</span>
              <kbd className="hidden sm:inline-block bg-slate-950/30 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-950 border border-slate-950/20">F2</kbd>
            </button>

            <Link
              href="/admin/billing"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Billing History</span>
            </Link>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PRIMARY CATEGORY SELECTOR TABS: A, B, C */}
        {/* =================================================================== */}
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col lg:flex-row gap-2">
          {/* TAB A: Table Bills with embedded AC / NON split selectors */}
          <div
            onClick={() => setActiveCategory('A_TABLE')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex flex-wrap items-center justify-between gap-2 cursor-pointer ${
              activeCategory === 'A_TABLE'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/50'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                  activeCategory === 'A_TABLE' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                A
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory('A_TABLE');
                  setSectionFilter('ALL');
                }}
                className="text-sm font-black hover:underline cursor-pointer text-left"
              >
                Table Bills (Dine-in)
              </button>
            </div>

            {/* Split controls: AC (6) | NON (6) as sketched by user with live Free / Busy */}
            <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-black/15 flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory('A_TABLE');
                  setSectionFilter(sectionFilter === 'AC' ? 'ALL' : 'AC');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'A_TABLE' && sectionFilter === 'AC'
                    ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 shadow-md scale-105'
                    : 'bg-slate-900/90 text-cyan-300 hover:bg-cyan-950 border border-cyan-500/30'
                }`}
                title={`AC: ${acStats.free} Free, ${acStats.occupied + acStats.billRequested} Occupied`}
              >
                <span>❄️ AC (6)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/40 text-cyan-200">
                  {acStats.free} Free · {acStats.occupied + acStats.billRequested} Busy
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory('A_TABLE');
                  setSectionFilter(sectionFilter === 'NON_AC' ? 'ALL' : 'NON_AC');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'A_TABLE' && sectionFilter === 'NON_AC'
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md scale-105'
                    : 'bg-slate-900/90 text-emerald-300 hover:bg-emerald-950 border border-emerald-500/30'
                }`}
                title={`Non-AC: ${nonAcStats.free} Free, ${nonAcStats.occupied + nonAcStats.billRequested} Occupied`}
              >
                <span>🌿 NON (6)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/40 text-emerald-200">
                  {nonAcStats.free} Free · {nonAcStats.occupied + nonAcStats.billRequested} Busy
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {mounted && billRequests.length > 0 && (
                <span
                  suppressHydrationWarning
                  className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white animate-pulse"
                >
                  {billRequests.length} Req
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory('A_TABLE');
                  setSectionFilter('ALL');
                }}
                suppressHydrationWarning
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                  activeCategory === 'A_TABLE' && sectionFilter === 'ALL'
                    ? 'bg-slate-950 text-amber-400 font-black'
                    : activeCategory === 'A_TABLE'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {state.tables.length} Tables
              </button>
            </div>
          </div>

          {/* TAB B: Parcel Bills */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('B_PARCEL');
              startQuickOrder();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeCategory === 'B_PARCEL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeCategory === 'B_PARCEL' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                B
              </span>
              <span className="text-sm">Parcel Bills (Takeaway)</span>
            </div>
            <span
              suppressHydrationWarning
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeCategory === 'B_PARCEL' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {state.parcels.length} Orders
            </span>
          </button>

          {/* TAB C: Catering Bills */}
          <button
            type="button"
            onClick={() => setActiveCategory('C_CATERING')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeCategory === 'C_CATERING'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeCategory === 'C_CATERING' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                C
              </span>
              <span className="text-sm">Catering Bills (Bulk Booking)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {mounted && totalCateringBalance > 0 && (
                <span
                  suppressHydrationWarning
                  className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white"
                >
                  Bal Due
                </span>
              )}
              <span
                suppressHydrationWarning
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeCategory === 'C_CATERING' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {state.caterings.length} Invoices
              </span>
            </div>
          </button>
        </div>

        {/* =================================================================== */}
        {/* VIEW A: TABLE BILLS (DINE-IN) */}
        {/* =================================================================== */}
        {activeCategory === 'A_TABLE' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Prominent Bill Request Notification Banner */}
            {mounted && billRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/50 shadow-xl shadow-purple-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-slate-950 font-black shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>
                          {billRequests.length} Bill Request{billRequests.length > 1 ? 's' : ''} Pending Settlement!
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/40">
                          Action Required
                        </span>
                      </h3>
                      <p className="text-xs text-purple-200/80 mt-0.5">
                        Waiter requested bill for tables:{' '}
                        <strong>{billRequests.map((b) => `T${b.table_number}`).join(', ')}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {billRequests.map((req, idx) => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedOrderForBill(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Settle Table {req.table_number}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-400/40">
                            Space
                          </span>
                        )}
                        <span className="text-[10px] bg-purple-900/40 text-purple-950 px-1.5 py-0.5 rounded font-black">
                          ₹{req.final_total.toFixed(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section Summary Banner when AC or Non-AC or ALL is active */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
                sectionFilter === 'AC'
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                  : sectionFilter === 'NON_AC'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                    sectionFilter === 'AC'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : sectionFilter === 'NON_AC'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {sectionFilter === 'AC' ? '❄️' : sectionFilter === 'NON_AC' ? '🌿' : '🍽️'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-white">
                      {sectionFilter === 'AC'
                        ? '❄️ AC Dining Hall (Tables 1 - 6)'
                        : sectionFilter === 'NON_AC'
                        ? '🌿 Non-AC Dining Hall (Tables 7 - 12)'
                        : '🍽️ All Dining Tables (AC + Non-AC)'}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        sectionFilter === 'AC'
                          ? 'bg-cyan-900/60 text-cyan-200 border-cyan-400/40'
                          : sectionFilter === 'NON_AC'
                          ? 'bg-emerald-900/60 text-emerald-200 border-emerald-400/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {activeMetrics.total} Tables
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {sectionFilter === 'AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{acStats.free} Available (Not Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">{acStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400 font-bold">{acStats.billRequested} Bill Req</span>
                      </span>
                    ) : sectionFilter === 'NON_AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{nonAcStats.free} Available (Not Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">{nonAcStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400 font-bold">{nonAcStats.billRequested} Bill Req</span>
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{stats.freeTables} Free</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">{stats.occupiedTables} Occupied</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400 font-semibold">AC: {acStats.free} Free / {acStats.occupied + acStats.billRequested} Occupied</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 font-semibold">Non-AC: {nonAcStats.free} Free / {nonAcStats.occupied + nonAcStats.billRequested} Occupied</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quick toggle pill buttons right on the banner */}
              <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSectionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sectionFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({state.tables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSectionFilter('AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    sectionFilter === 'AC'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-950/50 ring-2 ring-cyan-300'
                      : 'bg-slate-950/70 text-cyan-300 hover:text-white border border-cyan-900/50'
                  }`}
                >
                  <span>❄️ AC (6)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/50 font-mono font-bold">
                    {acStats.free} Free · {acStats.occupied + acStats.billRequested} Occupied
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSectionFilter('NON_AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    sectionFilter === 'NON_AC'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950/50 ring-2 ring-emerald-300'
                      : 'bg-slate-950/70 text-emerald-300 hover:text-white border border-emerald-900/50'
                  }`}
                >
                  <span>🌿 Non-AC (6)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/50 font-mono font-bold">
                    {nonAcStats.free} Free · {nonAcStats.occupied + nonAcStats.billRequested} Occupied
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
                  {sectionFilter === 'AC' ? 'Total AC Tables' : sectionFilter === 'NON_AC' ? 'Total Non-AC Tables' : 'Total Tables'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-white">{activeMetrics.total}</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate ml-1">{activeMetrics.subLabel}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider truncate">
                  Free Tables (Available)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{activeMetrics.free}</span>
                  <span className="text-[11px] sm:text-xs text-emerald-500/80 font-medium truncate ml-1">{activeMetrics.freeSub}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider truncate">
                  Occupied (Busy)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">{activeMetrics.occupied}</span>
                  <span className="text-[11px] sm:text-xs text-amber-500/80 font-medium truncate ml-1">{activeMetrics.occupiedSub}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider truncate">
                  Bill Requests
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400">
                    {activeMetrics.billRequested}
                  </span>
                  <span className="text-[11px] sm:text-xs text-purple-500/80 font-medium truncate ml-1">{activeMetrics.billSub}</span>
                </div>
              </div>
            </div>

            {/* Filters and Search Bar - Fully Responsive */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({activeMetrics.total})
                </button>
                <button
                  onClick={() => setStatusFilter('FREE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'FREE'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                  }`}
                >
                  Free ({activeMetrics.free})
                </button>
                <button
                  onClick={() => setStatusFilter('OCCUPIED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'OCCUPIED'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-amber-400 hover:bg-slate-900'
                  }`}
                >
                  Occupied ({activeMetrics.occupied})
                </button>
                <button
                  onClick={() => setStatusFilter('BILL_REQUESTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'BILL_REQUESTED'
                      ? 'bg-purple-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-purple-400 hover:bg-slate-900'
                  }`}
                >
                  Bill Requested ({activeMetrics.billRequested})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSectionFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sectionFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({state.tables.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionFilter('AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      sectionFilter === 'AC'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                        : 'text-cyan-400 hover:bg-slate-900'
                    }`}
                  >
                    <span>❄️ AC</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950/60 text-cyan-200">
                      {acStats.free}F / {acStats.occupied + acStats.billRequested}B
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionFilter('NON_AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      sectionFilter === 'NON_AC'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-emerald-400 hover:bg-slate-900'
                    }`}
                  >
                    <span>🌿 Non-AC</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-200">
                      {nonAcStats.free}F / {nonAcStats.occupied + nonAcStats.billRequested}B
                    </span>
                  </button>
                </div>

                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search table or guest..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="w-full sm:w-52 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map((table) => {
                const activeOrder = getActiveOrderForTable(table.id);
                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    activeOrder={activeOrder}
                    role="cashier"
                    onOpenBillModal={(order) => setSelectedOrderForBill(order)}
                  />
                );
              })}
            </div>

            {filteredTables.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No tables match the selected filter</p>
              </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-4 py-3">
                <h2 className="text-sm font-bold text-white">Active Walk-in Orders</h2>
                <p className="text-[11px] text-slate-500">Orders created without table assignment</p>
              </div>
              {activeWalkInOrders.length === 0 ? (
                <p className="p-4 text-xs text-slate-500">No active walk-in orders.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {activeWalkInOrders.map((order) => {
                    const isAc = order.pricing_section === 'AC' || (order.section && order.section.includes('AC'));
                    return (
                      <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white">{order.order_number} • {order.customer_name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isAc ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                              {isAc ? '❄️ AC' : '🌿 Non-AC'}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {order.items.map((item) => `${item.item_name} ×${item.quantity}`).join(', ') || 'Items pending'} · {order.status.replace('_', ' ')}
                          </p>
                        </div>
                        <button onClick={() => setSelectedOrderForBill(order)} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-400">
                          <Receipt className="mr-1 inline h-3.5 w-3.5" />Open Bill
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div><h2 className="text-sm font-bold text-white">Recent Paid Bills</h2><p className="text-[11px] text-slate-500">Select previous bill to reprint thermal receipt.</p></div>
                <History className="h-4 w-4 text-amber-400" />
              </div>
              {state.payments.length === 0 ? <p className="p-4 text-xs text-slate-500">No settled bills yet.</p> : (
                <div className="divide-y divide-slate-800">
                  {[...state.payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6).map((payment) => (
                    <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-white">{payment.order_number} • {payment.customer_name}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {payment.table_number > 0 ? `Table ${payment.table_number}` : 'Walk-in'}
                          {payment.pricing_section ? ` (${payment.pricing_section})` : payment.section ? ` (${payment.section})` : ''} · {payment.payment_method} · {new Date(payment.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-amber-400">₹{payment.final_total.toFixed(2)}</span>
                        <button onClick={() => openPaidReceipt(payment)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-500">
                          <Printer className="h-3.5 w-3.5 text-amber-400" />Reprint
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW B: PARCEL BILLS (TAKEAWAY) */}
        {/* =================================================================== */}
        {activeCategory === 'B_PARCEL' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Fast Keyboard Billing Option in Category B */}
            <button
              onClick={startQuickOrder}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/30 transition-all hover:bg-amber-400 cursor-pointer"
            >
              <Keyboard className="h-4 w-4 text-slate-950" />
              <span>⚡ Fast Keyboard Billing (POS) • Direct Counter Bill</span>
              <span className="rounded bg-black/25 px-2 py-0.5 text-xs font-mono font-bold text-slate-950 border border-black/20">
                Press F2
              </span>
            </button>

            {/* Parcel Quick Stats & Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Parcel Orders
                  </span>
                  <span className="text-2xl font-black text-white">{state.parcels.length}</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Parcel Revenue
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    ₹{totalParcelSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search token, guest, phone..."
                    value={parcelSearchQuery}
                    onChange={(e) => setParcelSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52 sm:w-64"
                  />
                </div>
                <button
                  type="button"
                  onClick={startQuickOrder}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-colors shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>⚡ Fast Billing (F2)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewParcelModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Standard Parcel Form</span>
                </button>
              </div>
            </div>

            {/* Parcel Orders Table / List */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items Ordered</th>
                      <th className="py-3 px-4 text-right">Packaging</th>
                      <th className="py-3 px-4 text-right">Total Bill</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredParcels.map((parcel) => (
                      <tr key={parcel.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black font-mono text-xs">
                            {parcel.token_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{parcel.customer_name}</span>
                          {parcel.customer_phone ? (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {parcel.customer_phone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Counter walk-in</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate text-slate-300">
                            {parcel.items.map((i) => `${i.item_name} (×${i.quantity})`).join(', ')}
                          </div>
                          <span suppressHydrationWarning className="text-[10px] text-slate-500">
                            {new Date(parcel.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          ₹{parcel.packaging_charge.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-amber-400 text-sm">
                            ₹{parcel.final_total.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {parcel.payment_method} • PAID
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedParcelForReceipt(parcel)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Print Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredParcels.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No parcel bills recorded yet</p>
                  <button
                    onClick={() => setShowNewParcelModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    + Create First Parcel Bill
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW C: CATERING BILLS (BULK EVENT ORDERS) */}
        {/* =================================================================== */}
        {activeCategory === 'C_CATERING' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Catering Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Contracts
                  </span>
                  <span className="text-2xl font-black text-white">{state.caterings.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 border border-emerald-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Advance Collected
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{totalCateringAdvance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 border border-rose-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                    Pending Balances Due
                  </span>
                  <span className="text-2xl font-black text-rose-400">
                    ₹{totalCateringBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter and New Catering Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setCateringStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    cateringStatusFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({state.caterings.length})
                </button>
                <button
                  onClick={() => setCateringStatusFilter('ADVANCE_PAID')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    cateringStatusFilter === 'ADVANCE_PAID'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-amber-400'
                  }`}
                >
                  Balance Pending ({state.caterings.filter((c) => c.status === 'ADVANCE_PAID').length})
                </button>
                <button
                  onClick={() => setCateringStatusFilter('FULLY_PAID')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    cateringStatusFilter === 'FULLY_PAID'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-emerald-400'
                  }`}
                >
                  Fully Paid ({state.caterings.filter((c) => c.status === 'FULLY_PAID').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search invoice, client, event..."
                    value={cateringSearchQuery}
                    onChange={(e) => setCateringSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52 sm:w-60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCateringModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Catering Bill</span>
                </button>
              </div>
            </div>

            {/* Catering Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCaterings.map((catering) => {
                const isFullyPaid = catering.status === 'FULLY_PAID';
                return (
                  <div
                    key={catering.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-md"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                              {catering.invoice_number}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isFullyPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isFullyPaid ? 'FULLY PAID' : 'ADVANCE PAID'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-2">
                            {catering.customer_name}
                          </h3>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{catering.customer_phone}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-300 block">
                            {catering.event_name}
                          </span>
                          <span className="text-[11px] text-amber-400/90 flex items-center justify-end gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{catering.event_date}</span>
                          </span>
                        </div>
                      </div>

                      {/* Pax & Per Plate Specs */}
                      <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Guest Count
                          </span>
                          <span className="font-black text-white">{catering.pax_count} Pax</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Rate / Plate
                          </span>
                          <span className="font-black text-amber-400">₹{catering.price_per_plate}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Total Contract
                          </span>
                          <span className="font-black text-white">
                            ₹{catering.total_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Advance & Balance Breakdown */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Advance Received ({catering.payment_method})</span>
                          <span className="font-bold text-emerald-400">
                            ₹{catering.advance_paid.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Balance Due</span>
                          <span
                            className={`font-black ${
                              catering.balance_due > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            ₹{catering.balance_due.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCateringForInvoice(catering)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tax Invoice</span>
                      </button>

                      {catering.balance_due > 0 && (
                        <button
                          type="button"
                          onClick={() => setCateringToSettle(catering)}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settle Bal (₹{catering.balance_due.toLocaleString('en-IN')})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCaterings.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">No catering contracts match this filter</p>
                <button
                  onClick={() => setShowNewCateringModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  + Book Catering Contract
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}

      {/* Category B: Fast Keyboard Billing (POS) Modal */}
      <FastBillingModal
        isOpen={showQuickOrder}
        onClose={() => setShowQuickOrder(false)}
        initialPricingSection={sectionFilter === 'AC' ? 'AC' : 'NON_AC'}
      />

      {/* Category A: Table Bill Modal */}
      {selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          onClose={() => setSelectedOrderForBill(null)}
        />
      )}

      {receiptToReprint && (
        <ThermalReceipt order={receiptToReprint.order} payment={receiptToReprint.payment} onClose={() => setReceiptToReprint(null)} />
      )}

      {/* Category B: New Parcel Order Modal */}
      {showNewParcelModal && (
        <ParcelOrderModal
          onClose={() => setShowNewParcelModal(false)}
          onSuccess={(parcel) => {
            setShowNewParcelModal(false);
            setSelectedParcelForReceipt(parcel);
          }}
        />
      )}

      {/* Category B: Parcel Thermal Receipt Modal */}
      {selectedParcelForReceipt && (
        <ParcelReceiptModal
          parcel={selectedParcelForReceipt}
          autoPrint={true}
          onClose={() => setSelectedParcelForReceipt(null)}
        />
      )}

      {/* Category C: New Catering Contract Modal */}
      {showNewCateringModal && (
        <CateringOrderModal
          onClose={() => setShowNewCateringModal(false)}
          onSuccess={(cat) => {
            setShowNewCateringModal(false);
            setSelectedCateringForInvoice(cat);
            setAutoPrintCateringInvoice(true);
          }}
        />
      )}

      {/* Category C: Catering Tax Invoice Modal */}
      {selectedCateringForInvoice && (
        <CateringInvoiceModal
          catering={selectedCateringForInvoice}
          autoPrint={autoPrintCateringInvoice}
          onClose={() => {
            setSelectedCateringForInvoice(null);
            setAutoPrintCateringInvoice(false);
          }}
          onSettleBalance={(cat) => {
            setSelectedCateringForInvoice(null);
            setAutoPrintCateringInvoice(false);
            setCateringToSettle(cat);
          }}
        />
      )}

      {/* Category C: Settle Catering Balance Modal */}
      {cateringToSettle && (
        <SettleCateringModal
          catering={cateringToSettle}
          onClose={() => setCateringToSettle(null)}
          onSuccess={() => {
            const updated = state.caterings.find((c) => c.id === cateringToSettle.id);
            setCateringToSettle(null);
            if (updated) {
              setSelectedCateringForInvoice(updated);
              setAutoPrintCateringInvoice(true);
            }
          }}
        />
      )}
    </div>
  );
}
