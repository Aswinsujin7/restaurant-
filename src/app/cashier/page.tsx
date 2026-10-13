'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { TableCard } from '../../components/TableCard';
import { BillModal } from '../../components/BillModal';
import { ParcelOrderModal } from '../../components/ParcelOrderModal';
import { ParcelReceiptModal } from '../../components/ParcelReceiptModal';
import { CateringOrderModal } from '../../components/CateringOrderModal';
import { CateringInvoiceModal } from '../../components/CateringInvoiceModal';
import { SettleCateringModal } from '../../components/SettleCateringModal';
import { Order, RestaurantTable, ParcelOrder, CateringOrder } from '../../lib/types';
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
} from 'lucide-react';

export default function CashierDashboardPage() {
  const { state, stats, getActiveOrderForTable } = useRestaurant();

  // Top Category Tabs: A = Table Bills, B = Parcel Bills, C = Catering Bills
  const [activeCategory, setActiveCategory] = useState<'A_TABLE' | 'B_PARCEL' | 'C_CATERING'>('A_TABLE');

  // Category A: Table Bills State
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED'>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Category B: Parcel Bills State
  const [showNewParcelModal, setShowNewParcelModal] = useState(false);
  const [selectedParcelForReceipt, setSelectedParcelForReceipt] = useState<ParcelOrder | null>(null);
  const [parcelSearchQuery, setParcelSearchQuery] = useState('');

  // Category C: Catering Bills State
  const [showNewCateringModal, setShowNewCateringModal] = useState(false);
  const [selectedCateringForInvoice, setSelectedCateringForInvoice] = useState<CateringOrder | null>(null);
  const [cateringToSettle, setCateringToSettle] = useState<CateringOrder | null>(null);
  const [cateringSearchQuery, setCateringSearchQuery] = useState('');
  const [cateringStatusFilter, setCateringStatusFilter] = useState<'ALL' | 'ADVANCE_PAID' | 'FULLY_PAID'>('ALL');

  // Collect active bill requests for Category A
  const billRequests = state.orders.filter((o) => o.status === 'BILL_REQUESTED');

  // Filter tables for Category A
  const filteredTables = state.tables.filter((table) => {
    if (sectionFilter !== 'ALL' && table.section !== sectionFilter) return false;
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
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-1.5">
          {/* TAB A: Table Bills */}
          <button
            type="button"
            onClick={() => setActiveCategory('A_TABLE')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeCategory === 'A_TABLE'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeCategory === 'A_TABLE' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                A
              </span>
              <span className="text-sm">Table Bills (Dine-in)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {billRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white animate-pulse">
                  {billRequests.length} Req
                </span>
              )}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeCategory === 'A_TABLE' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {state.tables.length} Tables
              </span>
            </div>
          </button>

          {/* TAB B: Parcel Bills */}
          <button
            type="button"
            onClick={() => setActiveCategory('B_PARCEL')}
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
              {totalCateringBalance > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  Bal Due
                </span>
              )}
              <span
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
            {billRequests.length > 0 && (
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
                    {billRequests.map((req) => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedOrderForBill(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
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
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All Tables ({state.tables.length})
                </button>
                <button
                  onClick={() => setStatusFilter('FREE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'FREE'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                  }`}
                >
                  Free ({stats.freeTables})
                </button>
                <button
                  onClick={() => setStatusFilter('OCCUPIED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'OCCUPIED'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-amber-400 hover:bg-slate-900'
                  }`}
                >
                  Occupied ({stats.occupiedTables})
                </button>
                <button
                  onClick={() => setStatusFilter('BILL_REQUESTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'BILL_REQUESTED'
                      ? 'bg-purple-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-purple-400 hover:bg-slate-900'
                  }`}
                >
                  Bill Requested ({stats.billRequestedTables})
                </button>
              </div>

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
                    placeholder="Search table or guest..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
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
        )}

        {/* =================================================================== */}
        {/* VIEW B: PARCEL BILLS (TAKEAWAY) */}
        {/* =================================================================== */}
        {activeCategory === 'B_PARCEL' && (
          <div className="space-y-6 animate-in fade-in">
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

              <div className="flex items-center gap-2">
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
                  onClick={() => setShowNewParcelModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Parcel Bill</span>
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
                          <span className="text-[10px] text-slate-500">
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

      {/* Category A: Table Bill Modal */}
      {selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          onClose={() => setSelectedOrderForBill(null)}
        />
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
          }}
        />
      )}

      {/* Category C: Catering Tax Invoice Modal */}
      {selectedCateringForInvoice && (
        <CateringInvoiceModal
          catering={selectedCateringForInvoice}
          onClose={() => setSelectedCateringForInvoice(null)}
          onSettleBalance={(cat) => {
            setSelectedCateringForInvoice(null);
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
            if (updated) setSelectedCateringForInvoice(updated);
          }}
        />
      )}
    </div>
  );
}
