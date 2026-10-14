'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { VegBadge, OrderStatusBadge } from '../../components/StatusBadge';
import { RestaurantTable, MenuItem, Order, PricingSection } from '../../lib/types';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Waiter Subheader */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeView === 'ORDER_TAKING' && (
              <button
                onClick={() => setActiveView('TABLES')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Back to tables"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base">
                  {activeView === 'TABLES'
                    ? 'Waiter Mobile POS'
                    : liveActiveTable
                    ? `Table ${liveActiveTable.table_number} • ${liveActiveTable.section}`
                    : 'Walk-in • Order View'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {state.activeStaff.full_name}
                </span>
                {activeView === 'ORDER_TAKING' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                      isAcSection
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isAcSection ? <Snowflake className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
                    <span>{isAcSection ? 'AC SECTION' : 'NON-AC SECTION'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeView === 'TABLES'
                  ? `${activeWaiterMetrics.free} Free Tables • ${activeWaiterMetrics.occupied + activeWaiterMetrics.billRequested} Active Orders (${tableSectionFilter === 'AC' ? 'AC Section' : tableSectionFilter === 'NON_AC' ? 'Non-AC Section' : 'All Sections'})`
                  : `Customer: ${liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'} (${liveActiveTable?.guest_count || currentActiveOrder?.guest_count || 1} Guests)`}
              </p>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('TABLES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'TABLES'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tables
            </button>
            {(selectedTable || walkInOrderId) && (
              <button
                onClick={() => setActiveView('ORDER_TAKING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'ORDER_TAKING'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
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
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{orderActionMessage}</span>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: TABLES GRID
        ========================================================================= */}
        {activeView === 'TABLES' && (
          <div className="space-y-4">
            {/* Section Summary Banner when AC or Non-AC or ALL is active */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
                tableSectionFilter === 'AC'
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                  : tableSectionFilter === 'NON_AC'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                    tableSectionFilter === 'AC'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : tableSectionFilter === 'NON_AC'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {tableSectionFilter === 'AC' ? '❄️' : tableSectionFilter === 'NON_AC' ? '🌿' : '🍽️'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm sm:text-base text-white">
                      {tableSectionFilter === 'AC'
                        ? '❄️ AC Dining Hall (Tables 1 - 6)'
                        : tableSectionFilter === 'NON_AC'
                        ? '🌿 Non-AC Dining Hall (Tables 7 - 12)'
                        : '🍽️ All Dining Tables (AC + Non-AC)'}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        tableSectionFilter === 'AC'
                          ? 'bg-cyan-900/60 text-cyan-200 border-cyan-400/40'
                          : tableSectionFilter === 'NON_AC'
                          ? 'bg-emerald-900/60 text-emerald-200 border-emerald-400/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {activeWaiterMetrics.total} Tables
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {tableSectionFilter === 'AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{acStats.free} Ready for Seating (Not Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">{acStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400 font-bold">{acStats.billRequested} Bill Req</span>
                      </span>
                    ) : tableSectionFilter === 'NON_AC' ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{nonAcStats.free} Ready for Seating (Not Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">{nonAcStats.occupied} Dining (Occupied)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-purple-400 font-bold">{nonAcStats.billRequested} Bill Req</span>
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-emerald-400 font-bold">{stats.freeTables} Tables Ready</span>
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
                  onClick={() => setTableSectionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tableSectionFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All (12)
                </button>
                <button
                  type="button"
                  onClick={() => setTableSectionFilter('AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tableSectionFilter === 'AC'
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
                  onClick={() => setTableSectionFilter('NON_AC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tableSectionFilter === 'NON_AC'
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

            {/* Dynamic Metrics Row for Waiter */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
                  {tableSectionFilter === 'AC' ? 'Total AC Tables' : tableSectionFilter === 'NON_AC' ? 'Total Non-AC Tables' : 'Total Tables'}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-white">{activeWaiterMetrics.total}</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate ml-1">{activeWaiterMetrics.subLabel}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider truncate">
                  Free Tables (Ready)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{activeWaiterMetrics.free}</span>
                  <span className="text-[11px] sm:text-xs text-emerald-500/80 font-medium truncate ml-1">{activeWaiterMetrics.freeSub}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider truncate">
                  Occupied (Dining)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">{activeWaiterMetrics.occupied}</span>
                  <span className="text-[11px] sm:text-xs text-amber-500/80 font-medium truncate ml-1">{activeWaiterMetrics.occupiedSub}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider truncate">
                  Bill Requested
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400">
                    {activeWaiterMetrics.billRequested}
                  </span>
                  <span className="text-[11px] sm:text-xs text-purple-500/80 font-medium truncate ml-1">{activeWaiterMetrics.billSub}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar for Waiter - Fully Responsive */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({activeWaiterMetrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('FREE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'FREE'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                  }`}
                >
                  Free ({activeWaiterMetrics.free})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('OCCUPIED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'OCCUPIED'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-amber-400 hover:bg-slate-900'
                  }`}
                >
                  Occupied ({activeWaiterMetrics.occupied})
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('BILL_REQUESTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    tableStatusFilter === 'BILL_REQUESTED'
                      ? 'bg-purple-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-purple-400 hover:bg-slate-900'
                  }`}
                >
                  Bill Requested ({activeWaiterMetrics.billRequested})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTableSectionFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableSectionFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({state.tables.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableSectionFilter('AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tableSectionFilter === 'AC'
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
                    onClick={() => setTableSectionFilter('NON_AC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tableSectionFilter === 'NON_AC'
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
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 font-black text-xs text-slate-950 hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-950" />
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
              <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No tables match the selected filters</p>
                <button
                  onClick={() => {
                    setTableSectionFilter('ALL');
                    setTableStatusFilter('ALL');
                    setTableSearchQuery('');
                  }}
                  className="mt-3 text-xs text-amber-400 hover:underline cursor-pointer"
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
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
                isAcSection
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    isAcSection
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isAcSection ? <Snowflake className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">
                      {isAcSection ? '❄️ AC Pricing Section Active' : '🌿 Non-AC Pricing Section Active'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAcSection ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {liveActiveTable ? `Assigned to ${liveActiveTable.section}` : 'Walk-in'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Every menu product is automatically loaded at {isAcSection ? 'AC rates' : 'Non-AC rates'}. Order totals and line items reflect this section.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] block font-semibold text-slate-300">
                  {liveActiveTable ? `Table ${liveActiveTable.table_number}` : 'Walk-in Guest'}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Guest'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Columns: Menu Items Selection */}
              <div className="lg:col-span-7 space-y-4">
                {/* Menu Filter Header */}
                <div className="space-y-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                  {/* Search & Veg Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by dish # or name... (e.g. 1, Biryani, 6, Parotta)"
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        vegOnlyFilter
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Veg Only</span>
                    </button>
                  </div>

                  {/* Cuisine Category Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-0.5">
                      <span>Select Cuisine:</span>
                      <span className="text-amber-400 font-bold">
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
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 font-black ring-2 ring-amber-400/40'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isCatSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-900 text-slate-500'
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
                    <div className="col-span-1 sm:col-span-2 text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-2">
                      <p className="text-xs text-slate-400">No dishes found in this cuisine.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuSearchQuery('');
                          setVegOnlyFilter(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
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
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        } ${!isAvailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 px-1.5 shrink-0 items-center justify-center rounded-lg bg-slate-950 font-mono text-[11px] font-black text-amber-400 border border-slate-800 shadow-sm">
                                #{getMenuItemNumber(item)}
                              </span>
                              <VegBadge isVeg={item.is_veg} />
                              <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`font-black text-sm block ${isAcSection ? 'text-cyan-400' : 'text-amber-400'}`}>
                                ₹{activeUnitPrice.toFixed(2)}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                                {isAcSection ? 'AC Price' : 'Non-AC Price'}
                              </span>
                            </div>
                          </div>

                          {/* Dual pricing display reference */}
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                            <span className={!isAcSection ? 'text-amber-400 font-bold' : ''}>Non-AC: ₹{nonAc.toFixed(2)}</span>
                            <span>•</span>
                            <span className={isAcSection ? 'text-cyan-400 font-bold' : ''}>AC: ₹{ac.toFixed(2)}</span>
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.spicy_level > 0 && (
                            <div className="flex items-center gap-0.5 mt-1.5 text-rose-400">
                              {Array.from({ length: item.spicy_level }).map((_, i) => (
                                <Flame key={i} className="w-3 h-3 fill-rose-500" />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Item Bottom Controls */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                          {!isAvailable ? (
                            <span className="text-[10px] text-rose-400 font-bold">Out of stock</span>
                          ) : draftQuantity === 0 ? (
                            <button
                              onClick={() => handleUpdateItemQuantity(item, 1)}
                              className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-950" />
                              <span>Add (₹{activeUnitPrice.toFixed(2)})</span>
                            </button>
                          ) : (
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                                <button
                                  onClick={() => handleUpdateItemQuantity(item, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <div className="text-center">
                                  <span className="font-black text-amber-400 text-sm block leading-tight">
                                    {draftQuantity}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    ₹{(activeUnitPrice * draftQuantity).toFixed(2)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleUpdateItemQuantity(item, 1)}
                                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 font-bold cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 text-slate-950" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Special note (e.g. less spicy)..."
                                value={draftItems[item.id]?.specialInstructions || ''}
                                onChange={(e) => handleUpdateItemInstructions(item.id, e.target.value)}
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
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
                  <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl shadow-amber-950/20 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Send className="w-4 h-4" />
                        New Items ({draftItemsCount}) • {isAcSection ? 'AC Rates' : 'Non-AC Rates'}
                      </span>
                      <span className="font-black text-white text-sm">₹{draftTotalAmount.toFixed(2)}</span>
                    </div>

                    <div className="divide-y divide-slate-800 max-h-44 overflow-y-auto">
                      {Object.entries(draftItems).map(([mId, data]) => {
                        const item = state.menuItems.find((m) => m.id === mId);
                        if (!item) return null;
                        const nonAc = item.price_non_ac ?? item.non_ac_price ?? item.price;
                        const ac = item.price_ac ?? item.ac_price ?? nonAc;
                        const unitPrice = isAcSection ? ac : nonAc;

                        return (
                          <div key={mId} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-white">
                                {data.quantity}x {item.name}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                ₹{unitPrice.toFixed(2)} each ({isAcSection ? 'AC' : 'Non-AC'})
                              </span>
                              {data.specialInstructions && (
                                <span className="block text-[10px] text-amber-400/80 italic">
                                  Note: {data.specialInstructions}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-slate-100">
                              ₹{(unitPrice * data.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSubmitItemsToKitchen}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4 text-slate-950" />
                      <span>Send {draftItemsCount} Items to Kitchen (KOT)</span>
                    </button>
                  </div>
                )}

                {/* Already Submitted Kitchen Order Status */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          Order: {currentActiveOrder?.order_number || 'Pending'}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                            isAcSection ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isAcSection ? 'AC PRICING' : 'NON-AC PRICING'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Customer: <strong>{liveActiveTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'}</strong>
                      </span>
                    </div>
                    {currentActiveOrder && <OrderStatusBadge status={currentActiveOrder.status} />}
                  </div>

                  {/* Submitted Items Breakdown with Unit Price & Line Total */}
                  {currentActiveOrder && currentActiveOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Kitchen Preparation Status
                      </span>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {currentActiveOrder.items.map((item) => {
                          const isReady = item.status === 'READY';
                          const isServed = item.status === 'SERVED';

                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                isReady
                                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 animate-pulse-slow'
                                  : isServed
                                  ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                                  : 'bg-slate-950/80 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-white">{item.quantity}x</span>
                                  <span className="font-semibold">{item.item_name}</span>
                                </div>
                                {item.special_instructions && (
                                  <span className="text-[10px] text-amber-400/90 italic block">
                                    {item.special_instructions}
                                  </span>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>₹{item.unit_price.toFixed(2)} each</span>
                                  <span>•</span>
                                  <span>Total: <strong className="text-white">₹{item.total_price.toFixed(2)}</strong></span>
                                  <span>•</span>
                                  <span className="text-slate-500">Round {item.round_number}</span>
                                  {item.pricing_section && (
                                    <>
                                      <span>•</span>
                                      <span className={item.pricing_section === 'AC' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
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
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Mark Served
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Financial Totals */}
                      <div className="pt-3 border-t border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Items Subtotal:</span>
                          <span>₹{currentActiveOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>GST (5%):</span>
                          <span>₹{currentActiveOrder.tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-white pt-1">
                          <span>Current Total:</span>
                          <span className="text-amber-400">
                            ₹{currentActiveOrder.final_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      No items submitted to kitchen yet. Select items from the menu on the left.
                    </div>
                  )}

                  {/* Bill Request Action */}
                  {currentActiveOrder && currentActiveOrder.items.length > 0 && (
                    <div className="pt-2">
                      {currentActiveOrder.status === 'BILL_REQUESTED' ? (
                        <div className="p-3 bg-purple-950/60 border border-purple-800 text-purple-300 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                          <Receipt className="w-4 h-4 animate-pulse" />
                          <span>Bill has been requested. Cashier counter notified.</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestBill(currentActiveOrder.id)}
                          className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-950/40 flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  T{selectedTable.table_number}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Assign Table {selectedTable.table_number}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTable.section} • Capacity: {selectedTable.capacity} guests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {assignError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer / Party Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Vignesh / Table Guest"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Pricing Section Mode (Bound to Table):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                          !isAcTable
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          Non-AC Pricing
                        </span>
                        <span className="text-[10px]">
                          {!isAcTable ? '✓ Active for this table' : <span className="flex items-center gap-0.5"><Lock className="w-3 h-3" /> Locked</span>}
                        </span>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                          isAcTable
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                          AC Pricing
                        </span>
                        <span className="text-[10px]">
                          {isAcTable ? '✓ Active for this table' : <span className="flex items-center gap-0.5"><Lock className="w-3 h-3" /> Locked</span>}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Table {selectedTable.table_number} is configured in <strong className="text-white">{selectedTable.section}</strong>. Pricing mode is locked to the table&apos;s section to prevent conflict.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Start Walk-in Order</h3>
                  <p className="text-[11px] text-slate-400">Counter / Take-away / Unassigned Table</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartWalkIn} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walk-in Guest"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guests:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={walkInGuests}
                  onChange={(e) => setWalkInGuests(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Pricing Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInPricingSection('NON_AC')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      walkInPricingSection === 'NON_AC'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">Non-AC Pricing</span>
                    <span className="text-[10px] text-slate-400 font-normal">Standard menu prices</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalkInPricingSection('AC')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      walkInPricingSection === 'AC'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold">AC Pricing</span>
                    <span className="text-[10px] text-slate-400 font-normal">AC section prices</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Start Walk-in Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
