'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  restaurantStore,
  RestaurantState,
  ToastNotification,
} from '../lib/store/restaurant-store';
import {
  UserRole,
  PaymentMethod,
  OrderItemStatus,
  MenuItem,
  RestaurantTable,
  Order,
  Payment,
  ParcelOrder,
  CateringOrder,
  InventoryCategory,
  InventoryMovementType,
} from '../lib/types';

interface RestaurantContextType {
  state: RestaurantState;
  setRole: (role: UserRole) => void;
  assignTable: (
    tableId: string,
    customerName: string,
    guestCount: number,
    waiterId?: string
  ) => { success: boolean; orderId?: string; error?: string };
  createWalkInOrder: (customerName: string, guestCount: number, waiterId?: string) => { success: boolean; orderId?: string; error?: string };
  addItemsToOrder: (
    orderId: string,
    itemsToAdd: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>,
    priceMode?: 'STANDARD' | 'AC'
  ) => { success: boolean; error?: string };
  updateOrderItemStatus: (
    orderId: string,
    itemId: string,
    newStatus: OrderItemStatus
  ) => { success: boolean; error?: string };
  updateTicketStatus: (
    orderId: string,
    newStatus: 'PREPARING' | 'READY' | 'SERVED'
  ) => { success: boolean; error?: string };
  requestBill: (orderId: string) => { success: boolean; error?: string };
  processPayment: (
    orderId: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      paymentReference?: string;
      discountAmount?: number;
      cashierId?: string;
      cashierName?: string;
    }
  ) => { success: boolean; payment?: Payment; error?: string };
  createParcelOrder: (data: {
    customerName: string;
    customerPhone?: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    packagingCharge?: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    cashierName?: string;
  }) => { success: boolean; parcel?: ParcelOrder; error?: string };
  createCateringOrder: (data: {
    customerName: string;
    customerPhone: string;
    eventName: string;
    eventDate: string;
    paxCount: number;
    pricePerPlate: number;
    menuSummary: string;
    advancePaid: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    notes?: string;
    cashierName?: string;
  }) => { success: boolean; catering?: CateringOrder; error?: string };
  settleCateringBalance: (
    cateringId: string,
    paymentMethod: PaymentMethod,
    paymentReference?: string
  ) => { success: boolean; error?: string };
  addMenuItem: (item: Omit<MenuItem, 'id'>) => { success: boolean; item?: MenuItem };
  updateMenuItem: (item: MenuItem) => { success: boolean };
  toggleItemAvailability: (itemId: string) => { success: boolean };
  deleteMenuItem: (itemId: string) => { success: boolean };
  addCategory: (name: string, icon?: string) => { success: boolean };
  addInventoryItem: (data: {
    name: string;
    category: InventoryCategory;
    menuItemId?: string;
    unit: string;
    openingQuantity: number;
    lowStockThreshold: number;
  }) => { success: boolean; error?: string };
  updateInventoryThreshold: (itemId: string, lowStockThreshold: number) => { success: boolean };
  updateInventoryItem: (
    itemId: string,
    data: { name: string; unit: string; lowStockThreshold: number }
  ) => { success: boolean; error?: string };
  deleteInventoryItem: (itemId: string) => { success: boolean };
  recordInventoryMovement: (
    itemId: string,
    type: InventoryMovementType,
    quantity: number,
    note?: string
  ) => { success: boolean; error?: string };
  clearNotification: (id: string) => void;
  resetToDemo: () => void;
  isHydrated: boolean;
  // Helpers
  getActiveOrderForTable: (tableId: string) => Order | undefined;
  getTableById: (tableId: string) => RestaurantTable | undefined;
  getOrderById: (orderId: string) => Order | undefined;
  stats: {
    totalTables: number;
    freeTables: number;
    occupiedTables: number;
    billRequestedTables: number;
    todaySales: number;
    pendingKitchenTickets: number;
  };
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with pristine initial state so server and client initial render match 100%
  const [state, setState] = useState<RestaurantState>(() => restaurantStore.getInitialState());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    restaurantStore.init();
    setState({ ...restaurantStore.getState() });
    setIsHydrated(true);
    const unsubscribe = restaurantStore.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  const getActiveOrderForTable = (tableId: string): Order | undefined => {
    const table = state.tables.find((t) => t.id === tableId);
    if (!table || !table.active_order_id) return undefined;
    return state.orders.find((o) => o.id === table.active_order_id);
  };

  const getTableById = (tableId: string): RestaurantTable | undefined => {
    return state.tables.find((t) => t.id === tableId);
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return state.orders.find((o) => o.id === orderId);
  };

  const stats = useMemo(() => {
    const totalTables = state.tables.length;
    const freeTables = state.tables.filter((t) => t.status === 'FREE').length;
    const billRequestedTables = state.tables.filter((t) => t.status === 'BILL_REQUESTED').length;
    const occupiedTables = totalTables - freeTables;

    const todaySales = state.payments.reduce((sum, p) => sum + (p.final_total || 0), 0);

    const pendingKitchenTickets = state.orders.filter(
      (o) => o.status === 'NEW' || o.status === 'PREPARING'
    ).length;

    return {
      totalTables,
      freeTables,
      occupiedTables,
      billRequestedTables,
      todaySales,
      pendingKitchenTickets,
    };
  }, [state.tables, state.payments, state.orders]);

  const value: RestaurantContextType = {
    state,
    setRole: (role) => restaurantStore.setRole(role),
    assignTable: (tId, name, count, wId) => restaurantStore.assignTable(tId, name, count, wId),
    createWalkInOrder: (name, count, waiterId) => restaurantStore.createWalkInOrder(name, count, waiterId),
    addItemsToOrder: (oId, items, priceMode) => restaurantStore.addItemsToOrder(oId, items, priceMode),
    updateOrderItemStatus: (oId, iId, status) =>
      restaurantStore.updateOrderItemStatus(oId, iId, status),
    updateTicketStatus: (oId, status) => restaurantStore.updateTicketStatus(oId, status),
    requestBill: (oId) => restaurantStore.requestBill(oId),
    processPayment: (oId, pData) => restaurantStore.processPayment(oId, pData),
    createParcelOrder: (data) => restaurantStore.createParcelOrder(data),
    createCateringOrder: (data) => restaurantStore.createCateringOrder(data),
    settleCateringBalance: (id, method, ref) =>
      restaurantStore.settleCateringBalance(id, method, ref),
    addMenuItem: (item) => restaurantStore.addMenuItem(item),
    updateMenuItem: (item) => restaurantStore.updateMenuItem(item),
    toggleItemAvailability: (iId) => restaurantStore.toggleItemAvailability(iId),
    deleteMenuItem: (iId) => restaurantStore.deleteMenuItem(iId),
    addCategory: (name, icon) => restaurantStore.addCategory(name, icon),
    addInventoryItem: (data) => restaurantStore.addInventoryItem(data),
    updateInventoryThreshold: (itemId, threshold) => restaurantStore.updateInventoryThreshold(itemId, threshold),
    updateInventoryItem: (itemId, data) => restaurantStore.updateInventoryItem(itemId, data),
    deleteInventoryItem: (itemId) => restaurantStore.deleteInventoryItem(itemId),
    recordInventoryMovement: (itemId, type, quantity, note) =>
      restaurantStore.recordInventoryMovement(itemId, type, quantity, note),
    clearNotification: (id) => restaurantStore.clearNotification(id),
    resetToDemo: () => restaurantStore.resetToDemo(),
    getActiveOrderForTable,
    getTableById,
    getOrderById,
    stats,
    isHydrated,
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
