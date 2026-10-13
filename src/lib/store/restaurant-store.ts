// ============================================================================
// Naga Hotel - Core Restaurant Store & Realtime Synchronization Engine
// ============================================================================

import {
  RestaurantTable,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  OrderStatus,
  OrderItemStatus,
  UserRole,
  StaffUser,
} from '../types';
import {
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_STAFF,
} from './initial-data';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

const STORAGE_KEY_PREFIX = 'naga_hotel_rms_';
const BROADCAST_CHANNEL_NAME = 'naga_rms_sync_channel';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  sound?: boolean;
}

export interface RestaurantState {
  tables: RestaurantTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  payments: Payment[];
  staff: StaffUser[];
  activeRole: UserRole;
  activeStaff: StaffUser;
  notifications: ToastNotification[];
  isRealtimeConnected: boolean;
}

type Listener = (state: RestaurantState) => void;

class RestaurantStore {
  private state: RestaurantState;
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isInitialized = false;

  constructor() {
    this.state = {
      tables: INITIAL_TABLES,
      categories: INITIAL_CATEGORIES,
      menuItems: INITIAL_MENU_ITEMS,
      orders: INITIAL_ORDERS,
      payments: INITIAL_PAYMENTS,
      staff: INITIAL_STAFF,
      activeRole: 'cashier',
      activeStaff: INITIAL_STAFF[1], // Default to Cashier
      notifications: [],
      isRealtimeConnected: false,
    };
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Load persisted state from localStorage
    this.loadFromStorage();

    // Initialize BroadcastChannel for instant cross-tab real-time sync
    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE' && event.data.payload) {
          this.applyExternalState(event.data.payload);
        } else if (event.data?.type === 'NOTIFICATION' && event.data.payload) {
          this.addNotification(event.data.payload, false);
        }
      };
    } catch {
      // BroadcastChannel not available in old browsers
    }

    // Connect to Supabase if configured
    this.connectSupabaseRealtime();
  }

  private loadFromStorage() {
    try {
      const storedTables = localStorage.getItem(STORAGE_KEY_PREFIX + 'tables');
      const storedOrders = localStorage.getItem(STORAGE_KEY_PREFIX + 'orders');
      const storedMenu = localStorage.getItem(STORAGE_KEY_PREFIX + 'menu');
      const storedCategories = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
      const storedPayments = localStorage.getItem(STORAGE_KEY_PREFIX + 'payments');
      const storedRole = localStorage.getItem(STORAGE_KEY_PREFIX + 'role');

      if (storedTables) this.state.tables = JSON.parse(storedTables);
      if (storedOrders) this.state.orders = JSON.parse(storedOrders);
      if (storedPayments) this.state.payments = JSON.parse(storedPayments);

      if (storedCategories) {
        const parsedCats = JSON.parse(storedCategories);
        if (parsedCats.some((c: { id: string }) => c.id === 'cat-chinese')) {
          this.state.categories = parsedCats;
          if (storedMenu) this.state.menuItems = JSON.parse(storedMenu);
        } else {
          this.state.categories = INITIAL_CATEGORIES;
          this.state.menuItems = INITIAL_MENU_ITEMS;
        }
      } else {
        this.state.categories = INITIAL_CATEGORIES;
        this.state.menuItems = INITIAL_MENU_ITEMS;
      }
      if (storedRole) {
        const role = storedRole as UserRole;
        this.state.activeRole = role;
        const matchingStaff = this.state.staff.find((s) => s.role === role);
        if (matchingStaff) this.state.activeStaff = matchingStaff;
      }
    } catch (e) {
      console.warn('Failed to load from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'tables', JSON.stringify(this.state.tables));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(this.state.orders));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'menu', JSON.stringify(this.state.menuItems));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(this.state.categories));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'payments', JSON.stringify(this.state.payments));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'role', this.state.activeRole);
    } catch (e) {
      console.warn('Failed to save to storage:', e);
    }
  }

  private connectSupabaseRealtime() {
    if (!isSupabaseConfigured()) {
      this.state.isRealtimeConnected = true; // Local broadcast mode active
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('naga_rms_live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'restaurant_tables' },
          (payload) => {
            console.log('Realtime table event:', payload);
            // Handle remote table change
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Realtime order event:', payload);
            // Handle remote order change
          }
        )
        .subscribe((status) => {
          this.state.isRealtimeConnected = status === 'SUBSCRIBED';
          this.notifyListeners();
        });
    } catch (e) {
      console.warn('Supabase Realtime subscription error:', e);
    }
  }

  private broadcastChange(type: string, payload: unknown) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, payload });
    }
  }

  private applyExternalState(partialState: Partial<RestaurantState>) {
    this.state = {
      ...this.state,
      ...partialState,
      // Maintain current user role and notifications
      activeRole: this.state.activeRole,
      activeStaff: this.state.activeStaff,
    };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): RestaurantState {
    return this.state;
  }

  // ==========================================================================
  // Role & Staff Authentication Actions
  // ==========================================================================
  public setRole(role: UserRole) {
    this.state.activeRole = role;
    const staffMember = this.state.staff.find((s) => s.role === role) || this.state.staff[0];
    this.state.activeStaff = staffMember;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'role', role);
    }
    this.notifyListeners();
  }

  public addNotification(
    notification: Omit<ToastNotification, 'id' | 'timestamp'>,
    broadcast = true
  ) {
    const newNotification: ToastNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.state.notifications = [newNotification, ...this.state.notifications].slice(0, 8);
    this.notifyListeners();

    if (broadcast) {
      this.broadcastChange('NOTIFICATION', newNotification);
    }
  }

  public clearNotification(id: string) {
    this.state.notifications = this.state.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  // ==========================================================================
  // Table & Order Lifecycle Operations
  // ==========================================================================

  /**
   * 1. Waiter assigns a FREE table.
   * STRICT: Throws error if table is not FREE.
   * Generates a unique order ID and fresh order object.
   */
  public assignTable(
    tableId: string,
    customerName: string,
    guestCount: number,
    waiterId?: string
  ): { success: boolean; orderId?: string; error?: string } {
    const tableIndex = this.state.tables.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) {
      return { success: false, error: 'Table not found' };
    }

    const table = this.state.tables[tableIndex];
    if (table.status !== 'FREE') {
      return {
        success: false,
        error: `Table ${table.table_number} is already occupied by ${table.current_customer_name || 'another customer'}!`,
      };
    }

    const cleanedCustomerName = customerName.trim() || 'Walk-in Guest';
    const validGuestCount = Math.max(1, guestCount || 1);

    // Generate unique order ID & sequential order number
    const uniqueOrderId = `ord-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderSequence = (this.state.orders.length + 1).toString().padStart(4, '0');
    const orderNumber = `NAGA-${todayStr}-${orderSequence}`;

    const newOrder: Order = {
      id: uniqueOrderId,
      order_number: orderNumber,
      table_id: table.id,
      table_number: table.table_number,
      customer_name: cleanedCustomerName,
      guest_count: validGuestCount,
      waiter_id: waiterId || this.state.activeStaff.id,
      status: 'NEW',
      subtotal: 0,
      tax_rate: 5.0,
      tax_amount: 0,
      discount_amount: 0,
      final_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [],
    };

    // Update table status to OCCUPIED and bind fresh order
    const updatedTable: RestaurantTable = {
      ...table,
      status: 'OCCUPIED',
      active_order_id: uniqueOrderId,
      current_customer_name: cleanedCustomerName,
      guest_count: validGuestCount,
      updated_at: new Date().toISOString(),
    };

    const newTables = [...this.state.tables];
    newTables[tableIndex] = updatedTable;

    this.state.tables = newTables;
    this.state.orders = [newOrder, ...this.state.orders];

    this.addNotification({
      title: `Table ${table.table_number} Assigned`,
      message: `${cleanedCustomerName} seated (${validGuestCount} guests). Order: ${orderNumber}`,
      type: 'info',
    });

    this.broadcastChange('STATE_UPDATE', {
      tables: this.state.tables,
      orders: this.state.orders,
    });
    this.notifyListeners();

    return { success: true, orderId: uniqueOrderId };
  }

  /**
   * 2. Submit items or Add extra items to active order.
   * Calculates round number (Round 1, Round 2, etc.) and auto-updates totals.
   */
  public addItemsToOrder(
    orderId: string,
    itemsToAdd: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>
  ): { success: boolean; error?: string } {
    const orderIndex = this.state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    const order = this.state.orders[orderIndex];
    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      return { success: false, error: 'Cannot add items to a completed or cancelled order.' };
    }

    if (!itemsToAdd.length) {
      return { success: false, error: 'No items selected.' };
    }

    // Determine current highest round number
    const currentMaxRound = order.items.reduce((max, it) => Math.max(max, it.round_number || 1), 0);
    const roundNumber = order.items.length === 0 ? 1 : currentMaxRound + 1;

    const newOrderItems: OrderItem[] = itemsToAdd.map((input) => {
      const menuItem = this.state.menuItems.find((m) => m.id === input.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${input.menuItemId}`);
      }

      const unitPrice = menuItem.price;
      const totalPrice = unitPrice * input.quantity;

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order_id: orderId,
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: input.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        special_instructions: input.specialInstructions || '',
        status: 'NEW',
        round_number: roundNumber,
        created_at: new Date().toISOString(),
      };
    });

    const allItems = [...order.items, ...newOrderItems];
    const subtotal = allItems.reduce((sum, it) => sum + it.total_price, 0);
    const taxRate = order.tax_rate || 5.0;
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const finalTotal = Number(
      Math.max(0, subtotal + taxAmount - (order.discount_amount || 0)).toFixed(2)
    );

    const updatedOrder: Order = {
      ...order,
      items: allItems,
      subtotal,
      tax_amount: taxAmount,
      final_total: finalTotal,
      status: order.status === 'SERVED' || order.status === 'READY' ? 'PREPARING' : order.status,
      updated_at: new Date().toISOString(),
    };

    const newOrders = [...this.state.orders];
    newOrders[orderIndex] = updatedOrder;
    this.state.orders = newOrders;

    this.addNotification({
      title: `KOT Order Sent: Table ${order.table_number}`,
      message: `${newOrderItems.length} items submitted to Kitchen (Round ${roundNumber})`,
      type: 'success',
      sound: true,
    });

    this.broadcastChange('STATE_UPDATE', {
      orders: this.state.orders,
    });
    this.notifyListeners();

    return { success: true };
  }

  /**
   * 3. Kitchen updates order item status (NEW -> PREPARING -> READY -> SERVED).
   */
  public updateOrderItemStatus(
    orderId: string,
    itemId: string,
    newStatus: OrderItemStatus
  ): { success: boolean; error?: string } {
    const orderIndex = this.state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    const order = this.state.orders[orderIndex];
    const itemIndex = order.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) {
      return { success: false, error: 'Item not found in order' };
    }

    const updatedItems = [...order.items];
    const targetItem = { ...updatedItems[itemIndex], status: newStatus };
    updatedItems[itemIndex] = targetItem;

    // Derive overall order status
    let derivedStatus: OrderStatus = order.status;
    const allReady = updatedItems.every((it) => it.status === 'READY' || it.status === 'SERVED');
    const allServed = updatedItems.every((it) => it.status === 'SERVED');
    const anyPreparing = updatedItems.some((it) => it.status === 'PREPARING');

    if (allServed) {
      derivedStatus = 'SERVED';
    } else if (allReady) {
      derivedStatus = 'READY';
    } else if (anyPreparing) {
      derivedStatus = 'PREPARING';
    }

    const updatedOrder: Order = {
      ...order,
      items: updatedItems,
      status: derivedStatus,
      updated_at: new Date().toISOString(),
    };

    const newOrders = [...this.state.orders];
    newOrders[orderIndex] = updatedOrder;
    this.state.orders = newOrders;

    // Notify waiter when food is marked READY
    if (newStatus === 'READY') {
      this.addNotification({
        title: `Food Ready! Table ${order.table_number}`,
        message: `${targetItem.item_name} (x${targetItem.quantity}) is ready to be served!`,
        type: 'warning',
        sound: true,
      });
    }

    this.broadcastChange('STATE_UPDATE', {
      orders: this.state.orders,
    });
    this.notifyListeners();

    return { success: true };
  }

  /**
   * 4. Quick status update for whole order ticket (e.g. Kitchen marks all items PREPARING or READY).
   */
  public updateTicketStatus(
    orderId: string,
    newStatus: 'PREPARING' | 'READY' | 'SERVED'
  ): { success: boolean; error?: string } {
    const orderIndex = this.state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return { success: false, error: 'Order not found' };

    const order = this.state.orders[orderIndex];
    const updatedItems = order.items.map((it) => ({
      ...it,
      status: newStatus as OrderItemStatus,
    }));

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      items: updatedItems,
      updated_at: new Date().toISOString(),
    };

    const newOrders = [...this.state.orders];
    newOrders[orderIndex] = updatedOrder;
    this.state.orders = newOrders;

    if (newStatus === 'READY') {
      this.addNotification({
        title: `All Items Ready: Table ${order.table_number}`,
        message: `Order ${order.order_number} for ${order.customer_name} is complete and ready for pickup!`,
        type: 'success',
        sound: true,
      });
    }

    this.broadcastChange('STATE_UPDATE', {
      orders: this.state.orders,
    });
    this.notifyListeners();

    return { success: true };
  }

  /**
   * 5. Waiter requests bill when customer is done eating.
   * Updates order and table status to BILL_REQUESTED.
   * Cashier receives instant alert.
   */
  public requestBill(orderId: string): { success: boolean; error?: string } {
    const orderIndex = this.state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return { success: false, error: 'Order not found' };

    const order = this.state.orders[orderIndex];
    if (order.status === 'PAID') {
      return { success: false, error: 'Order is already paid.' };
    }

    const updatedOrder: Order = {
      ...order,
      status: 'BILL_REQUESTED',
      updated_at: new Date().toISOString(),
    };

    const newOrders = [...this.state.orders];
    newOrders[orderIndex] = updatedOrder;
    this.state.orders = newOrders;

    // Update Table status
    const tableIndex = this.state.tables.findIndex((t) => t.id === order.table_id);
    if (tableIndex !== -1) {
      const updatedTable: RestaurantTable = {
        ...this.state.tables[tableIndex],
        status: 'BILL_REQUESTED',
        updated_at: new Date().toISOString(),
      };
      const newTables = [...this.state.tables];
      newTables[tableIndex] = updatedTable;
      this.state.tables = newTables;
    }

    this.addNotification({
      title: `Bill Requested: Table ${order.table_number}`,
      message: `${order.customer_name} requested bill. Total: ₹${order.final_total.toFixed(2)}`,
      type: 'info',
      sound: true,
    });

    this.broadcastChange('STATE_UPDATE', {
      tables: this.state.tables,
      orders: this.state.orders,
    });
    this.notifyListeners();

    return { success: true };
  }

  /**
   * 6. Cashier completes payment.
   * CRITICAL LIFECYCLE:
   * - Records payment in payments table.
   * - Closes the active order (status = 'PAID', closed_at = timestamp).
   * - Sets Table status = 'FREE'.
   * - Clears table active_order_id and customer name.
   * - Updates both cashier and waiter screens immediately.
   */
  public processPayment(
    orderId: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      paymentReference?: string;
      discountAmount?: number;
      cashierId?: string;
      cashierName?: string;
    }
  ): { success: boolean; payment?: Payment; error?: string } {
    const orderIndex = this.state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found' };
    }

    const order = this.state.orders[orderIndex];
    if (order.status === 'PAID') {
      return { success: false, error: 'This bill has already been paid and settled.' };
    }

    const discount = Math.max(0, paymentData.discountAmount || 0);
    const finalTotal = Math.max(0, order.subtotal + order.tax_amount - discount);

    const paymentRecord: Payment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      order_id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      customer_name: order.customer_name,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      discount_amount: discount,
      final_total: Number(finalTotal.toFixed(2)),
      payment_method: paymentData.paymentMethod,
      payment_reference: paymentData.paymentReference || '',
      payment_status: 'COMPLETED',
      cashier_id: paymentData.cashierId || this.state.activeStaff.id,
      cashier_name: paymentData.cashierName || this.state.activeStaff.full_name,
      created_at: new Date().toISOString(),
    };

    // Close order
    const closedOrder: Order = {
      ...order,
      status: 'PAID',
      discount_amount: discount,
      final_total: Number(finalTotal.toFixed(2)),
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOrders = [...this.state.orders];
    newOrders[orderIndex] = closedOrder;
    this.state.orders = newOrders;

    // Add to payments billing history
    this.state.payments = [paymentRecord, ...this.state.payments];

    // Atomically release table to FREE
    const tableIndex = this.state.tables.findIndex((t) => t.id === order.table_id);
    if (tableIndex !== -1) {
      const freeTable: RestaurantTable = {
        ...this.state.tables[tableIndex],
        status: 'FREE',
        active_order_id: null,
        current_customer_name: null,
        guest_count: 0,
        updated_at: new Date().toISOString(),
      };
      const newTables = [...this.state.tables];
      newTables[tableIndex] = freeTable;
      this.state.tables = newTables;
    }

    this.addNotification({
      title: `Payment Received: Table ${order.table_number}`,
      message: `₹${paymentRecord.final_total} paid via ${paymentData.paymentMethod}. Table ${order.table_number} is now FREE!`,
      type: 'success',
      sound: true,
    });

    this.broadcastChange('STATE_UPDATE', {
      tables: this.state.tables,
      orders: this.state.orders,
      payments: this.state.payments,
    });
    this.notifyListeners();

    return { success: true, payment: paymentRecord };
  }

  // ==========================================================================
  // Admin Menu Management Operations
  // ==========================================================================
  public addMenuItem(item: Omit<MenuItem, 'id'>): { success: boolean; item?: MenuItem } {
    const newItem: MenuItem = {
      ...item,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    this.state.menuItems = [newItem, ...this.state.menuItems];
    this.broadcastChange('STATE_UPDATE', { menuItems: this.state.menuItems });
    this.notifyListeners();
    return { success: true, item: newItem };
  }

  public updateMenuItem(updated: MenuItem): { success: boolean } {
    const index = this.state.menuItems.findIndex((m) => m.id === updated.id);
    if (index === -1) return { success: false };

    const newItems = [...this.state.menuItems];
    newItems[index] = updated;
    this.state.menuItems = newItems;

    this.broadcastChange('STATE_UPDATE', { menuItems: this.state.menuItems });
    this.notifyListeners();
    return { success: true };
  }

  public toggleItemAvailability(itemId: string): { success: boolean } {
    const index = this.state.menuItems.findIndex((m) => m.id === itemId);
    if (index === -1) return { success: false };

    const current = this.state.menuItems[index];
    const updated = { ...current, is_available: !current.is_available };

    const newItems = [...this.state.menuItems];
    newItems[index] = updated;
    this.state.menuItems = newItems;

    this.broadcastChange('STATE_UPDATE', { menuItems: this.state.menuItems });
    this.notifyListeners();
    return { success: true };
  }

  public deleteMenuItem(itemId: string): { success: boolean } {
    this.state.menuItems = this.state.menuItems.filter((m) => m.id !== itemId);
    this.broadcastChange('STATE_UPDATE', { menuItems: this.state.menuItems });
    this.notifyListeners();
    return { success: true };
  }

  public addCategory(name: string, icon = 'Utensils'): { success: boolean } {
    const newCategory: MenuCategory = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      icon,
      display_order: this.state.categories.length + 1,
      is_active: true,
    };

    this.state.categories = [...this.state.categories, newCategory];
    this.broadcastChange('STATE_UPDATE', { categories: this.state.categories });
    this.notifyListeners();
    return { success: true };
  }

  // Reset to initial demo state
  public resetToDemo() {
    this.state = {
      tables: INITIAL_TABLES,
      categories: INITIAL_CATEGORIES,
      menuItems: INITIAL_MENU_ITEMS,
      orders: INITIAL_ORDERS,
      payments: INITIAL_PAYMENTS,
      staff: INITIAL_STAFF,
      activeRole: 'cashier',
      activeStaff: INITIAL_STAFF[1],
      notifications: [
        {
          id: `notif-reset-${Date.now()}`,
          title: 'Demo Environment Reset',
          message: 'Default tables, menu, and sample orders restored successfully.',
          type: 'info',
          timestamp: new Date().toISOString(),
        },
      ],
      isRealtimeConnected: true,
    };

    this.saveToStorage();
    this.broadcastChange('STATE_UPDATE', this.state);
    this.notifyListeners();
  }
}

export const restaurantStore = new RestaurantStore();
