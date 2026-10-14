'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { VegBadge, OrderStatusBadge } from '../../components/StatusBadge';
import { RestaurantTable, MenuItem, Order } from '../../lib/types';
import {
  UtensilsCrossed,
  Users,
  Plus,
  Minus,
  Send,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  Bell,
  Clock,
  Flame,
  ChefHat,
  X,
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

  // Menu & Order Taking State - default to Chinese or first cuisine, no "All Items"
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-chinese');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  // Current draft items to be submitted (Cart for this round)
  // Mapping of menuItemId -> { quantity, specialInstructions }
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

  const startWalkInOrder = () => {
    const result = createWalkInOrder('Walk-in Guest', 1, state.activeStaff.id);
    if (!result.success || !result.orderId) return;
    setWalkInOrderId(result.orderId);
    setSelectedTable(null);
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

    const result = addItemsToOrder(currentActiveOrder.id, itemsList);
    if (result.success) {
      setDraftItems({});
      setOrderActionMessage('Order items submitted to kitchen successfully!');
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

  // Filtered menu items strictly by selected cuisine
  const filteredMenuItems = state.menuItems.filter((item) => {
    if (activeCategoryId && item.category_id !== activeCategoryId) return false;
    if (vegOnlyFilter && !item.is_veg) return false;
    if (menuSearchQuery) {
      const q = menuSearchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const draftItemsCount = Object.values(draftItems).reduce((sum, i) => sum + i.quantity, 0);
  const draftTotalAmount = Object.entries(draftItems).reduce((sum, [id, data]) => {
    const item = state.menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * data.quantity : 0);
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
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
                  : selectedTable ? `Table ${selectedTable.table_number} • Order View` : 'Walk-in • Order View'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {state.activeStaff.full_name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeView === 'TABLES'
                  ? `${stats.freeTables} Free Tables • ${stats.occupiedTables} Active Orders`
                  : `Customer: ${selectedTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'} (${selectedTable?.guest_count || currentActiveOrder?.guest_count || 1} Guests)`}
              </p>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('TABLES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Tap a table to take order</span>
              <div className="flex items-center gap-3"><span className="text-emerald-400 font-bold">{stats.freeTables} Tables Ready</span><button onClick={startWalkInOrder} className="rounded-xl bg-amber-500 px-3 py-2 font-black text-slate-950 hover:bg-amber-400"><Plus className="mr-1 inline h-3.5 w-3.5" />Walk-in Order</button></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {state.tables.map((table) => {
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
          </div>
        )}

        {/* =========================================================================
            VIEW 2: ACTIVE ORDER & MENU TAKING VIEW
        ========================================================================= */}
        {activeView === 'ORDER_TAKING' && (selectedTable || walkInOrderId) && (
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
                      placeholder="Search biryani, dosa, parotta..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      vegOnlyFilter
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Veg Only</span>
                  </button>
                </div>

                {/* Cuisine Category Selector - specific cuisines only, no "All Items" */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-0.5">
                    <span>Select Cuisine:</span>
                    <span className="text-amber-400 font-bold">
                      {state.categories.find((c) => c.id === activeCategoryId)?.name || 'Cuisine'} ({filteredMenuItems.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                    {state.categories.map((cat) => {
                      const count = state.menuItems.filter((m) => m.category_id === cat.id).length;
                      const isCatSelected = activeCategoryId === cat.id;
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
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            isCatSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 ring-2 ring-amber-400/40 font-black'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <span>{emoji} {cat.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isCatSelected
                                ? 'bg-slate-950/20 text-slate-950 font-black'
                                : 'bg-slate-900 text-slate-400'
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

              {/* Menu Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
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
                            <VegBadge isVeg={item.is_veg} />
                            <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                          </div>
                          <span className="font-black text-amber-400 text-sm shrink-0">
                            ₹{item.price}
                          </span>
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
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                              <button
                                onClick={() => handleUpdateItemQuantity(item, -1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-amber-400 text-sm">
                                {draftQuantity}
                              </span>
                              <button
                                onClick={() => handleUpdateItemQuantity(item, 1)}
                                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 font-bold"
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
                      New Items Ready to Send ({draftItemsCount})
                    </span>
                    <span className="font-black text-white text-sm">₹{draftTotalAmount.toFixed(2)}</span>
                  </div>

                  <div className="divide-y divide-slate-800 max-h-44 overflow-y-auto">
                    {Object.entries(draftItems).map(([mId, data]) => {
                      const item = state.menuItems.find((m) => m.id === mId);
                      if (!item) return null;
                      return (
                        <div key={mId} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">
                              {data.quantity}x {item.name}
                            </span>
                            {data.specialInstructions && (
                              <span className="block text-[10px] text-amber-400/80 italic">
                                Note: {data.specialInstructions}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-300">
                            ₹{(item.price * data.quantity).toFixed(2)}
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
                    <span className="text-xs font-bold text-white block">
                      Active Order: {currentActiveOrder?.order_number || 'Pending'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Customer: <strong>{selectedTable?.current_customer_name || currentActiveOrder?.customer_name || 'Walk-in Guest'}</strong>
                    </span>
                  </div>
                  {currentActiveOrder && <OrderStatusBadge status={currentActiveOrder.status} />}
                </div>

                {/* Submitted Items Breakdown */}
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
                              <span className="text-[10px] text-slate-500">Round {item.round_number}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <OrderStatusBadge status={item.status} />
                              {isReady && (
                                <button
                                  onClick={() => handleMarkServed(currentActiveOrder.id, item.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors"
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
        )}
      </div>

      {/* =========================================================================
          MODAL: ASSIGN FREE TABLE
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
                    {selectedTable.section} • Capacity: {selectedTable.capacity}
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
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
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
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Open Order & Go to Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
