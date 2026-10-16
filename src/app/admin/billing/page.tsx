'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { Payment, Order } from '../../../lib/types';
import { ThermalReceipt } from '../../../components/ThermalReceipt';
import {
  History,
  Search,
  Filter,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react';

export default function BillingHistoryPage() {
  const { state } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'UPI' | 'CARD'>('ALL');
  const [receiptToPrint, setReceiptToPrint] = useState<{
    order: Order;
    payment: Payment;
  } | null>(null);

  // Financial computations
  const totalRevenue = state.payments.reduce((sum, p) => sum + (p.final_total || 0), 0);
  const totalSubtotal = state.payments.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const totalTax = state.payments.reduce((sum, p) => sum + (p.tax_amount || 0), 0);
  const totalDiscount = state.payments.reduce((sum, p) => sum + (p.discount_amount || 0), 0);

  const cashRevenue = state.payments
    .filter((p) => p.payment_method === 'CASH')
    .reduce((sum, p) => sum + p.final_total, 0);

  const upiRevenue = state.payments
    .filter((p) => p.payment_method === 'UPI')
    .reduce((sum, p) => sum + p.final_total, 0);

  const cardRevenue = state.payments
    .filter((p) => p.payment_method === 'CARD')
    .reduce((sum, p) => sum + p.final_total, 0);

  // Filter payments
  const filteredPayments = state.payments.filter((payment) => {
    if (methodFilter !== 'ALL' && payment.payment_method !== methodFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchOrder = payment.order_number.toLowerCase().includes(q);
      const matchCustomer = payment.customer_name.toLowerCase().includes(q);
      const matchTable = `table ${payment.table_number}`.includes(q);
      if (!matchOrder && !matchCustomer && !matchTable) return false;
    }
    return true;
  });

  const handleOpenReceipt = (payment: Payment) => {
    const order = state.orders.find((o) => o.id === payment.order_id);
    if (order) {
      setReceiptToPrint({ order, payment });
    } else {
      // Fallback synthetic order from payment for historical receipt
      const fallbackOrder: Order = {
        id: payment.order_id,
        order_number: payment.order_number,
        table_id: '',
        table_number: payment.table_number,
        customer_name: payment.customer_name,
        status: 'PAID',
        subtotal: payment.subtotal,
        tax_rate: 5.0,
        tax_amount: payment.tax_amount,
        discount_amount: payment.discount_amount,
        final_total: payment.final_total,
        created_at: payment.created_at,
        items: [
          {
            id: 'legacy-item',
            order_id: payment.order_id,
            item_name: 'Settled Order Dining Items',
            quantity: 1,
            unit_price: payment.subtotal,
            total_price: payment.subtotal,
            status: 'SERVED',
            round_number: 1,
            created_at: payment.created_at,
          },
        ],
      };
      setReceiptToPrint({ order: fallbackOrder, payment });
    }
  };

  return (
    <div className="min-h-full bg-[#F1F5F9] text-[#0F172A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] border border-emerald-200 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0F172A]">Billing History & Reports</h1>
              <p className="text-xs text-[#64748B]">
                Audited payment records, revenue analytics, and tax compliance ledger
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="uppercase font-bold tracking-wider">Total Sales (Gross)</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#10B981]">
                ₹{totalRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {state.payments.length} orders settled
              </p>
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-purple-700">
              <span className="uppercase font-bold tracking-wider">UPI Collections</span>
              <QrCode className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-purple-700">
                ₹{upiRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {state.payments.filter((p) => p.payment_method === 'UPI').length} transactions
              </p>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span className="uppercase font-bold tracking-wider">Cash Register</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-700">
                ₹{cashRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {state.payments.filter((p) => p.payment_method === 'CASH').length} transactions
              </p>
            </div>
          </div>

          <div className="bg-white border border-sky-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-sky-700">
              <span className="uppercase font-bold tracking-wider">Card Terminal</span>
              <CreditCard className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-sky-700">
                ₹{cardRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {state.payments.filter((p) => p.payment_method === 'CARD').length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          {/* Payment Method Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Modes' },
              { id: 'UPI', label: 'UPI' },
              { id: 'CASH', label: 'Cash' },
              { id: 'CARD', label: 'Card' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMethodFilter(tab.id as typeof methodFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  methodFilter === tab.id
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-[#0F172A] hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Invoice # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Payment History Table */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Table</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Method & Ref</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                  <th className="p-3.5 text-right">GST (5%)</th>
                  <th className="p-3.5 text-right">Total Paid</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const formattedTime = new Date(p.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0F172A]">
                        {p.order_number}
                      </td>
                      <td className="p-3.5 text-[#64748B]">{formattedTime}</td>
                      <td className="p-3.5 font-bold text-amber-700">T{p.table_number}</td>
                      <td className="p-3.5 text-[#0F172A] font-bold">{p.customer_name}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.payment_method === 'UPI'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : p.payment_method === 'CASH'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {p.payment_method}
                        </span>
                        {p.payment_reference && (
                          <span className="block text-[10px] text-[#64748B] font-mono mt-0.5 truncate max-w-[120px]">
                            {p.payment_reference}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 font-semibold">
                        ₹{p.subtotal.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right text-[#64748B]">
                        ₹{p.tax_amount.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-black text-[#10B981] text-sm">
                        ₹{p.final_total.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-[#10B981]" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-[#64748B] font-medium">No payment records found</p>
          </div>
        )}
      </div>

      {/* Reprint Thermal Receipt Modal */}
      {receiptToPrint && (
        <ThermalReceipt
          order={receiptToPrint.order}
          payment={receiptToPrint.payment}
          onClose={() => setReceiptToPrint(null)}
        />
      )}
    </div>
  );
}
