-- ============================================================================
-- Naga Hotel - Complete Restaurant Management System
-- Supabase Schema & Initial Database Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Staff Users & Roles
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'waiter', 'kitchen')),
    pin_code TEXT NOT NULL DEFAULT '1234',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number INTEGER UNIQUE NOT NULL,
    table_label TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    section TEXT NOT NULL DEFAULT 'Main Dining',
    pricing_section TEXT NOT NULL DEFAULT 'NON_AC' CHECK (pricing_section IN ('AC', 'NON_AC')),
    is_ac BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'FREE' CHECK (status IN ('FREE', 'OCCUPIED', 'BILL_REQUESTED')),
    active_order_id UUID,
    current_customer_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    price_non_ac NUMERIC(10, 2) CHECK (price_non_ac >= 0),
    price_ac NUMERIC(10, 2) CHECK (price_ac >= 0),
    is_veg BOOLEAN NOT NULL DEFAULT true,
    spicy_level INTEGER NOT NULL DEFAULT 1 CHECK (spicy_level BETWEEN 0 AND 3),
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Customer Sessions (Tracks table dining lifecycle)
CREATE TABLE IF NOT EXISTS customer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES restaurant_tables(id),
    customer_name TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    waiter_id UUID REFERENCES staff_users(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    table_id UUID NOT NULL REFERENCES restaurant_tables(id),
    session_id UUID REFERENCES customer_sessions(id),
    waiter_id UUID REFERENCES staff_users(id),
    customer_name TEXT NOT NULL,
    table_number INTEGER NOT NULL,
    section TEXT,
    pricing_section TEXT NOT NULL DEFAULT 'NON_AC' CHECK (pricing_section IN ('AC', 'NON_AC')),
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'PREPARING', 'READY', 'SERVED', 'BILL_REQUESTED', 'PAID', 'CANCELLED')
    ),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- 5% GST (2.5% CGST + 2.5% SGST)
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Add foreign key constraint for active_order_id in restaurant_tables
ALTER TABLE restaurant_tables 
    ADD CONSTRAINT fk_table_active_order 
    FOREIGN KEY (active_order_id) 
    REFERENCES orders(id) 
    ON DELETE SET NULL;

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    special_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'PREPARING', 'READY', 'SERVED')
    ),
    round_number INTEGER NOT NULL DEFAULT 1,
    pricing_section TEXT CHECK (pricing_section IN ('AC', 'NON_AC')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payments (Immutable billing history)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    order_number TEXT NOT NULL,
    table_number INTEGER NOT NULL,
    section TEXT,
    pricing_section TEXT DEFAULT 'NON_AC',
    customer_name TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'CARD')),
    payment_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (payment_status IN ('COMPLETED', 'FAILED')),
    cashier_id UUID REFERENCES staff_users(id),
    cashier_name TEXT NOT NULL DEFAULT 'Front Desk Cashier',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for High Performance Real-time Lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- ============================================================================
-- Database Functions & Triggers
-- ============================================================================

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_users_timestamp
BEFORE UPDATE ON staff_users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_restaurant_tables_timestamp
BEFORE UPDATE ON restaurant_tables
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_menu_items_timestamp
BEFORE UPDATE ON menu_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_order_items_timestamp
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Function to safely recalculate order total
CREATE OR REPLACE FUNCTION recalculate_order_totals(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal NUMERIC(10, 2);
    v_tax_rate NUMERIC(5, 2);
    v_tax_amount NUMERIC(10, 2);
    v_discount NUMERIC(10, 2);
    v_final NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0.00) INTO v_subtotal
    FROM order_items
    WHERE order_id = p_order_id;

    SELECT tax_rate, discount_amount INTO v_tax_rate, v_discount
    FROM orders
    WHERE id = p_order_id;

    v_tax_amount := ROUND((v_subtotal * (COALESCE(v_tax_rate, 5.00) / 100.0)), 2);
    v_final := GREATEST(0.00, v_subtotal + v_tax_amount - COALESCE(v_discount, 0.00));

    UPDATE orders
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        final_total = v_final,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate order totals when items are added/modified
CREATE OR REPLACE FUNCTION trigger_recalc_order_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM recalculate_order_totals(OLD.order_id);
    ELSE
        PERFORM recalculate_order_totals(NEW.order_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_order_item_change
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_order_on_item_change();

-- ============================================================================
-- Atomic Stored Procedure: Payment Confirmation and Table Release
-- ============================================================================
CREATE OR REPLACE FUNCTION process_payment_and_free_table(
    p_order_id UUID,
    p_payment_method TEXT,
    p_payment_reference TEXT DEFAULT NULL,
    p_cashier_id UUID DEFAULT NULL,
    p_cashier_name TEXT DEFAULT 'Front Desk Cashier',
    p_discount NUMERIC(10, 2) DEFAULT 0.00
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_table_id UUID;
    v_subtotal NUMERIC(10, 2);
    v_tax NUMERIC(10, 2);
    v_final NUMERIC(10, 2);
    v_payment_id UUID;
BEGIN
    -- 1. Fetch and Lock Order for update
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with ID % does not exist', p_order_id;
    END IF;

    IF v_order.status = 'PAID' THEN
        RAISE EXCEPTION 'Order % is already paid and closed', v_order.order_number;
    END IF;

    v_table_id := v_order.table_id;

    -- Recalculate with any cashier discount
    SELECT COALESCE(SUM(total_price), 0.00) INTO v_subtotal
    FROM order_items
    WHERE order_id = p_order_id;

    v_tax := ROUND((v_subtotal * (v_order.tax_rate / 100.0)), 2);
    v_final := GREATEST(0.00, v_subtotal + v_tax - COALESCE(p_discount, 0.00));

    -- 2. Insert Payment Record
    INSERT INTO payments (
        order_id,
        order_number,
        table_number,
        section,
        pricing_section,
        customer_name,
        subtotal,
        tax_amount,
        discount_amount,
        final_total,
        payment_method,
        payment_reference,
        payment_status,
        cashier_id,
        cashier_name
    ) VALUES (
        p_order_id,
        v_order.order_number,
        v_order.table_number,
        v_order.section,
        COALESCE(v_order.pricing_section, 'NON_AC'),
        v_order.customer_name,
        v_subtotal,
        v_tax,
        COALESCE(p_discount, 0.00),
        v_final,
        p_payment_method,
        p_payment_reference,
        'COMPLETED',
        p_cashier_id,
        p_cashier_name
    ) RETURNING id INTO v_payment_id;

    -- 3. Close the Order
    UPDATE orders
    SET status = 'PAID',
        discount_amount = COALESCE(p_discount, 0.00),
        subtotal = v_subtotal,
        tax_amount = v_tax,
        final_total = v_final,
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 4. Complete Customer Session if linked
    IF v_order.session_id IS NOT NULL THEN
        UPDATE customer_sessions
        SET status = 'COMPLETED',
            ended_at = NOW()
        WHERE id = v_order.session_id;
    END IF;

    -- 5. Atomically Release Table to FREE & Clear active order reference
    UPDATE restaurant_tables
    SET status = 'FREE',
        active_order_id = NULL,
        current_customer_name = NULL,
        updated_at = NOW()
    WHERE id = v_table_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'table_id', v_table_id,
        'table_number', v_order.table_number,
        'final_total', v_final,
        'closed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated users and anon demo access
CREATE POLICY "Public Read Tables" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Public Update Tables" ON restaurant_tables FOR ALL USING (true);

CREATE POLICY "Public Read Categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public All Categories" ON menu_categories FOR ALL USING (true);

CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public All Menu" ON menu_items FOR ALL USING (true);

CREATE POLICY "Public All Sessions" ON customer_sessions FOR ALL USING (true);
CREATE POLICY "Public All Orders" ON orders FOR ALL USING (true);
CREATE POLICY "Public All Order Items" ON order_items FOR ALL USING (true);
CREATE POLICY "Public All Payments" ON payments FOR ALL USING (true);
CREATE POLICY "Public All Staff" ON staff_users FOR ALL USING (true);

-- Enable Supabase Realtime Publication for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
