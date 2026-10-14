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
  ParcelOrder,
  CateringOrder,
  InventoryItem,
  InventoryMovement,
  InventoryCategory,
  InventoryMovementType,
} from '../types';
import {
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_STAFF,
  INITIAL_PARCELS,
  INITIAL_CATERINGS,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_INVENTORY_MOVEMENTS,
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
  parcels: ParcelOrder[];
  caterings: CateringOrder[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
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
      parcels: INITIAL_PARCELS,
      caterings: INITIAL_CATERINGS,
      inventoryItems: INITIAL_INVENTORY_ITEMS,
      inventoryMovements: INITIAL_INVENTORY_MOVEMENTS,
      staff: INITIAL_STAFF,
      activeRole: 'cashier',
      activeStaff: INITIAL_STAFF[1], // Default to Cashier
      notifications: [],
      isRealtimeConnected: false,
    };
  }

  public getInitialState(): RestaurantState {
    return {
      tables: INITIAL_TABLES,
      categories: INITIAL_CATEGORIES,
      menuItems: INITIAL_MENU_ITEMS,
      orders: INITIAL_ORDERS,
      payments: INITIAL_PAYMENTS,
      parcels: INITIAL_PARCELS,
      caterings: INITIAL_CATERINGS,
      inventoryItems: INITIAL_INVENTORY_ITEMS,
      inventoryMovements: INITIAL_INVENTORY_MOVEMENTS,
      staff: INITIAL_STAFF,
      activeRole: 'cashier',
      activeStaff: INITIAL_STAFF[1],
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
      const storedParcels = localStorage.getItem(STORAGE_KEY_PREFIX + 'parcels');
      const storedCaterings = localStorage.getItem(STORAGE_KEY_PREFIX + 'caterings');
      const storedInventoryItems = localStorage.getItem(STORAGE_KEY_PREFIX + 'inventory_items');
      const storedInventoryMovements = localStorage.getItem(STORAGE_KEY_PREFIX + 'inventory_movements');
      if (storedParcels) this.state.parcels = JSON.parse(storedParcels);
      if (storedCaterings) this.state.caterings = JSON.parse(storedCaterings);
      if (storedInventoryItems) this.state.inventoryItems = JSON.parse(storedInventoryItems);
      if (storedInventoryMovements) this.state.inventoryMovements = JSON.parse(storedInventoryMovements);
      this.linkFoodInventoryToMenu();

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
      localStorage.setItem(STORAGE_KEY_PREFIX + 'parcels', JSON.stringify(this.state.parcels));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'caterings', JSON.stringify(this.state.caterings));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'inventory_items', JSON.stringify(this.state.inventoryItems));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'inventory_movements', JSON.stringify(this.state.inventoryMovements));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'role', this.state.activeRole);
    } catch (e) {
      console.warn('Failed to save to storage:', e);
    }
  }

  private linkFoodInventoryToMenu() {
    const foodItems = this.state.inventoryItems.filter((item) => item.category === 'FOOD');
    const linkedIds = new Set(foodItems.map((item) => item.menuItemId).filter(Boolean));
    const normalized = this.state.inventoryItems.map((item) => {
      if (item.category !== 'FOOD' || item.menuItemId) return item;
      const inventoryName = item.name.trim().toLowerCase();
      const menuItem = this.state.menuItems.find((candidate) => {
        const menuName = candidate.name.trim().toLowerCase();
        return menuName === inventoryName || menuName.includes(inventoryName);
      });
      if (!menuItem || linkedIds.has(menuItem.id)) return item;
      linkedIds.add(menuItem.id);
      return { ...item, menuItemId: menuItem.id };
    });
    const missingItems: InventoryItem[] = this.state.menuItems
      .filter((menuItem) => !linkedIds.has(menuItem.id))
      .map((menuItem) => ({
        id: `food-${menuItem.id}`,
        menuItemId: menuItem.id,
        isActive: true,
        name: menuItem.name,
        category: 'FOOD' as const,
        unit: 'portions',
        quantity: 0,
        lowStockThreshold: 5,
        updatedAt: new Date().toISOString(),
      }));
    this.state.inventoryItems = [...normalized, ...missingItems];
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

  public addInventoryItem(data: {
    name: string;
    category: InventoryCategory;
    menuItemId?: string;
    unit: string;
    openingQuantity: number;
    lowStockThreshold: number;
  }): { success: boolean; error?: string } {
    const name = data.name.trim();
    const unit = data.unit.trim();
    if (!name || !unit) return { success: false, error: 'Enter an item name and unit.' };
    if (!Number.isFinite(data.openingQuantity) || data.openingQuantity < 0) {
      return { success: false, error: 'Opening quantity must be zero or more.' };
    }
    if (!Number.isFinite(data.lowStockThreshold) || data.lowStockThreshold < 0) {
      return { success: false, error: 'Low-stock level must be zero or more.' };
    }
    if (data.category === 'FOOD' && data.menuItemId && this.state.inventoryItems.some((item) => item.isActive !== false && item.menuItemId === data.menuItemId)) {
      return { success: false, error: 'This menu dish is already connected to kitchen stock.' };
    }

    const now = new Date().toISOString();
    const item: InventoryItem = {
      id: `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menuItemId: data.category === 'FOOD' ? data.menuItemId : undefined,
      isActive: true,
      name,
      category: data.category,
      unit,
      quantity: data.openingQuantity,
      lowStockThreshold: data.lowStockThreshold,
      updatedAt: now,
    };
    this.state.inventoryItems = [item, ...this.state.inventoryItems];
    if (item.quantity > 0) {
      this.state.inventoryMovements = [{
        id: `movement-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        type: 'IN',
        quantity: item.quantity,
        unit: item.unit,
        note: 'Opening stock',
        createdAt: now,
      }, ...this.state.inventoryMovements];
    }
    this.broadcastChange('STATE_UPDATE', {
      inventoryItems: this.state.inventoryItems,
      inventoryMovements: this.state.inventoryMovements,
    });
    this.notifyListeners();
    return { success: true };
  }

  public updateInventoryThreshold(itemId: string, lowStockThreshold: number): { success: boolean } {
    const index = this.state.inventoryItems.findIndex((item) => item.id === itemId);
    if (index < 0 || !Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) return { success: false };
    const items = [...this.state.inventoryItems];
    const current = items[index];
    items[index] = { ...items[index], lowStockThreshold, updatedAt: new Date().toISOString() };
    this.state.inventoryItems = items;
    if (current.quantity > current.lowStockThreshold && current.quantity <= lowStockThreshold) {
      this.addNotification({
        title: `Low stock: ${current.name}`,
        message: `${current.quantity} ${current.unit} on hand is now at or below its alert level.`,
        type: 'warning',
        sound: true,
      });
    }
    this.broadcastChange('STATE_UPDATE', { inventoryItems: this.state.inventoryItems });
    this.notifyListeners();
    return { success: true };
  }

  public updateInventoryItem(
    itemId: string,
    data: { name: string; unit: string; lowStockThreshold: number }
  ): { success: boolean; error?: string } {
    const index = this.state.inventoryItems.findIndex((item) => item.id === itemId);
    const name = data.name.trim();
    const unit = data.unit.trim();
    if (index < 0) return { success: false, error: 'Inventory item not found.' };
    if (!name || !unit) return { success: false, error: 'Enter an item name and unit.' };
    if (!Number.isFinite(data.lowStockThreshold) || data.lowStockThreshold < 0) {
      return { success: false, error: 'Low-stock level must be zero or more.' };
    }

    const current = this.state.inventoryItems[index];
    const items = [...this.state.inventoryItems];
    items[index] = {
      ...current,
      name,
      unit,
      lowStockThreshold: data.lowStockThreshold,
      updatedAt: new Date().toISOString(),
    };
    this.state.inventoryItems = items;
    if (current.quantity > current.lowStockThreshold && current.quantity <= data.lowStockThreshold) {
      this.addNotification({
        title: `Low stock: ${name}`,
        message: `${current.quantity} ${unit} on hand is now at or below its alert level.`,
        type: 'warning',
        sound: true,
      });
    }
    this.broadcastChange('STATE_UPDATE', { inventoryItems: this.state.inventoryItems });
    this.notifyListeners();
    return { success: true };
  }

  public deleteInventoryItem(itemId: string): { success: boolean } {
    const exists = this.state.inventoryItems.some((item) => item.id === itemId && item.isActive !== false);
    if (!exists) return { success: false };
    this.state.inventoryItems = this.state.inventoryItems.map((item) =>
      item.id === itemId ? { ...item, isActive: false, updatedAt: new Date().toISOString() } : item
    );
    // Keep movement records as an audit trail after the active item is removed.
    this.broadcastChange('STATE_UPDATE', { inventoryItems: this.state.inventoryItems });
    this.notifyListeners();
    return { success: true };
  }

  public recordInventoryMovement(
    itemId: string,
    type: InventoryMovementType,
    quantity: number,
    note = ''
  ): { success: boolean; error?: string } {
    const index = this.state.inventoryItems.findIndex((item) => item.id === itemId);
    if (index < 0) return { success: false, error: 'Inventory item not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { success: false, error: 'Quantity must be greater than zero.' };

    const current = this.state.inventoryItems[index];
    if (type === 'OUT' && quantity > current.quantity) {
      return { success: false, error: `Only ${current.quantity} ${current.unit} available.` };
    }
    const nextQuantity = type === 'IN' ? current.quantity + quantity : current.quantity - quantity;
    const now = new Date().toISOString();
    const updated = { ...current, quantity: nextQuantity, updatedAt: now };
    const items = [...this.state.inventoryItems];
    items[index] = updated;
    this.state.inventoryItems = items;
    const movement: InventoryMovement = {
      id: `movement-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemId: current.id,
      itemName: current.name,
      category: current.category,
      type,
      quantity,
      unit: current.unit,
      note: note.trim() || undefined,
      createdAt: now,
    };
    this.state.inventoryMovements = [movement, ...this.state.inventoryMovements];

    if (type === 'OUT' && current.quantity > current.lowStockThreshold && nextQuantity <= current.lowStockThreshold) {
      this.addNotification({
        title: `Low stock: ${current.name}`,
        message: `Only ${nextQuantity} ${current.unit} left. Reorder or prepare more soon.`,
        type: 'warning',
        sound: true,
      });
    }
    this.broadcastChange('STATE_UPDATE', {
      inventoryItems: this.state.inventoryItems,
      inventoryMovements: this.state.inventoryMovements,
    });
    this.notifyListeners();
    return { success: true };
  }

  private recordKitchenStockOut(order: Order, servedItems: OrderItem[]) {
    const linkedItems = servedItems.filter((orderItem) => orderItem.menu_item_id);
    if (linkedItems.length === 0) return;

    const items = [...this.state.inventoryItems];
    const movements = [...this.state.inventoryMovements];
    const warnings: Array<{ name: string; quantity: number; unit: string }> = [];
    const now = new Date().toISOString();

    for (const orderItem of linkedItems) {
      const index = items.findIndex((item) => item.isActive !== false && item.category === 'FOOD' && item.menuItemId === orderItem.menu_item_id);
      if (index < 0) continue;
      const current = items[index];
      const quantity = Math.max(0, orderItem.quantity);
      const nextQuantity = current.quantity - quantity;
      items[index] = { ...current, quantity: nextQuantity, updatedAt: now };
      movements.unshift({
        id: `movement-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        itemId: current.id,
        itemName: current.name,
        category: 'FOOD',
        type: 'OUT',
        quantity,
        unit: current.unit,
        note: `Kitchen served · ${order.order_number} · Table ${order.table_number}`,
        createdAt: now,
      });
      if (current.quantity > current.lowStockThreshold && nextQuantity <= current.lowStockThreshold) {
        warnings.push({ name: current.name, quantity: nextQuantity, unit: current.unit });
      }
    }

    this.state.inventoryItems = items;
    this.state.inventoryMovements = movements;
    for (const warning of warnings) {
      this.addNotification({
        title: `Kitchen stock low: ${warning.name}`,
        message: `${warning.quantity} ${warning.unit} left after serving ${order.order_number}.`,
        type: 'warning',
        sound: true,
      });
    }
    this.broadcastChange('STATE_UPDATE', {
      inventoryItems: this.state.inventoryItems,
      inventoryMovements: this.state.inventoryMovements,
    });
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

  public createWalkInOrder(
    customerName: string,
    guestCount: number,
    waiterId?: string
  ): { success: boolean; orderId?: string; error?: string } {
    const now = new Date().toISOString();
    const orderId = `walkin-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
    const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = (this.state.orders.length + 1).toString().padStart(4, '0');
    const order: Order = {
      id: orderId,
      order_number: `NAGA-${dateKey}-${sequence}`,
      table_id: '',
      table_number: 0,
      customer_name: customerName.trim() || 'Walk-in Guest',
      guest_count: Math.max(1, guestCount || 1),
      waiter_id: waiterId || this.state.activeStaff.id,
      status: 'NEW',
      subtotal: 0,
      tax_rate: 5,
      tax_amount: 0,
      discount_amount: 0,
      final_total: 0,
      created_at: now,
      updated_at: now,
      items: [],
    };
    this.state.orders = [order, ...this.state.orders];
    this.broadcastChange('STATE_UPDATE', { orders: this.state.orders });
    this.notifyListeners();
    return { success: true, orderId };
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
    }>,
    priceMode: 'STANDARD' | 'AC' = 'STANDARD'
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

      const unitPrice = priceMode === 'AC'
        ? (menuItem.ac_price ?? Math.round(menuItem.price * 1.12 * 100) / 100)
        : menuItem.price;
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
    const wasAlreadyServed = updatedItems[itemIndex].status === 'SERVED';
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

    if (newStatus === 'SERVED' && !wasAlreadyServed) {
      this.recordKitchenStockOut(order, [targetItem]);
    }

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
    const newlyServedItems = newStatus === 'SERVED'
      ? order.items.filter((item) => item.status !== 'SERVED')
      : [];
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

    if (newlyServedItems.length > 0) {
      this.recordKitchenStockOut(order, newlyServedItems);
    }

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

    const orderLocation = order.table_number > 0 ? `Table ${order.table_number}` : 'Walk-in order';
    this.addNotification({
      title: `Bill Requested: ${orderLocation}`,
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

    const paymentLocation = order.table_number > 0 ? `Table ${order.table_number}` : 'Walk-in order';
    this.addNotification({
      title: `Payment Received: ${paymentLocation}`,
      message: order.table_number > 0
        ? `₹${paymentRecord.final_total} paid via ${paymentData.paymentMethod}. Table ${order.table_number} is now FREE!`
        : `₹${paymentRecord.final_total} paid via ${paymentData.paymentMethod}.`,
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
    const inventoryItem: InventoryItem = {
      id: `food-${newItem.id}`,
      menuItemId: newItem.id,
      isActive: true,
      name: newItem.name,
      category: 'FOOD',
      unit: 'portions',
      quantity: 0,
      lowStockThreshold: 5,
      updatedAt: new Date().toISOString(),
    };
    this.state.inventoryItems = [inventoryItem, ...this.state.inventoryItems];
    this.broadcastChange('STATE_UPDATE', {
      menuItems: this.state.menuItems,
      inventoryItems: this.state.inventoryItems,
    });
    this.notifyListeners();
    return { success: true, item: newItem };
  }

  public updateMenuItem(updated: MenuItem): { success: boolean } {
    const index = this.state.menuItems.findIndex((m) => m.id === updated.id);
    if (index === -1) return { success: false };

    const newItems = [...this.state.menuItems];
    newItems[index] = updated;
    this.state.menuItems = newItems;

    this.state.inventoryItems = this.state.inventoryItems.map((item) =>
      item.menuItemId === updated.id ? { ...item, name: updated.name, updatedAt: new Date().toISOString() } : item
    );

    this.broadcastChange('STATE_UPDATE', {
      menuItems: this.state.menuItems,
      inventoryItems: this.state.inventoryItems,
    });
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

  // ==========================================================================
  // Parcel & Takeaway Operations (Category B)
  // ==========================================================================
  public createParcelOrder(data: {
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
  }): { success: boolean; parcel?: ParcelOrder; error?: string } {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'At least one menu item is required for parcel billing' };
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const menuItem = this.state.menuItems.find((m) => m.id === item.menuItemId);
      if (!menuItem) continue;

      const totalItemPrice = menuItem.price * item.quantity;
      subtotal += totalItemPrice;

      orderItems.push({
        id: `poi-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
        order_id: '',
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: item.quantity,
        unit_price: menuItem.price,
        total_price: totalItemPrice,
        special_instructions: item.specialInstructions || '',
        status: 'SERVED',
        round_number: 1,
        created_at: new Date().toISOString(),
      });
    }

    const packagingCharge = data.packagingCharge !== undefined ? data.packagingCharge : 20;
    const taxRate = 5;
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const finalTotal = Number((subtotal + packagingCharge + taxAmount).toFixed(2));

    const tokenNum = `P-${this.state.parcels.length + 101}`;

    const newParcel: ParcelOrder = {
      id: `parcel-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      token_number: tokenNum,
      customer_name: data.customerName || 'Walk-in Guest',
      customer_phone: data.customerPhone || '',
      items: orderItems,
      subtotal,
      packaging_charge: packagingCharge,
      tax_amount: taxAmount,
      final_total: finalTotal,
      payment_method: data.paymentMethod,
      payment_reference:
        data.paymentReference ||
        (data.paymentMethod === 'UPI'
          ? `UPI-P-${Date.now().toString().slice(-6)}`
          : data.paymentMethod === 'CARD'
          ? `CARD-P-${Date.now().toString().slice(-6)}`
          : `CASH-P-${Date.now().toString().slice(-6)}`),
      payment_status: 'COMPLETED',
      cashier_name: data.cashierName || this.state.activeStaff.full_name,
      created_at: new Date().toISOString(),
    };

    newParcel.items.forEach((it) => (it.order_id = newParcel.id));

    this.state.parcels = [newParcel, ...this.state.parcels];

    this.addNotification({
      title: `Parcel Billed: Token #${newParcel.token_number}`,
      message: `${newParcel.customer_name} • ₹${newParcel.final_total} paid via ${newParcel.payment_method}`,
      type: 'success',
      sound: true,
    });

    this.saveToStorage();
    this.broadcastChange('STATE_UPDATE', { parcels: this.state.parcels });
    this.notifyListeners();

    return { success: true, parcel: newParcel };
  }

  // ==========================================================================
  // Catering Billing Operations (Category C)
  // ==========================================================================
  public createCateringOrder(data: {
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
  }): { success: boolean; catering?: CateringOrder; error?: string } {
    if (!data.customerName || !data.customerPhone) {
      return { success: false, error: 'Customer name and phone number are required' };
    }
    if (!data.paxCount || data.paxCount <= 0) {
      return { success: false, error: 'Valid guest/pax count is required' };
    }
    if (!data.pricePerPlate || data.pricePerPlate <= 0) {
      return { success: false, error: 'Valid price per plate is required' };
    }

    const subtotal = data.paxCount * data.pricePerPlate;
    const taxRate = 5;
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));
    const advancePaid = Math.min(totalAmount, Math.max(0, data.advancePaid || 0));
    const balanceDue = Number(Math.max(0, totalAmount - advancePaid).toFixed(2));
    const status = balanceDue <= 0 ? 'FULLY_PAID' : 'ADVANCE_PAID';

    const currentYear = new Date().getFullYear();
    const invoiceNumber = `CAT-${currentYear}-${String(this.state.caterings.length + 1).padStart(3, '0')}`;

    const newCatering: CateringOrder = {
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      invoice_number: invoiceNumber,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      event_name: data.eventName || 'Special Event Feast',
      event_date: data.eventDate || new Date().toISOString().split('T')[0],
      pax_count: data.paxCount,
      price_per_plate: data.pricePerPlate,
      menu_summary: data.menuSummary || 'Grand Festive Spread',
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      advance_paid: advancePaid,
      balance_due: balanceDue,
      payment_method: data.paymentMethod,
      payment_reference:
        data.paymentReference ||
        `CAT-${data.paymentMethod}-${Date.now().toString().slice(-6)}`,
      status,
      notes: data.notes || '',
      cashier_name: data.cashierName || this.state.activeStaff.full_name,
      created_at: new Date().toISOString(),
    };

    this.state.caterings = [newCatering, ...this.state.caterings];

    this.addNotification({
      title: `Catering Contract: ${newCatering.invoice_number}`,
      message: `${newCatering.customer_name} (${newCatering.pax_count} Pax) • Advance ₹${newCatering.advance_paid} received`,
      type: 'success',
      sound: true,
    });

    this.saveToStorage();
    this.broadcastChange('STATE_UPDATE', { caterings: this.state.caterings });
    this.notifyListeners();

    return { success: true, catering: newCatering };
  }

  public settleCateringBalance(
    cateringId: string,
    paymentMethod: PaymentMethod,
    paymentReference?: string
  ): { success: boolean; error?: string } {
    const index = this.state.caterings.findIndex((c) => c.id === cateringId);
    if (index === -1) {
      return { success: false, error: 'Catering order not found' };
    }

    const order = this.state.caterings[index];
    if (order.balance_due <= 0) {
      return { success: false, error: 'This catering invoice is already fully settled' };
    }

    const updated: CateringOrder = {
      ...order,
      advance_paid: order.total_amount,
      balance_due: 0,
      status: 'FULLY_PAID',
      payment_method: paymentMethod,
      payment_reference:
        paymentReference || `CAT-BAL-${paymentMethod}-${Date.now().toString().slice(-6)}`,
    };

    const newCaterings = [...this.state.caterings];
    newCaterings[index] = updated;
    this.state.caterings = newCaterings;

    this.addNotification({
      title: `Catering Settled: ${order.invoice_number}`,
      message: `Balance ₹${order.balance_due} received via ${paymentMethod}. Invoice fully paid!`,
      type: 'success',
      sound: true,
    });

    this.saveToStorage();
    this.broadcastChange('STATE_UPDATE', { caterings: this.state.caterings });
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
      parcels: INITIAL_PARCELS,
      caterings: INITIAL_CATERINGS,
      inventoryItems: INITIAL_INVENTORY_ITEMS,
      inventoryMovements: INITIAL_INVENTORY_MOVEMENTS,
      staff: INITIAL_STAFF,
      activeRole: 'cashier',
      activeStaff: INITIAL_STAFF[1],
      notifications: [
        {
          id: `notif-reset-${Date.now()}`,
          title: 'Demo Environment Reset',
          message: 'Default tables, menu, parcels, caterings, and sample orders restored successfully.',
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
