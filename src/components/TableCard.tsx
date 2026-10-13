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
      className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 border ${
        isFree
          ? 'bg-slate-900/60 border-emerald-900/40 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/30'
          : isBillRequested
          ? 'bg-purple-950/30 border-purple-600/70 shadow-lg shadow-purple-900/30 ring-2 ring-purple-500/40 animate-pulse-slow'
          : 'bg-slate-900/80 border-amber-900/40 hover:border-amber-500/50 shadow-md shadow-amber-950/20'
      }`}
    >
      {/* Top Row: Table Name & Status Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                isFree
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isBillRequested
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              T{table.table_number}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">{table.table_label}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>{table.section}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {table.capacity}
                </span>
              </p>
            </div>
          </div>
          <TableStatusBadge status={table.status} />
        </div>

        {/* Content Section */}
        {isFree ? (
          <div className="py-4 my-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <span className="text-xs font-semibold text-emerald-400">Available Table</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Ready for new guests</span>
          </div>
        ) : (
          <div className="space-y-2 py-1">
            {/* Customer & Guest Info */}
            <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <div className="truncate pr-2">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Customer</span>
                <span className="font-semibold text-slate-100 truncate block">
                  {table.current_customer_name || activeOrder?.customer_name || 'Guest'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Guests</span>
                <span className="font-semibold text-slate-200">
                  {table.guest_count || activeOrder?.guest_count || 1}
                </span>
              </div>
            </div>

            {/* Active Order Details */}
            {activeOrder && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Active Order:</span>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{elapsed !== null ? `${elapsed}m seated` : 'Just now'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">
                      ₹{activeOrder.final_total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items preview snippet */}
                {activeOrder.items && activeOrder.items.length > 0 && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                    {activeOrder.items.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer depending on Role */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        {/* Waiter Actions */}
        {role === 'waiter' && (
          <div>
            {isFree ? (
              <button
                onClick={() => onSelectTable && onSelectTable(table)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5" />
                Assign & Take Order
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectTable && onSelectTable(table)}
                  className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <Utensils className="w-3 h-3 text-amber-400" />
                  + Add Items
                </button>

                {!isBillRequested && activeOrder && (
                  <button
                    onClick={() => onRequestBill && onRequestBill(activeOrder.id)}
                    className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/30 flex items-center justify-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    Request Bill
                  </button>
                )}

                {isBillRequested && (
                  <div className="col-span-1 py-1.5 px-2 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[11px] font-medium text-center flex items-center justify-center gap-1">
                    <Receipt className="w-3 h-3" />
                    Bill Pending
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
              <div className="text-center py-1 text-slate-500 text-xs font-medium">
                No active bill
              </div>
            ) : (
              <button
                onClick={() => activeOrder && onOpenBillModal && onOpenBillModal(activeOrder)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isBillRequested
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/30'
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
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFree ? 'Table Ready' : `${activeOrder?.items.length || 0} items ordered`}</span>
            {isBillRequested && (
              <span className="text-purple-400 font-semibold flex items-center gap-1">
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
