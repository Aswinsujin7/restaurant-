'use client';

import React, { useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { VegBadge } from '../../../components/StatusBadge';
import { MenuItem, MenuCategory } from '../../../lib/types';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Flame,
  FolderPlus,
  MenuSquare,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminMenuPage() {
  const {
    state,
    addMenuItem,
    updateMenuItem,
    toggleItemAvailability,
    deleteMenuItem,
    addCategory,
  } = useRestaurant();

  // Filters - default to first category (e.g. Chinese), no "All Products"
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-chinese');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');

  // Add / Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [spicyLevel, setSpicyLevel] = useState(1);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Add Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const activeCategoryId =
    selectedCategory && state.categories.some((c) => c.id === selectedCategory)
      ? selectedCategory
      : state.categories[0]?.id || 'cat-chinese';

  const openAddItemModal = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(activeCategoryId);
    setPrice('');
    setIsVeg(true);
    setSpicyLevel(1);
    setDescription('');
    setFormError(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.category_id);
    setPrice(item.price.toString());
    setIsVeg(item.is_veg);
    setSpicyLevel(item.spicy_level);
    setDescription(item.description || '');
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
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Valid price is required');
      return;
    }

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        category_id: categoryId,
        price: parsedPrice,
        is_veg: isVeg,
        spicy_level: spicyLevel,
        description: description.trim(),
      });
    } else {
      addMenuItem({
        name: name.trim(),
        category_id: categoryId || activeCategoryId,
        price: parsedPrice,
        is_veg: isVeg,
        spicy_level: spicyLevel,
        description: description.trim(),
        is_available: true,
      });
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

  // Filtered Items (strictly by selected cuisine)
  const filteredItems = state.menuItems.filter((item) => {
    if (activeCategoryId && item.category_id !== activeCategoryId) return false;
    if (availabilityFilter === 'AVAILABLE' && !item.is_available) return false;
    if (availabilityFilter === 'UNAVAILABLE' && item.is_available) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

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
              <h1 className="text-2xl font-black text-white">Menu Management</h1>
              <p className="text-xs text-slate-400">
                Configure food items, dynamic pricing, categories, and stock availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>+ Category</span>
            </button>
            <button
              onClick={openAddItemModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          {/* Categories Pills - specific cuisines only, no "All Categories" */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {state.categories.map((cat) => {
              const isSelected = activeCategoryId === cat.id;
              const count = state.menuItems.filter((m) => m.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 font-black ring-2 ring-amber-400/40'
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

          {/* Search & Stock Filter */}
          <div className="flex items-center gap-2">
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
                placeholder="Search dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Menu Items Table / Grid */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Item Name & Description</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Price</th>
                  <th className="p-3.5 text-center">Spiciness</th>
                  <th className="p-3.5 text-center">Stock Availability</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => {
                  const category = state.categories.find((c) => c.id === item.category_id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !item.is_available ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <VegBadge isVeg={item.is_veg} />
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {category?.name || 'General'}
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-400 text-sm">
                        ₹{item.price.toFixed(2)}
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
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditItemModal(item)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT MENU ITEM
      ========================================================================= */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Item Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chettinad Pepper Mutton"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category:</label>
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

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="250.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dietary Type:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVeg(true)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
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
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 ${
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
                  <label className="block font-semibold text-slate-300 mb-1">Spice Level:</label>
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

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description:</label>
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
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
