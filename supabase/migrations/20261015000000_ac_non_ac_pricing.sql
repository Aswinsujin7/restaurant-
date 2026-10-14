-- ============================================================================
-- Migration: 20261015000000_ac_non_ac_pricing.sql
-- Description: Add separate AC and Non-AC pricing for every menu product,
-- table section assignment, order pricing section snapshot, and safe backfill.
-- ============================================================================

-- 1. Update menu_items with AC and Non-AC price columns and active status
ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS price_non_ac NUMERIC(10, 2) CHECK (price_non_ac >= 0),
    ADD COLUMN IF NOT EXISTS price_ac NUMERIC(10, 2) CHECK (price_ac >= 0),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Safe controlled backfill: preserve existing prices without inventing arbitrary prices
UPDATE menu_items
SET price_non_ac = price
WHERE price_non_ac IS NULL;

UPDATE menu_items
SET price_ac = price
WHERE price_ac IS NULL;

-- 2. Update restaurant_tables with pricing_section and is_ac flag
ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS pricing_section TEXT NOT NULL DEFAULT 'NON_AC' CHECK (pricing_section IN ('AC', 'NON_AC')),
    ADD COLUMN IF NOT EXISTS is_ac BOOLEAN NOT NULL DEFAULT false;

-- Backfill based on existing section names
UPDATE restaurant_tables
SET pricing_section = 'AC', is_ac = true
WHERE section ILIKE '%ac%';

UPDATE restaurant_tables
SET pricing_section = 'NON_AC', is_ac = false
WHERE NOT (section ILIKE '%ac%');

-- 3. Update orders to store section and pricing_section snapshot
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS section TEXT,
    ADD COLUMN IF NOT EXISTS pricing_section TEXT NOT NULL DEFAULT 'NON_AC' CHECK (pricing_section IN ('AC', 'NON_AC'));

-- 4. Update order_items to snapshot the pricing section applied
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS pricing_section TEXT CHECK (pricing_section IN ('AC', 'NON_AC'));

-- 5. Update payments to store section and pricing_section
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS section TEXT,
    ADD COLUMN IF NOT EXISTS pricing_section TEXT DEFAULT 'NON_AC';

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_pricing_section ON restaurant_tables(pricing_section);
CREATE INDEX IF NOT EXISTS idx_orders_pricing_section ON orders(pricing_section);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);

-- 7. Update process_payment_and_free_table to snapshot order section into payments
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

    -- 2. Insert Payment Record with section information
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
        'section', v_order.section,
        'pricing_section', v_order.pricing_section,
        'final_total', v_final,
        'closed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;
