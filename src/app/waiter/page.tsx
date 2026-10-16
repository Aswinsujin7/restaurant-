'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { VegBadge, OrderStatusBadge } from '../../components/StatusBadge';
import { RestaurantTable, MenuItem, Order, PricingSection, OrderItem } from '../../lib/types';
import { getMenuItemNumber } from '../../components/MenuItemSearch';
import {
  UtensilsCrossed,
  Users,
  Plus,
  Minus,
  Send,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  Search,
  Bell,
  Clock,
  Flame,
  ChefHat,
  X,
  Snowflake,
  Sun,
  Lock,
  Ban,
} from 'lucide-react';

export default function WaiterDashboardPage() {
  const {
    state,
    stats,
    assignTable,
    createWalkInOrder,
    addItemsToOrder,
    requestBill,
    updateOrderItemStatus,
    updateOrderItems,
    cancelOrderItem,
    getActiveOrderForTable,
  } = useRestaurant();

  // Navigation mode: 'TABLES' or 'ORDER_TAKING'
  const [activeView, setActiveView] = useState<'TABLES' | 'ORDER_TAKING'>('TABLES');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [walkInOrderId, setWalkInOrderId] = useState<string | null>(null);

  // Table Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [guestCountInput, setGuestCountInput] = useState('2');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Walk-in Order Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('Walk-in Guest');
  const [walkInGuests, setWalkInGuests] = useState('1');
  const [walkInPricingSection, setWalkInPricingSection] = useState<PricingSection>('NON_AC');

  // Cancel / Edit Item Modal State (Customer changed mind)
  const [cancellingItem, setCancellingItem] = useState<{
    orderId: string;
    item: OrderItem;
  } | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("Customer changed mind / don't want food");
  const [cancelMode, setCancelMode] = useState<'ALL' | 'ONE'>('ALL');

  // Table section filter: ALL, AC, NON_AC
  const [tableSectionFilter, setTableSectionFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED'>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Section-specific counts for AC and Non-AC
  const acTables = state.tables.filter((t) =>
    t.pricing_section
      ? t.pricing_section === 'AC'
      : (t.is_ac ?? (!t.section?.toLowerCase().includes('non') && (t.section?.toLowerCase().includes('ac') ?? false)))
  );
  const nonAcTables = state.tables.filter((t) =>
    t.pricing_section
      ? t.pricing_section === 'NON_AC'
      : !(t.is_ac ?? (!t.section?.toLowerCase().includes('non') && (t.section?.toLowerCase().includes('ac') ?? false)))
  );

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

  const activeWaiterMetrics =
    tableSectionFilter === 'AC'
      ? {
          title: '❄️ AC Tables',
          total: acStats.total,
          free: acStats.free,
          occupied: acStats.occupied,
          billRequested: acStats.billRequested,
          subLabel: '6 AC Tables Section',
          freeSub: 'Ready for Seating',
          occupiedSub: 'Dining Active',
          billSub: 'Bill Requested in AC',
        }
      : tableSectionFilter === 'NON_AC'
      ? {
          title: '🌿 Non-AC Tables',
          total: nonAcStats.total,
          free: nonAcStats.free,
          occupied: nonAcStats.occupied,
          billRequested: nonAcStats.billRequested,
          subLabel: '6 Non-AC Tables Section',
          freeSub: 'Ready for Seating',
          occupiedSub: 'Dining Active',
          billSub: 'Bill Requested in Non-AC',
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

  // Filtered tables list for waiter
  const filteredWaiterTables = state.tables.filter((table) => {
    const isAc = table.pricing_section
      ? table.pricing_section === 'AC'
      : (table.is_ac ?? (!table.section?.toLowerCase().includes('non') && (table.section?.toLowerCase().includes('ac') ?? false)));
    if (tableSectionFilter === 'AC' && !isAc) return false;
    if (tableSectionFilter === 'NON_AC' && isAc) return false;
    if (tableStatusFilter !== 'ALL' && table.status !== tableStatusFilter) return false;
    if (tableSearchQuery) {
      const q = tableSearchQuery.toLowerCase();
      const matchTable = `table ${table.table_number}`.includes(q) || table.table_label.toLowerCase().includes(q);
      const matchCust = table.current_customer_name?.toLowerCase().includes(q);
      if (!matchTable && !matchCust) return false;
    }
    return true;
  });

  // Menu & Order Taking State - default to Chinese or first cuisine
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-chinese');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  // Current draft items to be submitted (Cart for this round)
  const [draftItems, setDraftItems] = useState<
    Record<string, { quantity: number; specialInstructions: string }>
  >({});
  const [orderActionMessage, setOrderActionMessage] = useState<string | null>(null);

  // Helper to get active order for the currently selected table
  const currentActiveOrder: Order | undefined = walkInOrderId
    ? state.orders.find((order) => order.id === walkInOrderId)
    : selectedTable
    ? getActiveOrderForTable(selectedTable.id)
    : undefined;

  // Active table from live state (keeps real-time synced)
  const liveActiveTable = selectedTable
    ? state.tables.find((t) => t.id === selectedTable.id) || selectedTable
    : null;

  // Pricing mode determined strictly from selected table's section or walk-in order
  const isAcSection = liveActiveTable
    ? (liveActiveTable.pricing_section
        ? liveActiveTable.pricing_section === 'AC'
        : (liveActiveTable.is_ac ?? (!liveActiveTable.section.toLowerCase().includes('non') && liveActiveTable.section.toLowerCase().includes('ac'))))
    : currentActiveOrder?.pricing_section === 'AC';

  const activePricingSection: PricingSection = isAcSection ? 'AC' : 'NON_AC';

  const handleStartWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createWalkInOrder(
      walkInName || 'Walk-in Guest',
      parseInt(walkInGuests) || 1,
      state.activeStaff.id,
      walkInPricingSection
    );
    if (!result.success || !result.orderId) return;
    setWalkInOrderId(result.orderId);
    setSelectedTable(null);
    setShowWalkInModal(false);
    setDraftItems({});
    setOrderActionMessage(null);
    setActiveView('ORDER_TAKING');
  };

  // Handle clicking a table card
  const handleSelectTable = (table: RestaurantTable) => {
    setWalkInOrderId(null);
    setSelectedTable(table);
    if (table.status === 'FREE') {
      setCustomerNameInput('');
      setGuestCountInput('2');
      setAssignError(null);
      setShowAssignModal(true);
    } else {
      // Table is occupied or bill requested: go directly into order view to manage / add extra items
      setDraftItems({});
      setActiveView('ORDER_TAKING');
    }
  };

  // Confirm Table Assignment
  const handleConfirmAssign = () => {
    if (!selectedTable) return;
    setAssignError(null);

    const result = assignTable(
      selectedTable.id,
      customerNameInput || 'Guest',
      parseInt(guestCountInput) || 2,
      state.activeStaff.id
    );

    if (!result.success) {
      setAssignError(result.error || 'Failed to assign table');
      return;
    }

    // Update local selected table reference
    const updatedTable = state.tables.find((t) => t.id === selectedTable.id);
    if (updatedTable) setSelectedTable(updatedTable);

    setShowAssignModal(false);
    setDraftItems({});
    setActiveView('ORDER_TAKING');
  };

  // Cart operations
  const handleUpdateItemQuantity = (menuItem: MenuItem, delta: number) => {
    setDraftItems((prev) => {
      const current = prev[menuItem.id] || { quantity: 0, specialInstructions: '' };
      const nextQty = Math.max(0, current.quantity + delta);

      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[menuItem.id];
        return copy;
      }

      return {
        ...prev,
        [menuItem.id]: {
          ...current,
          quantity: nextQty,
        },
      };
    });
  };

  const handleUpdateItemInstructions = (menuItemId: string, instructions: string) => {
    setDraftItems((prev) => {
      if (!prev[menuItemId]) return prev;
      return {
        ...prev,
        [menuItemId]: {
          ...prev[menuItemId],
          specialInstructions: instructions,
        },
      };
    });
  };

  // Submit draft items to Kitchen
  const handleSubmitItemsToKitchen = () => {
    if (!currentActiveOrder) return;

    const itemsList = Object.entries(draftItems).map(([menuItemId, data]) => ({
      menuItemId,
      quantity: data.quantity,
      specialInstructions: data.specialInstructions,
    }));

    if (itemsList.length === 0) return;

    // Trusted price determination: pass activePricingSection
    const result = addItemsToOrder(currentActiveOrder.id, itemsList, activePricingSection);
    if (result.success) {
      setDraftItems({});
      setOrderActionMessage('Order items submitted to kitchen successfully at ' + activePricingSection + ' rates!');
      setTimeout(() => setOrderActionMessage(null), 3500);
    }
  };

  // Waiter requests bill
  const handleRequestBill = (orderId: string) => {
    const result = requestBill(orderId);
    if (result.success) {
      setOrderActionMessage('Bill requested! Cashier has been notified.');
      setTimeout(() => setOrderActionMessage(null), 3500);
    }
  };

  // Waiter marks item as SERVED
  const handleMarkServed = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'SERVED');
  };

  // Waiter Cancels or Edits Ordered Item (Customer changed mind)
  const handleOpenCancelModal = (orderId: string, item: OrderItem) => {
    setCancellingItem({ orderId, item });
    setCancelReasonInput("Customer changed mind / don't want food");
    setCancelMode(item.quantity > 1 ? 'ONE' : 'ALL');
  };

  const handleConfirmItemCancel = () => {
    if (!cancellingItem || !currentActiveOrder) return;

    if (cancelMode === 'ONE' && cancellingItem.item.quantity > 1) {
      // Customer reduces 1 quantity
      const updatedItems = currentActiveOrder.items.map((it) => {
        if (it.id === cancellingItem.item.id) {
          const newQty = it.quantity - 1;
          return {
            ...it,
            quantity: newQty,
            total_price: Number((it.unit_price * newQty).toFixed(2)),
          };
        }
        return it;
      });
      const res = updateOrderItems(currentActiveOrder.id, updatedItems);
      if (res.success) {
        setOrderActionMessage(
          `Reduced 1x ${cancellingItem.item.item_name}. Remaining: ${cancellingItem.item.quantity - 1}x`
        );
        setTimeout(() => setOrderActionMessage(null), 3500);
      }
    } else {
      // Cancel entire item
      const res = cancelOrderItem(
        currentActiveOrder.id,
        cancellingItem.item.id,
        cancelReasonInput || 'Customer cancelled food'
      );
      if (res.success) {
        setOrderActionMessage(
          `Cancelled ${cancellingItem.item.item_name}. Marked CANCELLED in Kitchen and Cashier bill.`
        );
        setTimeout(() => setOrderActionMessage(null), 3500);
      }
    }
    setCancellingItem(null);
  };

  const activeCategoryId =
    selectedCategory && state.categories.some((c) => c.id === selectedCategory)
      ? selectedCategory
      : state.categories[0]?.id || 'cat-chinese';

  // Filtered menu items by cuisine or search by dish # or name
  const filteredMenuItems = state.menuItems.filter((item) => {
    // Only active items in waiter catalog
    if (item.is_active === false) return false;
    if (vegOnlyFilter && !item.is_veg) return false;

    if (menuSearchQuery.trim()) {
      const q = menuSearchQuery.trim().toLowerCase();
      const itemNum = getMenuItemNumber(item);
      const isNumeric = /^\d+$/.test(q);

      const numMatch = isNumeric
        ? String(itemNum) === q || String(itemNum).startsWith(q)
        : q.startsWith('#') && `#${itemNum}`.startsWith(q);

      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const category = state.categories.find((c) => c.id === item.category_id);
      const matchCat = category?.name.toLowerCase().includes(q);

      // When searching by dish # or name, match across ALL categories!
      return numMatch || matchName || matchDesc || matchCat;
    }

    if (activeCategoryId && item.category_id !== activeCategoryId) return false;
    return true;
  });

  const draftItemsCount = Object.values(draftItems).reduce((sum, i) => sum + i.quantity, 0);

  // Accurate section-specific unit price calculation for draft items
  const draftTotalAmount = Object.entries(draftItems).reduce((sum, [id, data]) => {
    const item = state.menuItems.find((m) => m.id === id);
    if (!item) return sum;
    const nonAc = item.price_non_ac ?? item.non_ac_price ?? item.price;
    const ac = item.price_ac ?? item.ac_price ?? nonAc;
    const unitPrice = isAcSection ? ac : nonAc;
    return sum + unitPrice * data.quantity;
  }, 0);

  return (
    <div className="min-h-full bg-[#F1F5F9] text-[#0F172A] flex flex-col">
      {/* Waiter Subheader */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 sticky top-14 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeView === 'ORDER_TAKING' && (
              <button
                onClick={() => setActiveView('TABLES')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0F172A] transition-colors cursor-pointer border border-slate-200"
                title="Back to tables"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0F172A] text-base">
                  {activeView === 'TABLES'
                    ? 'Waiter Mobile POS'
                    : liveActiveTable
                    ? `Table ${liveActiveTable.table_number} • ${liveActiveTable.section}`
                    : 'Walk-in • Order View'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  {state.activeStaff.full_name}
                </span>
                {activeView === 'ORDER_TAKING' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                      isAcSection
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isAcSection ? <Snowflake className="w-3 h-3 text-cyan-600" /> : <Sun className="w-3 h-3 text-emerald-600" />}
                    <span>{isAcSection ? 'AC SECTION' : 'NON-AC SECTION'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B]">
                {activeView === 'TABLES'
                  ? `${activeWaiterMetrics.free} Free Tables • ${activeWaiterMetrics.occupied + activeWaiterMetrics.billRequested} Active Orders (${tableSectionFilter === 'AC' ? 'AC Section' : tableSectionFilter === 'NON_AC' ? 'Non-AC Section' : 'All Sections'})`
                  : `Customer: ${liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'} (${liveActiveTable?.guest_count || currentActiveOrder?.guest_count || 1} Guests)`}
              </p>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('TABLES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'TABLES'
                  ? 'bg-[#10B981] text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              Tables
            </button>
            {(selectedTable || walkInOrderId) && (
              <button
                onClick={() => setActiveView('ORDER_TAKING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'ORDER_TAKING'
                    ? 'bg-[#10B981] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {selectedTable ? `T${selectedTable.table_number} Order` : 'Walk-in Order'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {orderActionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{orderActionMessage}</span>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: TABLES GRID
        ========================================================================= */}
        {activeView === 'TABLES' && (
          <div className="space-y-4">
            {/* Section Summary Banner when AC or Non-AC or ALL is active */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                    tableSectionFilter === 'AC'
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : tableSectionFilter === 'NON_AC'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25'
                  }`}
                >
                  {tableSectionFilter === 'AC' ? '❄️' : tableSectionFilter === 'NON_AC' ? '🌿' : '🍽️'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-[#0F172A]">
                      {tableSectionFilter === 'AC'
                        ? '❄️ AC Dining Hall (Tables 1 - 6)'
                        : tableSectionFilter === 'NON_AC'
                        ? '🌿 Non-AC Dining Hall (Tables 7 - 12)'
                        : '🍽️ All Dining Tables (AC + Non-AC)'}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {activeWaiterMetrics.total} Tables
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    {tableSectionFilter === 'AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[#10B981] font-bold">{acStats.free} Ready for Seating (Not Occupied)</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 font-bold">{acStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-purple-600 font-bold">{acStats.billRequested} Bill Req</span>
                      </span>
                    ) : tableSectionFilter === 'NON_AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[#10B981] font-bold">{nonAcStats.free} Ready for Seating (Not Occupied)</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 font-bold">{nonAcStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-purple-600 font-bold">{nonAcStats.billRequested} Bill Req</span>
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[#10B981] font-bold">{stats.freeTables} Tables Ready</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-600 font-bold">{stats.occupiedTables} Occupied</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-cyan-700 font-semibold">AC: {acStats.free} Free / {acStats.occupied + acStats.billRequested} Occupied</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-semibold">Non-AC: {nonAcStats.free} Free / {nonAcStats.occupied + nonAcStats.billRequested} Occupied</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quick toggle pill buttons right on the banner */}
              <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTableSectionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tableSectionFilter === 'ALL'
                      ? 'bg-[#10B981] text-white font-black shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  All (12)
                </button>
                <button
                  type="button"
                  onClick={() => setTableSectionFilter('AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tableSectionFilter === 'AC'
                      ? 'bg-cyan-600 text-white font-black shadow-sm'
                      : 'bg-slate-100 text-cyan-800 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>❄️ AC (6)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 font-mono font-bold">
                    {acStats.free} Free · {acStats.occupied + acStats.billRequested} Occupied
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableSectionFilter('NON_AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tableSectionFilter === 'NON_AC'
                      ? 'bg-[#10B981] text-white font-black shadow-sm'
                      : 'bg-slate-100 text-emerald-800 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>🌿 Non-AC (6)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 font-mono font-bold">
                    {nonAcStats.free} Free · {nonAcStats.occupied + nonAcStats.billRequested} Occupied
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Metrics Row for Waiter */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">
                  {tableSectionFilter === 'AC' ? 'Total AC Tables' : tableSectionFilter === 'NON_AC' ? 'Total Non-AC Tables' : 'Total Tables'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeWaiterMetrics.total}</span>
                  <span className="text-[11px] sm:text-xs text-[#64748B] font-medium truncate ml-1">{activeWaiterMetrics.subLabel}</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
                <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider truncate">
                  Free Tables (Ready)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#10B981]">{activeWaiterMetrics.free}</span>
                  <span className="text-[11px] sm:text-xs text-[#10B981] font-medium truncate ml-1">{activeWaiterMetrics.freeSub}</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider truncate">
                  Occupied (Dining)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-amber-600">{activeWaiterMetrics.occupied}</span>
                  <span className="text-[11px] sm:text-xs text-amber-600 font-medium truncate ml-1">{activeWaiterMetrics.occupiedSub}</span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider truncate">
                  Bill Requested
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-purple-600">
                    {activeWaiterMetrics.billRequested}
                  </span>
                  <span className="text-[11px] sm:text-xs text-purple-600 font-medium truncate ml-1">{activeWaiterMetrics.billSub}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Waiter - Fully Responsive */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'ALL'
                      ? 'bg-[#10B981] text-white font-black shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({activeWaiterMetrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('FREE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'FREE'
                      ? 'bg-[#10B981] text-white font-black shadow-sm'
                      : 'bg-slate-100 text-emerald-700 hover:bg-slate-200'
                  }`}
                >
                  Free ({activeWaiterMetrics.free})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('OCCUPIED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'OCCUPIED'
                      ? 'bg-amber-500 text-white font-black shadow-sm'
                      : 'bg-slate-100 text-amber-700 hover:bg-slate-200'
                  }`}
                >
                  Occupied ({activeWaiterMetrics.occupied})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('BILL_REQUESTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'BILL_REQUESTED'
                      ? 'bg-purple-600 text-white font-black shadow-sm'
                      : 'bg-slate-100 text-purple-700 hover:bg-slate-200'
                  }`}
                >
                  Bill Requested ({activeWaiterMetrics.billRequested})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTableSectionFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableSectionFilter === 'ALL'
                        ? 'bg-white text-[#0F172A] font-black shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({state.tables.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableSectionFilter('AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tableSectionFilter === 'AC'
                        ? 'bg-cyan-600 text-white font-black shadow-sm'
                        : 'text-cyan-800 hover:text-cyan-950'
                    }`}
                  >
                    <span>❄️ AC</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">
                      {acStats.free}F / {acStats.occupied + acStats.billRequested}B
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableSectionFilter('NON_AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tableSectionFilter === 'NON_AC'
                        ? 'bg-[#10B981] text-white font-black shadow-sm'
                        : 'text-emerald-800 hover:text-emerald-950'
                    }`}
                  >
                    <span>🌿 Non-AC</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">
                      {nonAcStats.free}F / {nonAcStats.occupied + nonAcStats.billRequested}B
                    </span>
                  </button>
                </div>

                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search table or guest..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="rounded-xl bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 font-bold text-xs text-white transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span>Walk-in Order</span>
                </button>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWaiterTables.map((table) => {
                const activeOrder = getActiveOrderForTable(table.id);
                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    activeOrder={activeOrder}
                    role="waiter"
                    onSelectTable={(t) => handleSelectTable(t)}
                    onRequestBill={(oId) => handleRequestBill(oId)}
                  />
                );
              })}
            </div>

            {filteredWaiterTables.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-[#E2E8F0] rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-[#64748B] font-medium">No tables match the selected filters</p>
                <button
                  onClick={() => {
                    setTableSectionFilter('ALL');
                    setTableStatusFilter('ALL');
                    setTableSearchQuery('');
                  }}
                  className="mt-3 text-xs text-[#10B981] font-bold hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: ACTIVE ORDER & MENU TAKING VIEW
        ========================================================================= */}
        {activeView === 'ORDER_TAKING' && (selectedTable || walkInOrderId) && (
          <div className="space-y-4">
            {/* Prominent Section Pricing Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                isAcSection
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    isAcSection
                      ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}
                >
                  {isAcSection ? <Snowflake className="w-5 h-5 text-cyan-700" /> : <Sun className="w-5 h-5 text-emerald-700" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#0F172A]">
                      {isAcSection ? '❄️ AC Pricing Section Active' : '🌿 Non-AC Pricing Section Active'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAcSection ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {liveActiveTable ? `Assigned to ${liveActiveTable.section}` : 'Walk-in'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Every menu product is automatically loaded at {isAcSection ? 'AC rates' : 'Non-AC rates'}. Order totals and line items reflect this section.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] block font-semibold text-slate-700">
                  {liveActiveTable ? `Table ${liveActiveTable.table_number}` : 'Walk-in Guest'}
                </span>
                <span className="text-xs text-[#0F172A] font-bold">
                  {liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Guest'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Columns: Menu Items Selection */}
              <div className="lg:col-span-7 space-y-4">
                {/* Menu Filter Header */}
                <div className="space-y-3 bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-sm">
                  {/* Search & Veg Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by dish # or name... (e.g. 1, Biryani, 6, Parotta)"
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <button
                      onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        vegOnlyFilter
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                      <span>Veg Only</span>
                    </button>
                  </div>

                  {/* Cuisine Category Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] font-semibold px-0.5">
                      <span>Select Cuisine:</span>
                      <span className="text-[#10B981] font-bold">
                        {state.categories.find((c) => c.id === activeCategoryId)?.name || 'Cuisine'} ({filteredMenuItems.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                      {state.categories.map((cat) => {
                        const count = state.menuItems.filter((m) => m.category_id === cat.id && m.is_active !== false).length;
                        const isCatSelected = activeCategoryId === cat.id;

                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              isCatSelected
                                ? 'bg-[#10B981] text-white shadow-sm font-black'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isCatSelected ? 'bg-black/20 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[64vh] overflow-y-auto pr-1">
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 text-center py-10 bg-white border border-dashed border-[#E2E8F0] rounded-2xl space-y-2">
                      <p className="text-xs text-[#64748B]">No dishes found in this cuisine.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuSearchQuery('');
                          setVegOnlyFilter(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Clear Search / Filters
                      </button>
                    </div>
                  )}

                  {filteredMenuItems.map((item) => {
                    const draftQuantity = draftItems[item.id]?.quantity || 0;
                    const isAvailable = item.is_available;

                    const nonAc = item.price_non_ac ?? item.non_ac_price ?? item.price;
                    const ac = item.price_ac ?? item.ac_price ?? nonAc;
                    const activeUnitPrice = isAcSection ? ac : nonAc;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          draftQuantity > 0
                            ? 'bg-emerald-50/60 border-emerald-400 shadow-sm'
                            : 'bg-white border-[#E2E8F0] hover:border-emerald-300 shadow-sm'
                        } ${!isAvailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 px-1.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-[11px] font-black text-[#0F172A] border border-slate-200 shadow-sm">
                                #{getMenuItemNumber(item)}
                              </span>
                              <VegBadge isVeg={item.is_veg} />
                              <h4 className="font-bold text-sm text-[#0F172A] leading-tight">{item.name}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`font-black text-sm block ${isAcSection ? 'text-cyan-700' : 'text-[#10B981]'}`}>
                                ₹{activeUnitPrice.toFixed(2)}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-[#64748B] block">
                                {isAcSection ? 'AC Price' : 'Non-AC Price'}
                              </span>
                            </div>
                          </div>

                          {/* Dual pricing display reference */}
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#64748B]">
                            <span className={!isAcSection ? 'text-[#10B981] font-bold' : ''}>Non-AC: ₹{nonAc.toFixed(2)}</span>
                            <span>•</span>
                            <span className={isAcSection ? 'text-cyan-700 font-bold' : ''}>AC: ₹{ac.toFixed(2)}</span>
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.spicy_level > 0 && (
                            <div className="flex items-center gap-0.5 mt-1.5 text-rose-500">
                              {Array.from({ length: item.spicy_level }).map((_, i) => (
                                <Flame key={i} className="w-3 h-3 fill-rose-500" />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Item Bottom Controls */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          {!isAvailable ? (
                            <span className="text-[10px] text-rose-600 font-bold">Out of stock</span>
                          ) : draftQuantity === 0 ? (
                            <button
                              onClick={() => handleUpdateItemQuantity(item, 1)}
                              className="w-full py-1.5 px-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5 text-white" />
                              <span>Add (₹{activeUnitPrice.toFixed(2)})</span>
                            </button>
                          ) : (
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => handleUpdateItemQuantity(item, -1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer border border-slate-200 shadow-sm"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <div className="text-center">
                                  <span className="font-black text-[#10B981] text-sm block leading-tight">
                                    {draftQuantity}
                                  </span>
                                  <span className="text-[9px] text-[#64748B]">
                                    ₹{(activeUnitPrice * draftQuantity).toFixed(2)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleUpdateItemQuantity(item, 1)}
                                  className="w-7 h-7 rounded-lg bg-[#10B981] hover:bg-[#059669] flex items-center justify-center text-white font-bold cursor-pointer shadow-sm"
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Special note (e.g. less spicy)..."
                                value={draftItems[item.id]?.specialInstructions || ''}
                                onChange={(e) => handleUpdateItemInstructions(item.id, e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 Columns: Active Order Status & KOT Cart */}
              <div className="lg:col-span-5 space-y-4">
                {/* Draft Items Ready to Send to Kitchen */}
                {draftItemsCount > 0 && (
                  <div className="bg-white border-2 border-[#10B981] rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                      <span className="text-xs font-black uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                        <Send className="w-4 h-4" />
                        New Items ({draftItemsCount}) • {isAcSection ? 'AC Rates' : 'Non-AC Rates'}
                      </span>
                      <span className="font-black text-[#0F172A] text-sm">₹{draftTotalAmount.toFixed(2)}</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                      {Object.entries(draftItems).map(([mId, data]) => {
                        const item = state.menuItems.find((m) => m.id === mId);
                        if (!item) return null;
                        const nonAc = item.price_non_ac ?? item.non_ac_price ?? item.price;
                        const ac = item.price_ac ?? item.ac_price ?? nonAc;
                        const unitPrice = isAcSection ? ac : nonAc;

                        return (
                          <div key={mId} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#0F172A]">
                                {data.quantity}x {item.name}
                              </span>
                              <span className="block text-[10px] text-[#64748B]">
                                ₹{unitPrice.toFixed(2)} each ({isAcSection ? 'AC' : 'Non-AC'})
                              </span>
                              {data.specialInstructions && (
                                <span className="block text-[10px] text-amber-700 italic">
                                  Note: {data.specialInstructions}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-[#0F172A]">
                              ₹{(unitPrice * data.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSubmitItemsToKitchen}
                      className="w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4 text-white" />
                      <span>Send {draftItemsCount} Items to Kitchen (KOT)</span>
                    </button>
                  </div>
                )}

                {/* Already Submitted Kitchen Order Status */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F172A]">
                          Order: {currentActiveOrder?.order_number || 'Pending'}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                            isAcSection ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isAcSection ? 'AC PRICING' : 'NON-AC PRICING'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Customer: <strong>{liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'}</strong>
                      </span>
                    </div>
                    {currentActiveOrder && <OrderStatusBadge status={currentActiveOrder.status} />}
                  </div>

                  {/* Submitted Items Breakdown with Unit Price & Line Total */}
                  {currentActiveOrder && currentActiveOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                        Kitchen Preparation Status
                      </span>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {currentActiveOrder.items.map((item) => {
                          const isReady = item.status === 'READY';
                          const isServed = item.status === 'SERVED';
                          const isCancelled = item.status === 'CANCELLED';

                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                isCancelled
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : isReady
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse-slow'
                                  : isServed
                                  ? 'bg-slate-50 border-slate-200 text-[#64748B]'
                                  : 'bg-white border-slate-200 text-[#0F172A]'
                              }`}
                            >
                              <div className="flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-black ${isCancelled ? 'line-through text-slate-400' : 'text-[#0F172A]'}`}>
                                    {item.quantity}x
                                  </span>
                                  <span className={`font-semibold ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                                    {item.item_name}
                                  </span>
                                  {isCancelled && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                      CANCELLED
                                    </span>
                                  )}
                                </div>
                                {isCancelled ? (
                                  <span className="text-[10px] text-rose-600 italic block mt-0.5">
                                    Cancelled: {item.cancel_reason || 'Customer cancelled food'}
                                  </span>
                                ) : (
                                  item.special_instructions && (
                                    <span className="text-[10px] text-amber-700 italic block">
                                      {item.special_instructions}
                                    </span>
                                  )
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-[#64748B] mt-0.5">
                                  <span>₹{item.unit_price.toFixed(2)} each</span>
                                  <span>•</span>
                                  <span>
                                    Total:{' '}
                                    <strong className={isCancelled ? 'line-through text-slate-400 font-normal' : 'text-[#0F172A]'}>
                                      ₹{item.total_price.toFixed(2)}
                                    </strong>{' '}
                                    {isCancelled && <span className="text-rose-600 font-bold">(₹0.00 billed)</span>}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-400">Round {item.round_number}</span>
                                  {item.pricing_section && (
                                    <>
                                      <span>•</span>
                                      <span className={item.pricing_section === 'AC' ? 'text-cyan-700 font-bold' : 'text-emerald-700 font-bold'}>
                                        {item.pricing_section}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <OrderStatusBadge status={item.status} />
                                {isReady && (
                                  <button
                                    onClick={() => handleMarkServed(currentActiveOrder.id, item.id)}
                                    className="px-2 py-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-sm"
                                  >
                                    Mark Served
                                  </button>
                                )}
                                {!isCancelled && currentActiveOrder.status !== 'PAID' && (
                                  <button
                                    onClick={() => handleOpenCancelModal(currentActiveOrder.id, item)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Customer says they don't want this food / Cancel item"
                                  >
                                    <Ban className="w-3 h-3 text-rose-600" />
                                    <span>Cancel Food</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Financial Totals */}
                      <div className="pt-3 border-t border-[#E2E8F0] text-xs space-y-1">
                        <div className="flex justify-between text-[#64748B]">
                          <span>Items Subtotal:</span>
                          <span>₹{currentActiveOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#64748B] text-[11px]">
                          <span>GST (5%):</span>
                          <span>₹{currentActiveOrder.tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-[#0F172A] pt-1">
                          <span>Current Total:</span>
                          <span className="text-[#10B981]">
                            ₹{currentActiveOrder.final_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-[#E2E8F0] rounded-xl text-[#64748B] text-xs">
                      No items submitted to kitchen yet. Select items from the menu on the left.
                    </div>
                  )}

                  {/* Bill Request Action */}
                  {currentActiveOrder && currentActiveOrder.items.length > 0 && (
                    <div className="pt-2">
                      {currentActiveOrder.status === 'BILL_REQUESTED' ? (
                        <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                          <Receipt className="w-4 h-4 animate-pulse text-purple-600" />
                          <span>Bill has been requested. Cashier counter notified.</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestBill(currentActiveOrder.id)}
                          className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Customer Finished - REQUEST BILL</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: ASSIGN FREE TABLE (WITH AC / NON-AC PRICING TOGGLE LOCK)
      ========================================================================= */}
      {showAssignModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-black">
                  T{selectedTable.table_number}
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm">Assign Table {selectedTable.table_number}</h3>
                  <p className="text-[11px] text-[#64748B]">
                    {selectedTable.section} • Capacity: {selectedTable.capacity} guests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {assignError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Party Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Vignesh / Table Guest"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest Count:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 6, 8].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setGuestCountInput(count.toString())}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        guestCountInput === count.toString()
                          ? 'bg-[#10B981] text-white border-[#10B981]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* AC / Non-AC Pricing Mode Toggle - Determined by Table's Configured Section */}
              {(() => {
                const isAcTable = selectedTable.pricing_section
                  ? selectedTable.pricing_section === 'AC'
                  : (selectedTable.is_ac ?? (!selectedTable.section.toLowerCase().includes('non') && selectedTable.section.toLowerCase().includes('ac')));

                return (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pricing Section Mode (Bound to Table):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                          !isAcTable
                            ? 'bg-emerald-50 border-[#10B981] text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-emerald-600" />
                          Non-AC Pricing
                        </span>
                        <span className="text-[10px]">
                          {!isAcTable ? '✓ Active for this table' : <span className="flex items-center gap-0.5"><Lock className="w-3 h-3" /> Locked</span>}
                        </span>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                          isAcTable
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-2 ring-cyan-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                          AC Pricing
                        </span>
                        <span className="text-[10px]">
                          {isAcTable ? '✓ Active for this table' : <span className="flex items-center gap-0.5"><Lock className="w-3 h-3" /> Locked</span>}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#64748B]">
                      Table {selectedTable.table_number} is configured in <strong className="text-[#0F172A]">{selectedTable.section}</strong>. Pricing mode is locked to the table&apos;s section to prevent conflict.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Seat Guests & Start Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: WALK-IN ORDER WITH AC / NON-AC SELECTION
      ========================================================================= */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-black">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm">Start Walk-in Order</h3>
                  <p className="text-[11px] text-[#64748B]">Counter / Take-away / Unassigned Table</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartWalkIn} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walk-in Guest"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guests:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={walkInGuests}
                  onChange={(e) => setWalkInGuests(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pricing Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInPricingSection('NON_AC')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      walkInPricingSection === 'NON_AC'
                        ? 'bg-emerald-50 border-[#10B981] text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold">Non-AC Pricing</span>
                    <span className="text-[10px] text-[#64748B] font-normal">Standard menu prices</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalkInPricingSection('AC')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      walkInPricingSection === 'AC'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-2 ring-cyan-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="font-bold">AC Pricing</span>
                    <span className="text-[10px] text-[#64748B] font-normal">AC section prices</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Start Walk-in Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CANCEL / EDIT ORDERED FOOD (CUSTOMER CHANGED MIND)
      ========================================================================= */}
      {cancellingItem && currentActiveOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-[#0F172A] text-base">Cancel Food Item</h3>
              </div>
              <button
                onClick={() => setCancellingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-[#0F172A] text-sm">{cancellingItem.item.item_name}</span>
                <span className="text-xs font-bold text-[#10B981]">
                  {cancellingItem.item.quantity}x @ ₹{cancellingItem.item.unit_price.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Table {currentActiveOrder.table_number || 'Walk-in'} • Customer: {currentActiveOrder.customer_name}
              </p>
            </div>

            {cancellingItem.item.quantity > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Cancel Scope:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelMode('ONE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      cancelMode === 'ONE'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-400/50'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reduce by 1 (Keep {cancellingItem.item.quantity - 1}x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelMode('ALL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      cancelMode === 'ALL'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400/50'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cancel Entire Item ({cancellingItem.item.quantity}x)
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Reason for Cancellation (Customer feedback):
              </label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Customer changed mind / don't want food"
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
              <div className="flex gap-1.5 flex-wrap pt-0.5">
                {['Customer changed mind', 'Waiting too long', 'Ordered wrong item'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReasonInput(preset)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-tight">
              ℹ️ Item will be marked <strong>CANCELLED</strong> in Kitchen and Cashier bill. It will be <strong>strictly omitted</strong> from the printed receipt and customer will not be billed.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200"
              >
                Keep Food
              </button>
              <button
                type="button"
                onClick={handleConfirmItemCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
