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

export type PricingSection = 'AC' | 'NON_AC';

export interface RestaurantTable {
  id: string;
  table_number: number;
  table_label: string;
  capacity: number;
  section: string;
  pricing_section?: PricingSection;
  is_ac?: boolean;
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
  item_number?: number; // Unique individual dish number / code (e.g. 1, 2, 3...)
  category_id: string;
  name: string;
  description?: string;
  price: number; // Base / Non-AC price for backwards compatibility
  price_non_ac?: number; // Explicit Non-AC price
  price_ac?: number; // Explicit AC price
  ac_price?: number; // Backwards-compatible alias for price_ac
  non_ac_price?: number; // Backwards-compatible alias for price_non_ac
  is_veg: boolean;
  spicy_level: number; // 0: None, 1: Mild, 2: Medium, 3: Spicy
  is_available: boolean;
  is_active?: boolean;
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

export type OrderItemStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  cancel_reason?: string;
  status: OrderItemStatus;
  round_number: number;
  pricing_section?: PricingSection;
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
  section?: string;
  pricing_section?: PricingSection;
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
  section?: string;
  pricing_section?: PricingSection;
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
  section?: string;
  pricing_section?: PricingSection;
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

export type AuditLogType = 'PRICE_CHANGE' | 'WAITER_CANCEL' | 'PURCHASE_CREATED';

export interface PriceChangeAuditEntry {
  id: string;
  type: 'PRICE_CHANGE';
  item_id: string;
  item_name: string;
  item_number?: number;
  changed_by_name: string;
  changed_by_role: string;
  old_price_non_ac: number;
  new_price_non_ac: number;
  old_price_ac: number;
  new_price_ac: number;
  timestamp: string;
}

export interface WaiterCancelAuditEntry {
  id: string;
  type: 'WAITER_CANCEL';
  order_id: string;
  order_number: string;
  table_number?: number;
  customer_name: string;
  item_id: string;
  item_name: string;
  item_number?: number;
  quantity: number;
  unit_price: number;
  total_void_amount: number;
  pricing_section?: PricingSection;
  cancelled_by_name: string;
  cancelled_by_role: string;
  cancel_reason: string;
  timestamp: string;
}

export interface PurchaseAuditEntry {
  id: string;
  type: 'PURCHASE_CREATED';
  ref_number: string;
  item_name: string;
  supplier?: string;
  old_stock: number;
  new_stock: number;
  quantity_added: number;
  user_name: string;
  user_role: string;
  description: string;
  timestamp: string;
}

export type AuditLogEntry = PriceChangeAuditEntry | WaiterCancelAuditEntry | PurchaseAuditEntry;


