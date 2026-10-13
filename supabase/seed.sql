-- ============================================================================
-- Naga Hotel - Realistic Seed Data
-- ============================================================================

-- 1. Staff Users
INSERT INTO staff_users (id, email, full_name, role, pin_code, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@nagahotel.com', 'Ramesh Kumar (Admin)', 'admin', '9999', true),
('22222222-2222-2222-2222-222222222222', 'cashier@nagahotel.com', 'Suresh Raj (Cashier)', 'cashier', '1111', true),
('33333333-3333-3333-3333-333333333333', 'waiter1@nagahotel.com', 'Karthik V (Waiter 1)', 'waiter', '2222', true),
('44444444-4444-4444-4444-444444444444', 'waiter2@nagahotel.com', 'Anitha M (Waiter 2)', 'waiter', '3333', true),
('55555555-5555-5555-5555-555555555555', 'chef@nagahotel.com', 'Chef Velu (Kitchen Head)', 'kitchen', '4444', true)
ON CONFLICT (email) DO NOTHING;

-- 2. Restaurant Tables (Tables 1 - 12)
INSERT INTO restaurant_tables (id, table_number, table_label, capacity, section, status) VALUES
('a0000001-0000-0000-0000-000000000001', 1, 'Table 1', 2, 'Main Dining', 'FREE'),
('a0000002-0000-0000-0000-000000000002', 2, 'Table 2', 4, 'Main Dining', 'FREE'),
('a0000003-0000-0000-0000-000000000003', 3, 'Table 3', 4, 'Main Dining', 'FREE'),
('a0000004-0000-0000-0000-000000000004', 4, 'Table 4', 6, 'Main Dining', 'FREE'),
('a0000005-0000-0000-0000-000000000005', 5, 'Table 5', 2, 'AC Family Hall', 'FREE'),
('a0000006-0000-0000-0000-000000000006', 6, 'Table 6', 4, 'AC Family Hall', 'FREE'),
('a0000007-0000-0000-0000-000000000007', 7, 'Table 7', 6, 'AC Family Hall', 'FREE'),
('a0000008-0000-0000-0000-000000000008', 8, 'Table 8', 8, 'AC Family Hall', 'FREE'),
('a0000009-0000-0000-0000-000000000009', 9, 'Table 9', 4, 'Garden Terrace', 'FREE'),
('a0000010-0000-0000-0000-000000000010', 10, 'Table 10', 4, 'Garden Terrace', 'FREE'),
('a0000011-0000-0000-0000-000000000011', 11, 'Table 11', 6, 'Garden Terrace', 'FREE'),
('a0000012-0000-0000-0000-000000000012', 12, 'Table 12', 2, 'Garden Terrace', 'FREE')
ON CONFLICT (table_number) DO NOTHING;

-- 3. Menu Categories
INSERT INTO menu_categories (id, name, display_order, icon, is_active) VALUES
('c0000001-0000-0000-0000-000000000001', 'Starters & Appetizers', 1, 'Flame', true),
('c0000002-0000-0000-0000-000000000002', 'Biryani & Rice', 2, 'UtensilsCrossed', true),
('c0000003-0000-0000-0000-000000000003', 'Main Course Gravies', 3, 'Soup', true),
('c0000004-0000-0000-0000-000000000004', 'Breads & Parottas', 4, 'Wheat', true),
('c0000005-0000-0000-0000-000000000005', 'South Indian Tiffins', 5, 'Coffee', true),
('c0000006-0000-0000-0000-000000000006', 'Beverages & Juices', 6, 'GlassWater', true),
('c0000007-0000-0000-0000-000000000007', 'Desserts', 7, 'Cake', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, is_veg, spicy_level, is_available) VALUES
-- Starters
('m0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Naga Special Chicken 65', 'Crispy spiced boneless chicken infused with curry leaves and crushed peppercorn', 240.00, false, 2, true),
('m0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'Guntur Paneer Tikka', 'Tandoor grilled cottage cheese marinated in Andhra spice blend', 220.00, true, 2, true),
('m0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'Mutton Chukka Varuval', 'Tender boneless mutton pan-roasted with shallots, black pepper, and curry leaves', 340.00, false, 3, true),
('m0000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'Crispy Golden Corn Salt & Pepper', 'Sweet corn wok tossed with crushed black pepper and scallions', 180.00, true, 1, true),
('m0000005-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', 'Nethili Fish Fry', 'Fresh anchovies coated with stone-ground coastal spices and deep fried crisp', 280.00, false, 2, true),

-- Biryani & Rice
('m0000006-0000-0000-0000-000000000006', 'c0000002-0000-0000-0000-000000000002', 'Naga Signature Mutton Dum Biryani', 'Slow-cooked Seeraga Samba rice with succulent mutton, served with raita and brinjal curry', 360.00, false, 2, true),
('m0000007-0000-0000-0000-000000000007', 'c0000002-0000-0000-0000-000000000002', 'Chettinad Chicken Biryani', 'Fragrant basmati rice cooked with authentic Chettinad spices and tender chicken cuts', 290.00, false, 2, true),
('m0000008-0000-0000-0000-000000000008', 'c0000002-0000-0000-0000-000000000002', 'Shahi Paneer Biryani', 'Layered basmati rice with spiced cottage cheese cubes, caramelized onions, and saffron', 240.00, true, 1, true),
('m0000009-0000-0000-0000-000000000009', 'c0000002-0000-0000-0000-000000000002', 'Egg Biryani (Double Egg)', 'Spiced biryani rice served with two boiled and roasted eggs', 210.00, false, 1, true),

-- Main Course Gravies
('m0000010-0000-0000-0000-000000000010', 'c0000003-0000-0000-0000-000000000003', 'Chettinad Pepper Chicken Gravy', 'Classic country chicken cooked in freshly roasted peppercorn and coconut paste', 290.00, false, 3, true),
('m0000011-0000-0000-0000-000000000011', 'c0000003-0000-0000-0000-000000000003', 'Butter Chicken Masala', 'Charcoal grilled chicken simmered in rich creamy tomato and butter gravy', 310.00, false, 1, true),
('m0000012-0000-0000-0000-000000000012', 'c0000003-0000-0000-0000-000000000003', 'Paneer Butter Masala', 'Tender paneer cubes in velvety cashew-tomato gravy with kasuri methi', 250.00, true, 1, true),
('m0000013-0000-0000-0000-000000000013', 'c0000003-0000-0000-0000-000000000003', 'Madras Fish Curry', 'Fresh fish simmered in tangy shallot, garlic, and tamarind reduction', 320.00, false, 2, true),
('m0000014-0000-0000-0000-000000000014', 'c0000003-0000-0000-0000-000000000003', 'Dal Tadka Special', 'Yellow lentils tempered with cumin, garlic, and desi ghee', 180.00, true, 1, true),

-- Breads & Parottas
('m0000015-0000-0000-0000-000000000015', 'c0000004-0000-0000-0000-000000000004', 'Malabar Flaky Parotta (2 pcs)', 'Multi-layered crispy and soft Kerala style tawa parotta', 65.00, true, 0, true),
('m0000016-0000-0000-0000-000000000016', 'c0000004-0000-0000-0000-000000000004', 'Butter Garlic Naan', 'Tandoori refined flour bread glazed with garlic and butter', 75.00, true, 0, true),
('m0000017-0000-0000-0000-000000000017', 'c0000004-0000-0000-0000-000000000004', 'Kothu Parotta (Chicken)', 'Shredded parotta beaten on hot griddle with eggs, chicken, and salna', 230.00, false, 2, true),
('m0000018-0000-0000-0000-000000000018', 'c0000004-0000-0000-0000-000000000004', 'Tandoori Roti (Butter)', 'Whole wheat unleavened bread baked in clay oven', 45.00, true, 0, true),

-- South Indian Tiffins
('m0000019-0000-0000-0000-000000000019', 'c0000005-0000-0000-0000-000000000005', 'Ghee Roast Dosa', 'Crisp golden crepe smeared with pure aromatic cow ghee, served with 3 chutneys & sambar', 110.00, true, 0, true),
('m0000020-0000-0000-0000-000000000020', 'c0000005-0000-0000-0000-000000000005', 'Kari Dosa (Mutton Special)', 'Thick sponge dosa topped with spicy egg layer and shredded tender mutton chukka', 280.00, false, 2, true),
('m0000021-0000-0000-0000-000000000021', 'c0000005-0000-0000-0000-000000000005', 'Steamed Button Idli (14 pcs)', 'Mini rice cakes dipped in piping hot drumstick sambar with ghee drop', 90.00, true, 0, true),

-- Beverages
('m0000022-0000-0000-0000-000000000022', 'c0000006-0000-0000-0000-000000000006', 'Filter Coffee (Degree)', 'Traditional Kumbakonam chicory filter coffee served in brass davarah', 45.00, true, 0, true),
('m0000023-0000-0000-0000-000000000023', 'c0000006-0000-0000-0000-000000000006', 'Jigarthanda Special', 'Madurai chilled dessert drink with almond gum, nannari syrup, basundi and ice cream', 95.00, true, 0, true),
('m0000024-0000-0000-0000-000000000024', 'c0000006-0000-0000-0000-000000000006', 'Fresh Lime Soda (Sweet & Salt)', 'Carbonated fresh lemon juice with mint sprig', 60.00, true, 0, true),

-- Desserts
('m0000025-0000-0000-0000-000000000025', 'c0000007-0000-0000-0000-000000000007', 'Elaneer Payasam', 'Chilled tender coconut pudding made with condensed milk and coconut slivers', 120.00, true, 0, true),
('m0000026-0000-0000-0000-000000000026', 'c0000007-0000-0000-0000-000000000007', 'Gulab Jamun with Ice Cream', 'Warm milk dumplings soaked in cardamom syrup with Madagascar vanilla ice cream', 110.00, true, 0, true)
ON CONFLICT (id) DO NOTHING;
