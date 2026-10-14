'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../lib/types';
import { getMenuItemNumber } from './MenuItemSearch';
import { VegBadge } from './StatusBadge';
import { X, Plus, Minus, CheckCircle2, ShoppingBag } from 'lucide-react';

export interface QuantityConfirmModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  unitPrice: number;
  priceModeLabel?: string;
  currentCartQty?: number;
  onConfirm: (quantity: number, mode?: 'ADD' | 'SET') => void;
  onCancel: () => void;
}

export function QuantityConfirmModal({
  isOpen,
  item,
  unitPrice,
  priceModeLabel,
  currentCartQty = 0,
  onConfirm,
  onCancel,
}: QuantityConfirmModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [updateMode, setUpdateMode] = useState<'ADD' | 'SET'>('ADD');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset to default 1 whenever opened or item changes
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setQuantityInput('1');
      setUpdateMode('ADD');
      // Autofocus input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, item]);

  // Handle ESC and Enter shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, quantity, updateMode]);

  if (!isOpen || !item) return null;

  const handleInputChange = (rawVal: string) => {
    setQuantityInput(rawVal);
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setQuantity(Math.floor(parsed));
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(quantityInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
      setQuantityInput('1');
    } else {
      const sanitized = Math.floor(parsed);
      setQuantity(sanitized);
      setQuantityInput(String(sanitized));
    }
  };

  const increment = (delta: number = 1) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    setQuantityInput(String(next));
  };

  const decrement = () => {
    if (quantity > 1) {
      const next = quantity - 1;
      setQuantity(next);
      setQuantityInput(String(next));
    }
  };

  const handleConfirm = () => {
    const finalQty = Math.max(1, quantity);
    onConfirm(finalQty, currentCartQty > 0 ? updateMode : 'ADD');
  };

  const itemNumber = getMenuItemNumber(item);
  const effectiveQty =
    currentCartQty > 0 && updateMode === 'ADD'
      ? currentCartQty + quantity
      : quantity;
  const lineTotal = unitPrice * quantity;
  const combinedTotal = unitPrice * effectiveQty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Select Quantity</h3>
              <p className="text-[11px] text-slate-400">Specify quantity to add to order</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Item Info Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-300">
              #{itemNumber}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <VegBadge isVeg={item.is_veg} />
                <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
              </div>
              {item.description && (
                <p className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">
                  {item.description}
                </p>
              )}
              {priceModeLabel && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {priceModeLabel}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block">Unit Price</span>
            <span className="text-base font-black text-amber-400">₹{unitPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Existing Cart Notice (if item already in cart) */}
        {currentCartQty > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-semibold">
                Already in order: <strong>{currentCartQty}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                New Total: <strong className="text-white">{effectiveQty}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setUpdateMode('ADD')}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  updateMode === 'ADD'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                + Add {quantity} to cart
              </button>
              <button
                type="button"
                onClick={() => setUpdateMode('SET')}
                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  updateMode === 'SET'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}
              >
                Set total to {quantity}
              </button>
            </div>
          </div>
        )}

        {/* Quantity Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block text-center">
            {currentCartQty > 0 && updateMode === 'ADD'
              ? 'Quantity to Add'
              : 'Item Quantity'}
          </label>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= 1}
              className="w-12 h-12 rounded-2xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-slate-700 flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="number"
              min="1"
              step="1"
              value={quantityInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              className="w-24 h-12 text-center text-2xl font-black text-amber-400 bg-slate-950 border-2 border-amber-500/60 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
              aria-label="Quantity"
            />

            <button
              type="button"
              onClick={() => increment(1)}
              className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black transition-colors cursor-pointer shadow-md"
              aria-label="Increase quantity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick preset increment pills */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[1, 2, 5, 10].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setQuantity(preset);
                  setQuantityInput(String(preset));
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  quantity === preset
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Line Total */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Calculation</span>
            <span className="text-slate-300 font-mono">
              ₹{unitPrice.toFixed(2)} × {quantity}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Line Total</span>
            <span className="text-lg font-black text-white">₹{lineTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons: Confirm & Cancel */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Add (₹{lineTotal.toFixed(0)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
