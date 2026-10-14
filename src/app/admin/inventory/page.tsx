'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { InventoryCategory, InventoryItem, InventoryMovementType } from '../../../lib/types';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Check,
  Clock3,
  Edit3,
  PackagePlus,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

const formatQuantity = (quantity: number) => Number.isInteger(quantity) ? `${quantity}` : quantity.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

export default function AdminInventoryPage() {
  const {
    state,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateInventoryThreshold,
    recordInventoryMovement,
  } = useRestaurant();
  const [category, setCategory] = useState<InventoryCategory>('GROCERY');
  const [search, setSearch] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [newName, setNewName] = useState('');
  const [newMenuItemId, setNewMenuItemId] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [openingQuantity, setOpeningQuantity] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [formError, setFormError] = useState('');
  const [movementItem, setMovementItem] = useState<{ item: InventoryItem; type: InventoryMovementType } | null>(null);
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [movementError, setMovementError] = useState('');
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState('');

  const categoryItems = useMemo(() => state.inventoryItems
    .filter((item) => item.isActive !== false && item.category === category), [state.inventoryItems, category]);
  const visibleItems = useMemo(() => categoryItems
    .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name)), [categoryItems, search]);
  const categoryMovements = useMemo(() => state.inventoryMovements.filter((movement) => movement.category === category), [state.inventoryMovements, category]);
  const lowStockItems = categoryItems.filter((item) => item.quantity <= item.lowStockThreshold);
  const stockInCount = categoryMovements.filter((movement) => movement.type === 'IN').length;
  const stockOutCount = categoryMovements.filter((movement) => movement.type === 'OUT').length;

  const openAddItem = () => {
    setEditingItem(null);
    setNewMenuItemId('');
    setNewName('');
    setNewUnit(category === 'FOOD' ? 'portions' : 'kg');
    setOpeningQuantity('');
    setNewThreshold(category === 'FOOD' ? '5' : '2');
    setFormError('');
    setShowAddItem(true);
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewUnit(item.unit);
    setOpeningQuantity('');
    setNewThreshold(String(item.lowStockThreshold));
    setFormError('');
    setShowAddItem(true);
  };

  const handleAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = editingItem
      ? updateInventoryItem(editingItem.id, {
          name: newName,
          unit: newUnit,
          lowStockThreshold: Number(newThreshold || 0),
        })
      : addInventoryItem({
          name: newName,
          category,
          menuItemId: category === 'FOOD' ? newMenuItemId || undefined : undefined,
          unit: newUnit,
          openingQuantity: Number(openingQuantity || 0),
          lowStockThreshold: Number(newThreshold || 0),
        });
    if (!result.success) {
      setFormError(result.error || 'Unable to add this item.');
      return;
    }
    setShowAddItem(false);
  };

  const openMovement = (item: InventoryItem, type: InventoryMovementType) => {
    setMovementItem({ item, type });
    setMovementQuantity('');
    setMovementNote('');
    setMovementError('');
  };

  const handleMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movementItem) return;
    const result = recordInventoryMovement(
      movementItem.item.id,
      movementItem.type,
      Number(movementQuantity),
      movementNote,
    );
    if (!result.success) {
      setMovementError(result.error || 'Unable to update stock.');
      return;
    }
    setMovementItem(null);
  };

  const saveThreshold = (itemId: string) => {
    if (thresholdDraft.trim() === '') return;
    updateInventoryThreshold(itemId, Number(thresholdDraft));
    setEditingThresholdId(null);
  };

  const confirmDeleteItem = () => {
    if (!deletingItem) return;
    deleteInventoryItem(deletingItem.id);
    setDeletingItem(null);
  };

  const recentMovements = categoryMovements.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Admin workspace</p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Inventory Management</h1>
            <p className="mt-1 text-sm text-slate-400">{category === 'FOOD' ? 'Menu-linked kitchen stock updates when orders are marked served.' : 'Track grocery receipts, usage, and low-stock levels.'}</p>
          </div>
          <button onClick={openAddItem} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-400">
            <Plus className="h-4 w-4" /> Add {category === 'FOOD' ? 'food item' : 'grocery item'}
          </button>
        </header>

        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5">
          <button onClick={() => setCategory('GROCERY')} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${category === 'GROCERY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Boxes className="h-4 w-4" /> Grocery stock
          </button>
          <button onClick={() => setCategory('FOOD')} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${category === 'FOOD' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Utensils className="h-4 w-4" /> Kitchen food stock
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <section className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4" aria-live="polite">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-amber-200">{lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} running low</h2>
              <p className="mt-1 text-xs leading-5 text-amber-100/75">
                {lowStockItems.map((item) => `${item.name} (${formatQuantity(item.quantity)} ${item.unit} left)`).join(' · ')}
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Items tracked</p>
            <p className="mt-2 text-2xl font-black text-white">{visibleItems.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock in entries</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{stockInCount} <span className="text-sm font-semibold text-slate-400">receipts logged</span></p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock out entries</p>
            <p className="mt-2 text-2xl font-black text-orange-300">{stockOutCount} <span className="text-sm font-semibold text-slate-400">issues logged</span></p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">{category === 'FOOD' ? 'Kitchen food stock ledger' : 'Grocery stock ledger'}</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">{visibleItems.length} items</span>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inventory..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10" />
            </label>
          </div>

          {visibleItems.length === 0 ? (
            <div className="p-12 text-center">
              <Boxes className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-300">No items found</p>
              <p className="mt-1 text-xs text-slate-500">Add an item to start tracking {category === 'FOOD' ? 'prepared food' : 'grocery stock'}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-950/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">In</th>
                    <th className="px-4 py-3 text-right">Out</th>
                    <th className="px-4 py-3 text-right">Alert below</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {visibleItems.map((item) => {
                    const movements = categoryMovements.filter((movement) => movement.itemId === item.id);
                    const itemIn = movements.filter((movement) => movement.type === 'IN').reduce((sum, movement) => sum + movement.quantity, 0);
                    const itemOut = movements.filter((movement) => movement.type === 'OUT').reduce((sum, movement) => sum + movement.quantity, 0);
                    const isLow = item.quantity <= item.lowStockThreshold;
                    return (
                      <tr key={item.id} className="transition hover:bg-white/[0.025]">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Unit: {item.unit}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-white">{formatQuantity(item.quantity)} <span className="text-xs font-medium text-slate-400">{item.unit}</span></td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-300">+{formatQuantity(itemIn)}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-orange-300">−{formatQuantity(itemOut)}</td>
                        <td className="px-4 py-3.5 text-right">
                          {editingThresholdId === item.id ? (
                            <span className="inline-flex items-center justify-end gap-1">
                              <input type="number" min="0" step="0.1" value={thresholdDraft} onChange={(event) => setThresholdDraft(event.target.value)} className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-amber-500" />
                              <button onClick={() => saveThreshold(item.id)} aria-label="Save low stock level" className="rounded-md p-1 text-emerald-300 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>
                              <button onClick={() => setEditingThresholdId(null)} aria-label="Cancel editing" className="rounded-md p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
                            </span>
                          ) : (
                            <button onClick={() => { setEditingThresholdId(item.id); setThresholdDraft(String(item.lowStockThreshold)); }} className="text-xs font-medium text-slate-300 underline decoration-slate-700 underline-offset-4 hover:text-amber-300">{formatQuantity(item.lowStockThreshold)} {item.unit}</button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isLow ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300'}`}>
                            {isLow ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}{isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => openEditItem(item)} title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-500/40 hover:text-amber-200"><Edit3 className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Edit</span></button>
                            <button onClick={() => openMovement(item, 'IN')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"><ArrowDownToLine className="h-3.5 w-3.5" /> Stock in</button>
                            <button onClick={() => openMovement(item, 'OUT')} disabled={item.quantity <= 0} className="inline-flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1.5 text-xs font-bold text-orange-200 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUpFromLine className="h-3.5 w-3.5" /> Stock out</button>
                            <button onClick={() => setDeletingItem(item)} title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} className="inline-flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-2 py-1.5 text-rose-300 transition hover:bg-rose-500/15"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
            <Clock3 className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-white">Recent stock movements</h2>
          </div>
          {recentMovements.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">No stock movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${movement.type === 'IN' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-orange-500/10 text-orange-300'}`}>
                      {movement.type === 'IN' ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{movement.itemName}</p>
                      <p className="text-[11px] text-slate-500">{movement.note || (movement.type === 'IN' ? 'Stock received' : 'Stock used')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pl-11 sm:justify-end sm:pl-0">
                    <span className={`text-xs font-black ${movement.type === 'IN' ? 'text-emerald-300' : 'text-orange-300'}`}>{movement.type === 'IN' ? '+' : '−'}{formatQuantity(movement.quantity)} {movement.unit}</span>
                    <time className="text-[11px] text-slate-500">{new Date(movement.createdAt).toLocaleString()}</time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddItem(false); }}>
          <form onSubmit={handleAddItem} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-black text-white">{editingItem ? 'Edit inventory item' : `Add ${category === 'FOOD' ? 'food item' : 'grocery item'}`}</h2><p className="mt-1 text-xs text-slate-400">{editingItem ? 'Update the item details and low-stock alert level.' : 'Set the opening quantity and alert level.'}</p></div>
              <button type="button" onClick={() => setShowAddItem(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Item name<input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" placeholder={category === 'FOOD' ? 'e.g. Masala dosa' : 'e.g. Basmati rice'} /></label>
            {!editingItem && category === 'FOOD' && (
              <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Connect to menu dish (optional)
                <select value={newMenuItemId} onChange={(event) => {
                  const menuItemId = event.target.value;
                  setNewMenuItemId(menuItemId);
                  const menuItem = state.menuItems.find((item) => item.id === menuItemId);
                  if (menuItem) setNewName(menuItem.name);
                }} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500">
                  <option value="">Manual food item</option>
                  {state.menuItems.filter((menuItem) => !state.inventoryItems.some((item) => item.isActive !== false && item.menuItemId === menuItem.id)).map((menuItem) => <option key={menuItem.id} value={menuItem.id}>{menuItem.name}</option>)}
                </select>
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Unit<input value={newUnit} onChange={(event) => setNewUnit(event.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" placeholder="kg, L, portions" /></label>
              {!editingItem && <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Opening stock<input type="number" min="0" step="0.1" value={openingQuantity} onChange={(event) => setOpeningQuantity(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" placeholder="0" /></label>}
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Notify when stock reaches<input type="number" min="0" step="0.1" value={newThreshold} onChange={(event) => setNewThreshold(event.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" /></label>
            {formError && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{formError}</p>}
            <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => setShowAddItem(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">Cancel</button><button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400">{editingItem ? 'Save changes' : 'Save item'}</button></div>
          </form>
        </div>
      )}

      {movementItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setMovementItem(null); }}>
          <form onSubmit={handleMovement} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wider text-amber-400">{movementItem.type === 'IN' ? 'Receive stock' : 'Record stock out'}</p><h2 className="mt-1 text-lg font-black text-white">{movementItem.item.name}</h2><p className="mt-1 text-xs text-slate-400">Current balance: {formatQuantity(movementItem.item.quantity)} {movementItem.item.unit}</p></div>
              <button type="button" onClick={() => setMovementItem(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Quantity ({movementItem.item.unit})<input autoFocus type="number" min="0.01" step="0.01" max={movementItem.type === 'OUT' ? movementItem.item.quantity : undefined} value={movementQuantity} onChange={(event) => setMovementQuantity(event.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" placeholder="Enter quantity" /></label>
            <label className="block space-y-1.5 text-xs font-semibold text-slate-300">Note (optional)<input value={movementNote} onChange={(event) => setMovementNote(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" placeholder={movementItem.type === 'IN' ? 'Supplier or purchase note' : 'Used, sold, or wastage'} /></label>
            {movementError && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{movementError}</p>}
            <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => setMovementItem(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">Cancel</button><button type="submit" className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${movementItem.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'}`}>{movementItem.type === 'IN' ? 'Record stock in' : 'Record stock out'}</button></div>
          </form>
        </div>
      )}

      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletingItem(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-inventory-title" className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300"><Trash2 className="h-5 w-5" /></span>
              <div><h2 id="delete-inventory-title" className="text-base font-black text-white">Delete {deletingItem.name}?</h2><p className="mt-1 text-xs leading-5 text-slate-400">This removes the item from active inventory. Its previous stock movement history will be kept.</p></div>
            </div>
            <div className="flex justify-end gap-2"><button onClick={() => setDeletingItem(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">Cancel</button><button onClick={confirmDeleteItem} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500">Delete item</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
