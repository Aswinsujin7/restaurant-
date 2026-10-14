'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRestaurant } from '../../../context/RestaurantContext';
import { MenuItem, PricingSection, RestaurantTable } from '../../../lib/types';
import { VegBadge } from '../../../components/StatusBadge';
import { getMenuItemNumber } from '../../../components/MenuItemSearch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FolderPlus,
  Flame,
  X,
  MenuSquare,
  Boxes,
  Snowflake,
  Sun,
  AlertCircle,
  LayoutGrid,
  ShieldAlert,
} from 'lucide-react';

export default function AdminMenuPage() {
  const {
    state,
    addMenuItem,
    updateMenuItem,
    updateTableSection,
    toggleItemAvailability,
    deleteMenuItem,
    addCategory,
  } = useRestaurant();

  // Primary Tab: Menu vs Tables Setup
  const [activeTab, setActiveTab] = useState<'MENU' | 'TABLES'>('MENU');

  // Filters - default to first category (e.g. Chinese)
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-chinese');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'MISSING_PRICE'>('ALL');

  // Add / Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State for Menu Item
  const [itemNumber, setItemNumber] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceNonAc, setPriceNonAc] = useState('');
  const [priceAc, setPriceAc] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [spicyLevel, setSpicyLevel] = useState(1);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Table Section Edit State
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableSectionName, setTableSectionName] = useState('');
  const [tablePricingSection, setTablePricingSection] = useState<PricingSection>('NON_AC');
  const [tableActionMessage, setTableActionMessage] = useState<string | null>(null);
  const [tableActionError, setTableActionError] = useState<string | null>(null);

  const activeCategoryId =
    selectedCategory && state.categories.some((c) => c.id === selectedCategory)
      ? selectedCategory
      : state.categories[0]?.id || 'cat-chinese';

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemNumber('');
    setName('');
    setCategoryId(activeCategoryId);
    setPriceNonAc('');
    setPriceAc('');
    setIsVeg(true);
    setSpicyLevel(1);
    setDescription('');
    setIsActive(true);
    setIsAvailable(true);
    setFormError(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemNumber(item.item_number !== undefined ? String(item.item_number) : String(getMenuItemNumber(item)));
    setName(item.name);
    setCategoryId(item.category_id);
    const nonAc = item.price_non_ac !== undefined ? item.price_non_ac : item.price;
    const ac = item.price_ac !== undefined ? item.price_ac : (item.ac_price !== undefined ? item.ac_price : nonAc);
    setPriceNonAc(nonAc.toString());
    setPriceAc(ac.toString());
    setIsVeg(item.is_veg);
    setSpicyLevel(item.spicy_level);
    setDescription(item.description || '');
    setIsActive(item.is_active ?? true);
    setIsAvailable(item.is_available ?? true);
    setFormError(null);
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Item name is required');
      return;
    }

    const parsedNonAc = parseFloat(priceNonAc);
    if (isNaN(parsedNonAc) || parsedNonAc < 0) {
      setFormError('Valid Non-AC price (₹ >= 0) is required');
      return;
    }

    // AC price: if blank, can default to Non-AC price (supports same price in both sections)
    let parsedAc = parsedNonAc;
    if (priceAc.trim()) {
      parsedAc = parseFloat(priceAc);
      if (isNaN(parsedAc) || parsedAc < 0) {
        setFormError('Valid AC price (₹ >= 0) is required');
        return;
      }
    }

    const parsedItemNum = itemNumber.trim() ? parseInt(itemNumber.trim(), 10) : undefined;
    if (parsedItemNum !== undefined && (isNaN(parsedItemNum) || parsedItemNum <= 0)) {
      setFormError('Dish number must be a valid positive integer');
      return;
    }

    if (editingItem) {
      const res = updateMenuItem({
        ...editingItem,
        item_number: parsedItemNum,
        name: name.trim(),
        category_id: categoryId,
        price: parsedNonAc,
        price_non_ac: parsedNonAc,
        price_ac: parsedAc,
        ac_price: parsedAc,
        non_ac_price: parsedNonAc,
        is_veg: isVeg,
        spicy_level: spicyLevel,
        description: description.trim(),
        is_available: isAvailable,
        is_active: isActive,
      }, 'admin');

      if (res && !res.success) {
        setFormError(res.error || 'Failed to update item');
        return;
      }
    } else {
      const res = addMenuItem({
        item_number: parsedItemNum,
        name: name.trim(),
        category_id: categoryId || activeCategoryId,
        price: parsedNonAc,
        price_non_ac: parsedNonAc,
        price_ac: parsedAc,
        ac_price: parsedAc,
        non_ac_price: parsedNonAc,
        is_veg: isVeg,
        spicy_level: spicyLevel,
        description: description.trim(),
        is_available: isAvailable,
        is_active: isActive,
      }, 'admin');

      if (res && !res.success) {
        setFormError(res.error || 'Failed to add item');
        return;
      }
    }

    setShowItemModal(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  // Table section assignment handler
  const handleOpenEditTable = (table: RestaurantTable) => {
    setTableActionError(null);
    setTableActionMessage(null);
    if (table.status !== 'FREE' || table.active_order_id) {
      setTableActionError(
        `Cannot reassign Table ${table.table_number} while it has an active order (${table.current_customer_name || 'Occupied'}). Please complete or settle the bill first.`
      );
      return;
    }
    setEditingTable(table);
    const isAc = table.pricing_section
      ? table.pricing_section === 'AC'
      : (table.is_ac ?? (!table.section.toLowerCase().includes('non') && table.section.toLowerCase().includes('ac')));
    setTablePricingSection(isAc ? 'AC' : 'NON_AC');
  };

  const handleSaveTableSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    setTableActionError(null);
    setTableActionMessage(null);

    const res = updateTableSection(
      editingTable.id,
      tableSectionName.trim() || editingTable.section,
      tablePricingSection,
      'admin'
    );

    if (!res.success) {
      setTableActionError(res.error || 'Failed to update table section');
      return;
    }

    setTableActionMessage(`Table ${editingTable.table_number} reassigned to ${tablePricingSection} section (${tableSectionName.trim()}) successfully.`);
    setEditingTable(null);
    setTimeout(() => setTableActionMessage(null), 4000);
  };

  // Filtered menu items
  const filteredMenuItems = state.menuItems.filter((item) => {
    // Pricing filter: missing price check
    if (pricingFilter === 'MISSING_PRICE') {
      const hasMissingPrice =
        item.price_ac === undefined ||
        item.price_ac === null ||
        isNaN(item.price_ac) ||
        item.price_non_ac === undefined ||
        item.price_non_ac === null ||
        isNaN(item.price_non_ac);
      if (!hasMissingPrice) return false;
    } else {
      // Category filter applies when not viewing all missing prices
      if (activeCategoryId && item.category_id !== activeCategoryId) return false;
    }

    if (availabilityFilter === 'AVAILABLE' && !item.is_available) return false;
    if (availabilityFilter === 'UNAVAILABLE' && item.is_available) return false;

    if (searchQuery) {
      const rawQ = searchQuery.trim();
      const q = rawQ.toLowerCase();
      const cleanNum = q.startsWith('#') ? q.slice(1).trim() : q;
      const isNumeric = /^\d+$/.test(cleanNum);
      const itemNum = String(item.item_number ?? getMenuItemNumber(item));

      const numMatch = isNumeric && (itemNum === cleanNum || itemNum.startsWith(cleanNum));
      const hashMatch = q.startsWith('#') && itemNum === cleanNum;
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!numMatch && !hashMatch && !matchName && !matchDesc) return false;
    }
    return true;
  });

  const missingPricingCount = state.menuItems.filter(
    (m) =>
      m.price_ac === undefined ||
      m.price_ac === null ||
      isNaN(m.price_ac) ||
      m.price_non_ac === undefined ||
      m.price_non_ac === null ||
      isNaN(m.price_non_ac)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <MenuSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Menu & Dining Setup</h1>
              <p className="text-xs text-slate-400">
                Configure AC/Non-AC product prices, restaurant dining sections, categories, and stock availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:bg-slate-800 hover:text-white"
            >
              <Boxes className="h-4 w-4 text-amber-400" />
              <span>Inventory</span>
            </Link>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>+ Category</span>
            </button>
            <button
              onClick={openAddItemModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Top Tab Switcher: Menu vs Tables Configuration */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('MENU')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MENU'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MenuSquare className="w-4 h-4" />
            <span>Product Pricing & Menu ({state.menuItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TABLES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TABLES'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Restaurant Sections & Tables ({state.tables.length})</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: MENU PRODUCTS & PRICING
        ========================================================================= */}
        {activeTab === 'MENU' && (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <button
                  onClick={() => {
                    setPricingFilter('ALL');
                    setSelectedCategory('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'ALL' && pricingFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Categories
                </button>
                {state.categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id && pricingFilter === 'ALL';
                  const count = state.menuItems.filter((m) => m.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setPricingFilter('ALL');
                        setSelectedCategory(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Price Filter & Stock Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPricingFilter(pricingFilter === 'MISSING_PRICE' ? 'ALL' : 'MISSING_PRICE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    pricingFilter === 'MISSING_PRICE'
                      ? 'bg-rose-950 text-rose-300 border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Filter products that are missing either AC or Non-AC prices"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Missing AC/Non-AC Price</span>
                  {missingPricingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {missingPricingCount}
                    </span>
                  )}
                </button>

                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Stock</option>
                  <option value="AVAILABLE">In Stock Only</option>
                  <option value="UNAVAILABLE">Out of Stock</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dish # or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 w-12 text-center">Type</th>
                      <th className="p-3.5">Dish Details</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Non-AC Price</th>
                      <th className="p-3.5 text-right">AC Price</th>
                      <th className="p-3.5 text-center">Spice</th>
                      <th className="p-3.5 text-center">Availability</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredMenuItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500 text-xs">
                          No menu items found for this selection.
                        </td>
                      </tr>
                    ) : (
                      filteredMenuItems.map((item) => {
                        const category = state.categories.find((c) => c.id === item.category_id);
                        const nonAcPrice = item.price_non_ac ?? item.non_ac_price ?? item.price;
                        const acPrice = item.price_ac ?? item.ac_price ?? nonAcPrice;

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 text-center">
                              <VegBadge isVeg={item.is_veg} />
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-slate-950 border border-slate-700/80 font-mono text-[10px] font-black text-amber-400">
                                  #{item.item_number ?? getMenuItemNumber(item)}
                                </span>
                                <span className="font-bold text-white text-sm">{item.name}</span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-300 font-medium">
                              {category?.name || 'General'}
                            </td>
                            <td className="p-3.5 text-right">
                              <span className="font-black text-amber-400 text-sm">
                                ₹{nonAcPrice.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-slate-500">Non-AC</span>
                            </td>
                            <td className="p-3.5 text-right">
                              <span className="font-black text-cyan-400 text-sm">
                                ₹{acPrice.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-cyan-400/70">AC Dining</span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-0.5 text-rose-400">
                                {item.spicy_level > 0 ? (
                                  Array.from({ length: item.spicy_level }).map((_, i) => (
                                    <Flame key={i} className="w-3.5 h-3.5 fill-rose-500" />
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-500">Mild</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => toggleItemAvailability(item.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  item.is_available
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                }`}
                              >
                                {item.is_available ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>In Stock</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    <span>Out of Stock</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  (item.is_active ?? true)
                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}
                              >
                                {(item.is_active ?? true) ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  title="Edit Item & Pricing"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteMenuItem(item.id, 'admin')}
                                  title="Delete Item"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: RESTAURANT SECTIONS & TABLE CONFIGURATION
        ========================================================================= */}
        {activeTab === 'TABLES' && (
          <div className="space-y-4 animate-in fade-in">
            {tableActionMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{tableActionMessage}</span>
              </div>
            )}
            {tableActionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{tableActionError}</span>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Table Section Assignment & Pricing Mode</h3>
                  <p className="text-xs text-slate-400">
                    Assign each table to AC or Non-AC. AC tables automatically bill at AC prices; Non-AC tables bill at Non-AC prices.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-white">Active Protection:</span> Occupied tables cannot be reassigned until settled.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.tables.map((table) => {
                  const isAc = table.pricing_section
                    ? table.pricing_section === 'AC'
                    : (table.is_ac ?? (!table.section.toLowerCase().includes('non') && table.section.toLowerCase().includes('ac')));
                  const isFree = table.status === 'FREE';

                  return (
                    <div
                      key={table.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isFree
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/90 border-amber-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                            isAc ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            T{table.table_number}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{table.table_label}</h4>
                            <span className="text-[11px] text-slate-400">Capacity: {table.capacity} guests</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                          isAc
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {isAc ? <Snowflake className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
                          {isAc ? 'AC PRICING' : 'NON-AC PRICING'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Section:</span>
                          <span className="font-semibold text-white">{table.section}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`font-bold ${
                            isFree ? 'text-emerald-400' : table.status === 'BILL_REQUESTED' ? 'text-purple-400' : 'text-amber-400'
                          }`}>
                            {table.status} {table.current_customer_name ? `(${table.current_customer_name})` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditTable(table)}
                        disabled={!isFree}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isFree
                            ? 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                            : 'bg-slate-900/50 text-slate-500 border border-slate-800/50 cursor-not-allowed'
                        }`}
                        title={!isFree ? 'Occupied table cannot be reassigned while order is active' : 'Configure table section and AC pricing mode'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{isFree ? 'Configure Section & AC' : 'Locked (Order Active)'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT PRODUCT & DUAL PRICING
      ========================================================================= */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Product & Pricing' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-300 mb-1">Dish # (Code)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-amber-400 font-mono font-bold text-xs">#</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Auto"
                      value={itemNumber}
                      onChange={(e) => setItemNumber(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">For fast billing</p>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicken Biryani / Malabar Parotta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DUAL PRICING CONTROLS */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div>
                  <label className="block font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Non-AC Price (₹) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 200.00"
                    value={priceNonAc}
                    onChange={(e) => setPriceNonAc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm focus:outline-none focus:border-amber-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Standard & Non-AC tables</p>
                </div>

                <div>
                  <label className="block font-bold text-cyan-400 mb-1 flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AC Price (₹) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 220.00"
                    value={priceAc}
                    onChange={(e) => setPriceAc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-cyan-800/80 rounded-xl text-cyan-300 font-black text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">AC Hall & AC section tables</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dietary Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVeg(true)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isVeg
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <VegBadge isVeg={true} />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVeg(false)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        !isVeg
                          ? 'bg-rose-950 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <VegBadge isVeg={false} />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Spice Level</label>
                  <select
                    value={spicyLevel}
                    onChange={(e) => setSpicyLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="0">0 - None / Sweet</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - Spicy (Chettinad)</option>
                  </select>
                </div>
              </div>

              {/* Status & Availability Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stock Availability</label>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`w-full py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      isAvailable
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-600 text-rose-300'
                    }`}
                  >
                    {isAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catalog Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-blue-950/60 border-blue-600 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{isActive ? 'Active (Visible)' : 'Inactive (Hidden)'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients and culinary notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  {editingItem ? 'Save Pricing & Details' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT TABLE SECTION & AC PRICING ASSIGNMENT
      ========================================================================= */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  T{editingTable.table_number}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Configure Table {editingTable.table_number}</h3>
                  <p className="text-[11px] text-slate-400">Assign Section & AC / Non-AC Pricing</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTableSection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Section Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC Family Hall / Main Dining / Garden Terrace"
                  value={tableSectionName}
                  onChange={(e) => setTableSectionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pricing Section Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTablePricingSection('NON_AC')}
                    className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      tablePricingSection === 'NON_AC'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Non-AC Pricing</span>
                    <span className="text-[10px] text-slate-400 font-normal">Normal dish rates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTablePricingSection('AC')}
                    className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      tablePricingSection === 'AC'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Snowflake className="w-4 h-4 text-cyan-400" />
                    <span>AC Pricing</span>
                    <span className="text-[10px] text-slate-400 font-normal">AC section rates</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                <span className="text-white font-bold block mb-0.5">Automated Waiter & Cashier Sync</span>
                When a waiter seats guests at Table {editingTable.table_number}, the system will automatically charge the{' '}
                <strong className={tablePricingSection === 'AC' ? 'text-cyan-400' : 'text-amber-400'}>
                  {tablePricingSection}
                </strong>{' '}
                rates. Waiters cannot accidentally choose conflicting pricing modes.
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  Save Section Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD CATEGORY
      ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Add New Menu Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood Delights"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
