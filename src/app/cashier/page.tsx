'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { BillModal } from '../../components/BillModal';
import { Order, RestaurantTable } from '../../lib/types';
import Link from 'next/link';
import {
  Receipt,
  Users,
  CreditCard,
  History,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

export default function CashierDashboardPage() {
  const { state, stats, getActiveOrderForTable } = useRestaurant();
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect active bill requests
  const billRequests = state.orders.filter((o) => o.status === 'BILL_REQUESTED');

  // Filter tables
  const filteredTables = state.tables.filter((table) => {
    if (sectionFilter !== 'ALL' && table.section !== sectionFilter) return false;
    if (statusFilter !== 'ALL' && table.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTable = `table ${table.table_number}`.includes(q) || table.table_label.toLowerCase().includes(q);
      const matchCust = table.current_customer_name?.toLowerCase().includes(q);
      if (!matchTable && !matchCust) return false;
    }
    return true;
  });

  const sections = ['ALL', 'Main Dining', 'AC Family Hall', 'Garden Terrace'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Receipt className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Cashier Counter</h1>
                <p className="text-xs text-slate-400">
                  Real-time table status, bill calculation, and multi-channel payment settlement
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/billing"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Billing History</span>
            </Link>
          </div>
        </div>

        {/* Prominent Bill Request Notification Banner */}
        {billRequests.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/50 shadow-xl shadow-purple-950/40 animate-pulse-slow">
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
                    Waiter requested the bill for tables:{' '}
                    <strong>{billRequests.map((b) => `T${b.table_number}`).join(', ')}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {billRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedOrderForBill(req)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <span>Settle Table {req.table_number}</span>
                    <span className="text-[10px] bg-purple-900/40 text-purple-950 px-1.5 py-0.5 rounded font-black">
                      ₹{req.final_total.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Tables
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{stats.totalTables}</span>
              <span className="text-xs text-slate-500">All Sections</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Free Tables
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">{stats.freeTables}</span>
              <span className="text-xs text-emerald-500/80">Available</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
              Occupied Tables
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400">{stats.occupiedTables}</span>
              <span className="text-xs text-amber-500/80">Dining Active</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
              Bill Requests
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-purple-400">
                {stats.billRequestedTables}
              </span>
              <span className="text-xs text-purple-500/80">Awaiting Cashier</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Tables ({state.tables.length})
            </button>
            <button
              onClick={() => setStatusFilter('FREE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'FREE'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
              }`}
            >
              Free ({stats.freeTables})
            </button>
            <button
              onClick={() => setStatusFilter('OCCUPIED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'OCCUPIED'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-amber-400 hover:bg-slate-900'
              }`}
            >
              Occupied ({stats.occupiedTables})
            </button>
            <button
              onClick={() => setStatusFilter('BILL_REQUESTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'BILL_REQUESTED'
                  ? 'bg-purple-500 text-slate-950'
                  : 'bg-slate-950 text-purple-400 hover:bg-slate-900'
              }`}
            >
              Bill Requested ({stats.billRequestedTables})
            </button>
          </div>

          {/* Section dropdown & search */}
          <div className="flex items-center gap-2">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Sections' : s}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search table or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
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
      </div>

      {/* Bill & Payment Modal */}
      {selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          onClose={() => setSelectedOrderForBill(null)}
        />
      )}
    </div>
  );
}
