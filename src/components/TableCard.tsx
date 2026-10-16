'use client';

import React from 'react';
import { RestaurantTable, Order } from '../lib/types';
import { TableStatusBadge, OrderStatusBadge } from './StatusBadge';
import { Users, Clock, Receipt, Utensils, AlertTriangle } from 'lucide-react';

interface TableCardProps {
  table: RestaurantTable;
  activeOrder?: Order;
  role: 'cashier' | 'waiter' | 'admin' | 'kitchen';
  onSelectTable?: (table: RestaurantTable) => void;
  onRequestBill?: (orderId: string) => void;
  onOpenBillModal?: (order: Order) => void;
}

export function TableCard({
  table,
  activeOrder,
  role,
  onSelectTable,
  onRequestBill,
  onOpenBillModal,
}: TableCardProps) {
  const isFree = table.status === 'FREE';
  const isBillRequested = table.status === 'BILL_REQUESTED';
  const isOccupied = table.status === 'OCCUPIED';

  const [elapsed, setElapsed] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!activeOrder?.created_at) {
      setElapsed(null);
      return;
    }
    const update = () => {
      const diffMs = Date.now() - new Date(activeOrder.created_at).getTime();
      setElapsed(Math.floor(diffMs / 60000));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [activeOrder?.created_at]);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 border shadow-sm ${
        isFree
          ? 'bg-white border-[#E2E8F0] hover:border-emerald-300 hover:shadow-md'
          : isBillRequested
          ? 'bg-purple-50/40 border-purple-300 ring-2 ring-purple-400/30 shadow-md animate-pulse-slow'
          : 'bg-white border-amber-200/90 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      {/* Top Row: Table Name & Status Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                isFree
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isBillRequested
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              T{table.table_number}
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm leading-tight">
                {table.table_label}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    (table.pricing_section
                      ? table.pricing_section === 'AC'
                      : table.is_ac ??
                        (!table.section.toLowerCase().includes('non') &&
                          table.section.toLowerCase().includes('ac')))
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {(table.pricing_section
                    ? table.pricing_section === 'AC'
                    : table.is_ac ??
                      (!table.section.toLowerCase().includes('non') &&
                        table.section.toLowerCase().includes('ac')))
                    ? '❄️ AC'
                    : '🌿 Non-AC'}
                </span>
                <span className="text-[11px] text-[#64748B]">{table.section}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-[#64748B] flex items-center gap-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  {table.capacity}
                </span>
              </div>
            </div>
          </div>
          <TableStatusBadge status={table.status} />
        </div>

        {/* Content Section */}
        {isFree ? (
          <div className="py-4 my-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <span className="text-xs font-bold text-emerald-600">Available Table</span>
            <span className="text-[11px] text-[#64748B] mt-0.5">Ready for new guests</span>
          </div>
        ) : (
          <div className="space-y-2 py-1">
            {/* Customer & Guest Info */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="truncate pr-2">
                <span className="text-[10px] text-[#64748B] block uppercase font-bold">Customer</span>
                <span className="font-bold text-[#0F172A] truncate block">
                  {table.current_customer_name || activeOrder?.customer_name || 'Guest'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#64748B] block uppercase font-bold">Guests</span>
                <span className="font-bold text-[#0F172A]">
                  {table.guest_count || activeOrder?.guest_count || 1}
                </span>
              </div>
            </div>

            {/* Active Order Details */}
            {activeOrder && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B] font-medium">Active Order:</span>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{elapsed !== null ? `${elapsed}m seated` : 'Just now'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#10B981]">
                      ₹{activeOrder.final_total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items preview snippet */}
                {activeOrder.items && activeOrder.items.length > 0 && (
                  <p className="text-[11px] text-[#64748B] line-clamp-1 italic">
                    {activeOrder.items.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer depending on Role */}
      <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
        {/* Waiter Actions */}
        {role === 'waiter' && (
          <div>
            {isFree ? (
              <button
                type="button"
                onClick={() => onSelectTable && onSelectTable(table)}
                className="w-full py-2 px-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Assign & Take Order</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTable && onSelectTable(table)}
                  className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Utensils className="w-3 h-3 text-[#10B981]" />
                  <span>+ Add Items</span>
                </button>

                {!isBillRequested && activeOrder && (
                  <button
                    type="button"
                    onClick={() => onRequestBill && onRequestBill(activeOrder.id)}
                    className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Request Bill</span>
                  </button>
                )}

                {isBillRequested && (
                  <div className="col-span-1 py-1.5 px-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                    <Receipt className="w-3 h-3" />
                    <span>Bill Pending</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cashier Actions */}
        {role === 'cashier' && (
          <div>
            {isFree ? (
              <div className="text-center py-1 text-[#64748B] text-xs font-medium">
                No active bill
              </div>
            ) : (
              <button
                type="button"
                onClick={() => activeOrder && onOpenBillModal && onOpenBillModal(activeOrder)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  isBillRequested
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>
                  {isBillRequested ? 'Collect Payment (Requested)' : 'View Bill & Settle'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Kitchen/Admin view */}
        {(role === 'kitchen' || role === 'admin') && (
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>{isFree ? 'Table Ready' : `${activeOrder?.items.length || 0} items ordered`}</span>
            {isBillRequested && (
              <span className="text-purple-600 font-bold flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Bill Requested
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
