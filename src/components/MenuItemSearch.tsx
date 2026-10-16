'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MenuItem } from '../lib/types';
import { VegBadge } from './StatusBadge';
import { Search, Plus, Minus, X, Flame, Hash } from 'lucide-react';

// ─── Utility: Extract numeric item number from a menu item or item ID ────────
export function getMenuItemNumber(itemOrId: MenuItem | string | null | undefined): number {
  if (!itemOrId) return 0;
  if (typeof itemOrId === 'object') {
    if (itemOrId.item_number && itemOrId.item_number > 0) {
      return itemOrId.item_number;
    }
    return getMenuItemNumber(itemOrId.id);
  }
  const match = itemOrId.match(/^m(\d+)-/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type MenuSearchCartItem = {
  quantity: number;
  specialInstructions: string;
};

export type MenuSearchCart = Record<string, MenuSearchCartItem>;

interface MenuItemSearchProps {
  menuItems: MenuItem[];
  /** Current cart state controlled externally */
  cart: MenuSearchCart;
  /** Called when a cart quantity changes (+1 or -1 from the search results) */
  onUpdateQuantity: (item: MenuItem, delta: number) => void;
  /** Optional handler when an item is selected to prompt quantity */
  onSelectItem?: (item: MenuItem) => void;
  /** Placeholder text for the search box */
  placeholder?: string;
  /** Whether to autofocus the input on mount */
  autoFocus?: boolean;
}

// ─── Search Logic ─────────────────────────────────────────────────────────────
export function searchMenuItems(
  items: MenuItem[],
  query: string
): { exact: MenuItem[]; partial: MenuItem[] } {
  const q = query.trim();
  if (!q) return { exact: [], partial: [] };

  const isNumeric = /^\d+$/.test(q);
  const lowerQ = q.toLowerCase();

  const exact: MenuItem[] = [];
  const partial: MenuItem[] = [];

  for (const item of items) {
    const itemNumber = getMenuItemNumber(item);
    const itemNumberStr = String(itemNumber);
    const nameLower = item.name.toLowerCase();
    const descLower = item.description?.toLowerCase() || '';

    if (isNumeric) {
      if (itemNumberStr === q) {
        exact.push(item);
      } else if (itemNumberStr.startsWith(q)) {
        partial.push(item);
      }
    } else {
      if (nameLower.startsWith(lowerQ) || q === `#${itemNumberStr}`) {
        exact.push(item);
      } else if (nameLower.includes(lowerQ) || descLower.includes(lowerQ)) {
        partial.push(item);
      }
    }
  }

  return { exact, partial };
}

// ─── Sub-component: Single search result row ──────────────────────────────────
function SearchResultRow({
  item,
  quantity,
  isExact,
  onSelectItem,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  quantity: number;
  isExact: boolean;
  onSelectItem?: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const itemNumber = getMenuItemNumber(item.id);
  const isAvailable = item.is_available;

  return (
    <div
      onClick={() => {
        if (isAvailable && onSelectItem) {
          onSelectItem();
        }
      }}
      className={`flex items-center gap-3 px-3 py-2.5 border-b border-[#E2E8F0] last:border-0 transition-colors ${
        onSelectItem && isAvailable ? 'cursor-pointer hover:bg-slate-50' : ''
      } ${
        isExact ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
      } ${!isAvailable ? 'opacity-50' : ''}`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex flex-col items-center justify-center text-[10px] font-black border ${
          isExact
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-slate-100 border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        <Hash className="w-2.5 h-2.5 mb-0.5 opacity-60" />
        <span className="leading-none">{itemNumber}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <VegBadge isVeg={item.is_veg} />
          {isExact && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
              Exact
            </span>
          )}
          <span className="font-bold text-sm text-[#0F172A] leading-tight truncate">
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#64748B] truncate max-w-[160px]">
            {(item.description || '').slice(0, 50)}
            {(item.description?.length || 0) > 50 ? '...' : ''}
          </span>
          {item.spicy_level > 0 && (
            <span className="flex items-center gap-0.5 text-rose-500 shrink-0">
              {Array.from({ length: item.spicy_level }).map((_, i) => (
                <Flame key={i} className="w-2.5 h-2.5 fill-rose-500" />
              ))}
            </span>
          )}
        </div>
      </div>

      <span className="font-black text-[#0F172A] text-sm shrink-0">Rs.{item.price}</span>

      {!isAvailable ? (
        <span className="text-[10px] text-[#EF4444] font-bold shrink-0">Out of Stock</span>
      ) : quantity === 0 ? (
        <button
          onClick={(e) => {
            if (onSelectItem) {
              e.stopPropagation();
              onSelectItem();
            } else {
              onAdd();
            }
          }}
          className="shrink-0 w-8 h-8 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          aria-label={`Add ${item.name}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      ) : (
        <div
          className="shrink-0 flex items-center gap-1.5 bg-slate-100 px-1.5 py-1 rounded-xl border border-[#E2E8F0]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onRemove}
            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-[#0F172A] transition-colors cursor-pointer shadow-xs"
            aria-label={`Remove one ${item.name}`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (onSelectItem) onSelectItem();
            }}
            className={`font-black text-[#0F172A] text-sm px-1 ${onSelectItem ? 'hover:underline cursor-pointer' : ''}`}
            title={onSelectItem ? 'Click to change quantity' : undefined}
          >
            {quantity}
          </button>
          <button
            onClick={() => {
              if (onSelectItem) {
                onSelectItem();
              } else {
                onAdd();
              }
            }}
            className="w-6 h-6 rounded-lg bg-[#10B981] hover:bg-[#059669] flex items-center justify-center text-white font-bold transition-colors cursor-pointer shadow-xs"
            aria-label={`Add one more ${item.name}`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MenuItemSearch({
  menuItems,
  cart,
  onUpdateQuantity,
  onSelectItem,
  placeholder = 'Search by item # or name...',
  autoFocus = false,
}: MenuItemSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { exact, partial } = searchMenuItems(menuItems, query);
  const allMatches = [...exact, ...partial];
  const hasResults = allMatches.length > 0;
  const showDropdown = isFocused && query.trim().length > 0;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (allMatches.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % allMatches.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (allMatches.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + allMatches.length) % allMatches.length);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allMatches.length > 0 && allMatches[highlightedIndex]) {
        const item = allMatches[highlightedIndex];
        if (onSelectItem) {
          onSelectItem(item);
        } else {
          onUpdateQuantity(item, 1);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center gap-2 rounded-xl border transition-colors ${
          isFocused
            ? 'border-[#10B981] bg-white ring-1 ring-[#10B981]/30 shadow-xs'
            : 'border-[#E2E8F0] bg-white hover:border-slate-300'
        }`}
      >
        <Search className="w-4 h-4 text-[#64748B] ml-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none"
          aria-label="Menu item search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="mr-2 shrink-0 text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <span className="mr-3 text-[10px] text-[#64748B] hidden sm:block shrink-0">
          # or name
        </span>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Menu search results"
        >
          {!hasResults && (
            <div className="py-8 text-center space-y-1">
              <Search className="w-5 h-5 text-[#64748B] mx-auto" />
              <p className="text-xs text-[#64748B]">No items match &quot;{query}&quot;</p>
              <p className="text-[10px] text-slate-400">Try a different item number or name</p>
            </div>
          )}

          {exact.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Exact Match{exact.length > 1 ? 'es' : ''} ({exact.length})
                </span>
              </div>
              {exact.map((item) => (
                <SearchResultRow
                  key={item.id}
                  item={item}
                  quantity={cart[item.id]?.quantity || 0}
                  isExact={true}
                  onSelectItem={onSelectItem ? () => onSelectItem(item) : undefined}
                  onAdd={() => onUpdateQuantity(item, 1)}
                  onRemove={() => onUpdateQuantity(item, -1)}
                />
              ))}
            </div>
          )}

          {partial.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                  Partial Matches ({partial.length})
                </span>
              </div>
              {partial.map((item) => (
                <SearchResultRow
                  key={item.id}
                  item={item}
                  quantity={cart[item.id]?.quantity || 0}
                  isExact={false}
                  onSelectItem={onSelectItem ? () => onSelectItem(item) : undefined}
                  onAdd={() => onUpdateQuantity(item, 1)}
                  onRemove={() => onUpdateQuantity(item, -1)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
