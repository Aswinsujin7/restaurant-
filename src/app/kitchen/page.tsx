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
  const [filterMode, setFilterMode] = useState<
    'ACTIVE' | 'NEW' | 'PREPARING' | 'READY' | 'ALL'
  >('ACTIVE');
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
    <div className="min-h-full bg-[#F1F5F9] text-[#0F172A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Kitchen KDS Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#10B981] border border-emerald-200 flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
                  Kitchen Display System (KDS)
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#10B981] border border-emerald-200">
                  Live Orders
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Real-time tickets submitted by floor waiters with preparation workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestChime}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-colors cursor-pointer"
              title="Test audio chime"
            >
              <Volume2 className="w-4 h-4 text-[#10B981]" />
              <span>Chime Test</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-sm overflow-x-auto">
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
                type="button"
                onClick={() => setFilterMode(tab.id as typeof filterMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#64748B] font-bold px-2 shrink-0">
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
                className={`flex flex-col justify-between rounded-2xl border bg-white shadow-sm transition-all duration-200 overflow-hidden ${
                  order.status === 'READY'
                    ? 'border-[#10B981] ring-2 ring-emerald-200 shadow-md'
                    : isOverdue
                    ? 'border-red-300 ring-2 ring-red-100 shadow-md'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isOverdue
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {order.table_number > 0 ? `T${order.table_number}` : 'Walk-in'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F172A]">
                          {order.order_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] font-medium">
                        Customer: <strong className="text-[#0F172A]">{order.customer_name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <div
                      className={`flex items-center gap-1 justify-end text-[11px] font-bold mt-1 ${
                        isOverdue ? 'text-red-600 animate-pulse' : 'text-[#64748B]'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
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
                      const isItemCancelled = item.status === 'CANCELLED';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                            isItemCancelled
                              ? 'bg-red-50/60 border-red-200 text-red-600'
                              : isItemReady
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : isItemPreparing
                              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-[#0F172A]'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                                  isItemCancelled
                                    ? 'bg-red-100 text-red-700 border-red-300 line-through'
                                    : 'bg-white text-[#0F172A] border-slate-300 shadow-xs'
                                }`}
                              >
                                {item.quantity}
                              </span>
                              <span
                                className={`font-bold text-sm ${
                                  isItemCancelled
                                    ? 'line-through text-slate-400'
                                    : 'text-[#0F172A]'
                                }`}
                              >
                                {item.item_name}
                              </span>
                            </div>
                            {isItemCancelled ? (
                              <div className="mt-1 ml-8 px-2 py-0.5 rounded bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold inline-block">
                                🚫 Cancelled: {item.cancel_reason || 'Food not needed'} (Do Not Cook)
                              </div>
                            ) : (
                              item.special_instructions && (
                                <div className="mt-1 ml-8 px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold inline-block">
                                  Note: {item.special_instructions}
                                </div>
                              )
                            )}
                            <div className="mt-1 ml-8 text-[10px] text-[#64748B]">
                              Round {item.round_number}
                            </div>
                          </div>

                          {/* Individual Item Status Toggle */}
                          <div className="shrink-0 flex items-center gap-1">
                            {isItemCancelled && (
                              <span className="px-2 py-0.5 rounded bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                CANCELLED
                              </span>
                            )}
                            {item.status === 'NEW' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderItemStatus(order.id, item.id, 'PREPARING')
                                }
                                title="Start preparing this item"
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-sm"
                              >
                                Prep
                              </button>
                            )}
                            {item.status === 'PREPARING' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderItemStatus(order.id, item.id, 'READY')
                                }
                                title="Mark ready"
                                className="px-2.5 py-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold transition-colors shadow-sm cursor-pointer"
                              >
                                Ready
                              </button>
                            )}
                            {item.status === 'READY' && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                                Ready
                              </span>
                            )}
                            {item.status === 'SERVED' && (
                              <span className="text-[10px] font-bold text-slate-500">Served</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Bottom Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  {order.status === 'NEW' && (
                    <button
                      type="button"
                      onClick={() => updateTicketStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Preparing All Items</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      type="button"
                      onClick={() => updateTicketStatus(order.id, 'READY')}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark All Ready (Notify Floor Waiter)</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      type="button"
                      onClick={() => updateTicketStatus(order.id, 'SERVED')}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Mark All Served</span>
                    </button>
                  )}

                  {(order.status === 'SERVED' ||
                    order.status === 'BILL_REQUESTED' ||
                    order.status === 'PAID') && (
                    <div className="w-full py-1 text-center text-xs text-[#64748B] font-bold">
                      Ticket completed in kitchen
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {kitchenOrders.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <ChefHat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0F172A]">All clear! No pending kitchen orders.</h3>
            <p className="text-xs text-[#64748B] mt-1">
              New orders submitted by floor waiters will appear here instantly.
            </p>
          </div>
        )}

        {/* Kitchen Stock Live Overview */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm" aria-live="polite">
          <div className="flex flex-col gap-2 border-b border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#0F172A]">Kitchen Stock</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#10B981] border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">Food stock updates when an order is marked served.</p>
          </div>
          {state.inventoryItems.filter((item) => item.isActive !== false && item.category === 'FOOD').length === 0 ? (
            <p className="p-5 text-center text-xs text-[#64748B]">Food inventory has not been set up yet.</p>
          ) : (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-3">
              {state.inventoryItems
                .filter((item) => item.isActive !== false && item.category === 'FOOD')
                .sort(
                  (a, b) =>
                    Number(b.quantity <= b.lowStockThreshold) -
                      Number(a.quantity <= a.lowStockThreshold) ||
                    a.name.localeCompare(b.name)
                )
                .map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#0F172A]">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-[#64748B]">
                          Alert below {item.lowStockThreshold} {item.unit}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          isLow
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isLow && <AlertTriangle className="h-3 w-3" />}
                        {Number.isInteger(item.quantity)
                          ? item.quantity
                          : item.quantity.toFixed(2)}{' '}
                        {item.unit}
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
