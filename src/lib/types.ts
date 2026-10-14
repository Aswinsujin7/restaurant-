// ============================================================================
// Naga Hotel - TypeScript Types & Interfaces
// ============================================================================

export type UserRole = 'admin' | 'cashier' | 'waiter' | 'kitchen';

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  pin_code: string;
  is_active: boolean;
  avatar?: string;
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED';

export interface RestaurantTable {
  id: string;
  table_number: number;
  table_label: string;
  capacity: number;
  section: string;
  status: TableStatus;
  active_order_id?: string | null;
  current_customer_name?: string | null;
  guest_count?: number;
  updated_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  icon?: string;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  ac_price?: number;
  is_veg: boolean;
  spicy_level: number; // 0: None, 1: Mild, 2: Medium, 3: Spicy
  is_available: boolean;
  image_url?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'BILL_REQUESTED'
  | 'PAID'
  | 'CANCELLED';

export type OrderItemStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  status: OrderItemStatus;
  round_number: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  session_id?: string;
  waiter_id?: string;
  customer_name: string;
  guest_count?: number;
  table_number: number;
  status: OrderStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  final_total: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  closed_at?: string | null;
  items: OrderItem[];
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'COMPLETED' | 'FAILED';

export interface Payment {
  id: string;
  order_id: string;
  order_number: string;
  table_number: number;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  final_total: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_status: PaymentStatus;
  cashier_id?: string;
  cashier_name: string;
  created_at: string;
}

export interface BillSummary {
  order_id: string;
  order_number: string;
  table_number: number;
  customer_name: string;
  items: OrderItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  final_total: number;
  created_at: string;
}

export interface ParcelOrder {
  id: string;
  token_number: string; // e.g. "P-101"
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  packaging_charge: number;
  tax_amount: number;
  final_total: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_status: PaymentStatus;
  cashier_name: string;
  created_at: string;
}

export interface CateringOrder {
  id: string;
  invoice_number: string; // e.g. "CAT-2026-001"
  customer_name: string;
  customer_phone: string;
  event_name: string;
  event_date: string;
  pax_count: number;
  price_per_plate: number;
  menu_summary: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  status: 'ADVANCE_PAID' | 'FULLY_PAID';
  notes?: string;
  cashier_name: string;
  created_at: string;
}

export type InventoryCategory = 'FOOD' | 'GROCERY';
export type InventoryMovementType = 'IN' | 'OUT';

export interface InventoryItem {
  id: string;
  menuItemId?: string;
  isActive?: boolean;
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  category: InventoryCategory;
  type: InventoryMovementType;
  quantity: number;
  unit: string;
  note?: string;
  createdAt: string;
}

