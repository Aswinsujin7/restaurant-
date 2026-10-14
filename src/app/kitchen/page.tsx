'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { Order, OrderItemStatus } from '../../lib/types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Play,
  CheckCheck,
  Flame,
  Volume2,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import { playAlertChime } from '../../components/SoundAlert';

export default function KitchenDashboardPage() {
  const { state, updateOrderItemStatus, updateTicketStatus } = useRestaurant();
  const [filterMode, setFilterMode] = useState<'ACTIVE' | 'NEW' | 'PREPARING' | 'READY' | 'ALL'>('ACTIVE');
  const [now, setNow] = useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders for the kitchen screen
  const kitchenOrders = state.orders.filter((order) => {
    if (filterMode === 'ALL') return true;
    if (order.status === 'PAID' || order.status === 'CANCELLED') return false;
    if (filterMode === 'ACTIVE') return true;
    return order.status === filterMode;
  });

  const handleTestChime = () => {
    playAlertChime('order');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Kitchen KDS Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Kitchen Display System (KDS)</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live Orders
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time tickets submitted by floor waiters with preparation workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestChime}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              title="Test audio chime"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Chime Test</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ACTIVE', label: 'All Active' },
              { id: 'NEW', label: 'New Tickets' },
              { id: 'PREPARING', label: 'In Prep' },
              { id: 'READY', label: 'Ready for Pickup' },
              { id: 'ALL', label: 'Full Log' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as typeof filterMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterMode === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-semibold px-2 shrink-0">
            {kitchenOrders.length} Order{kitchenOrders.length === 1 ? '' : 's'} on Board
          </span>
        </div>

        {/* Order Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map((order) => {
            const elapsedMins = now
              ? Math.floor((now - new Date(order.created_at).getTime()) / 60000)
              : null;
            const isOverdue = elapsedMins !== null && elapsedMins > 20;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl border bg-slate-900/90 shadow-xl transition-all duration-200 overflow-hidden ${
                  order.status === 'READY'
                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/30'
                    : isOverdue
                    ? 'border-rose-600/70 shadow-rose-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isOverdue
                      ? 'bg-rose-950/30 border-rose-900/40'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                      {order.table_number > 0 ? `T${order.table_number}` : 'Walk-in'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {order.order_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Customer: <strong className="text-slate-200">{order.customer_name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <div
                      className={`flex items-center gap-1 justify-end text-[11px] font-bold mt-1 ${
                        isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{elapsedMins !== null ? `${elapsedMins}m ago` : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                {/* Items Checklist Body */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {order.items.map((item) => {
                      const isItemReady = item.status === 'READY';
                      const isItemPreparing = item.status === 'PREPARING';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                            isItemReady
                              ? 'bg-emerald-950/30 border-emerald-600/50 text-emerald-200'
                              : isItemPreparing
                              ? 'bg-amber-950/25 border-amber-600/40 text-amber-200'
                              : 'bg-slate-950/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center shrink-0 border border-amber-500/30">
                                {item.quantity}
                              </span>
                              <span className="font-bold text-sm text-white">{item.item_name}</span>
                            </div>
                            {item.special_instructions && (
                              <div className="mt-1 ml-8 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium inline-block">
                                Note: {item.special_instructions}
                              </div>
                            )}
                            <div className="mt-1 ml-8 text-[10px] text-slate-500">
                              Round {item.round_number}
                            </div>
                          </div>

                          {/* Individual Item Status Toggle */}
                          <div className="shrink-0 flex items-center gap-1">
                            {item.status === 'NEW' && (
                              <button
                                onClick={() =>
                                  updateOrderItemStatus(order.id, item.id, 'PREPARING')
                                }
                                title="Start preparing this item"
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[10px] font-bold transition-colors"
                              >
                                Prep
                              </button>
                            )}
                            {item.status === 'PREPARING' && (
                              <button
                                onClick={() =>
                                  updateOrderItemStatus(order.id, item.id, 'READY')
                                }
                                title="Mark ready"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors shadow-sm"
                              >
                                Ready
                              </button>
                            )}
                            {item.status === 'READY' && (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Ready
                              </span>
                            )}
                            {item.status === 'SERVED' && (
                              <span className="text-[10px] font-medium text-slate-500">Served</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Bottom Actions */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                  {order.status === 'NEW' && (
                    <button
                      onClick={() => updateTicketStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Preparing All Items</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateTicketStatus(order.id, 'READY')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark All Ready (Notify Floor Waiter)</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateTicketStatus(order.id, 'SERVED')}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Mark All Served</span>
                    </button>
                  )}

                  {(order.status === 'SERVED' ||
                    order.status === 'BILL_REQUESTED' ||
                    order.status === 'PAID') && (
                    <div className="w-full py-1 text-center text-xs text-slate-500 font-medium">
                      Ticket completed in kitchen
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {kitchenOrders.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">All clear! No pending kitchen orders.</h3>
            <p className="text-xs text-slate-500 mt-1">
              New orders submitted by floor waiters will appear here instantly.
            </p>
          </div>
        )}

        {/* Kitchen stock is shared with Admin Inventory and updates as dishes are served. */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70" aria-live="polite">
          <div className="flex flex-col gap-2 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Kitchen Stock</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">Live</span>
            </div>
            <p className="text-[11px] text-slate-500">Food stock updates when an order is marked served.</p>
          </div>
          {state.inventoryItems.filter((item) => item.isActive !== false && item.category === 'FOOD').length === 0 ? (
            <p className="p-5 text-center text-xs text-slate-500">Food inventory has not been set up yet.</p>
          ) : (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-3">
              {state.inventoryItems
                .filter((item) => item.isActive !== false && item.category === 'FOOD')
                .sort((a, b) => Number(b.quantity <= b.lowStockThreshold) - Number(a.quantity <= a.lowStockThreshold) || a.name.localeCompare(b.name))
                .map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-200">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Alert below {item.lowStockThreshold} {item.unit}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${isLow ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/[0.08] text-emerald-300'}`}>
                        {isLow && <AlertTriangle className="h-3 w-3" />}
                        {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)} {item.unit}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
