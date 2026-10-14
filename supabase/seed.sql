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

-- 2. Restaurant Tables (6 AC Tables: T1-T6, 6 Non-AC Tables: T7-T12)
INSERT INTO restaurant_tables (id, table_number, table_label, capacity, section, pricing_section, is_ac, status) VALUES
('a0000001-0000-0000-0000-000000000001', 1, 'Table 1', 2, 'AC Dining', 'AC', true, 'FREE'),
('a0000002-0000-0000-0000-000000000002', 2, 'Table 2', 4, 'AC Dining', 'AC', true, 'FREE'),
('a0000003-0000-0000-0000-000000000003', 3, 'Table 3', 4, 'AC Dining', 'AC', true, 'FREE'),
('a0000004-0000-0000-0000-000000000004', 4, 'Table 4', 6, 'AC Dining', 'AC', true, 'FREE'),
('a0000005-0000-0000-0000-000000000005', 5, 'Table 5', 2, 'AC Dining', 'AC', true, 'FREE'),
('a0000006-0000-0000-0000-000000000006', 6, 'Table 6', 4, 'AC Dining', 'AC', true, 'FREE'),
('a0000007-0000-0000-0000-000000000007', 7, 'Table 7', 6, 'Non-AC Dining', 'NON_AC', false, 'FREE'),
('a0000008-0000-0000-0000-000000000008', 8, 'Table 8', 8, 'Non-AC Dining', 'NON_AC', false, 'FREE'),
('a0000009-0000-0000-0000-000000000009', 9, 'Table 9', 4, 'Non-AC Dining', 'NON_AC', false, 'FREE'),
('a0000010-0000-0000-0000-000000000010', 10, 'Table 10', 4, 'Non-AC Dining', 'NON_AC', false, 'FREE'),
('a0000011-0000-0000-0000-000000000011', 11, 'Table 11', 6, 'Non-AC Dining', 'NON_AC', false, 'FREE'),
('a0000012-0000-0000-0000-000000000012', 12, 'Table 12', 2, 'Non-AC Dining', 'NON_AC', false, 'FREE')
ON CONFLICT (table_number) DO UPDATE SET
  section = EXCLUDED.section,
  pricing_section = EXCLUDED.pricing_section,
  is_ac = EXCLUDED.is_ac;

-- 3. Menu Categories
INSERT INTO menu_categories (id, name, display_order, icon, is_active) VALUES
('cat-chinese', 'Chinese', 1, 'Utensils', true),
('cat-south-indian', 'South Indian', 2, 'Coffee', true),
('cat-north-indian', 'North Indian', 3, 'Soup', true),
('cat-biryani', 'Biryani & Rice', 4, 'Flame', true),
('cat-beverages', 'Beverages & Desserts', 5, 'GlassWater', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, price_non_ac, price_ac, is_veg, spicy_level, is_available, is_active) VALUES
-- Chinese
('m0000004-0000-0000-0000-000000000004', 'cat-chinese', 'Crispy Golden Corn Salt & Pepper', 'Sweet corn wok tossed with crushed black pepper, garlic, and spring onions', 180.00, 180.00, 200.00, true, 1, true, true),
('m0000032-0000-0000-0000-000000000032', 'cat-chinese', 'Chilli Chicken Dry', 'Crispy fried chicken wok-tossed with green chillies, bell peppers, and dark soy', 250.00, 250.00, 280.00, false, 2, true, true),
('m0000033-0000-0000-0000-000000000033', 'cat-chinese', 'Dragon Chicken (Crispy Spiced)', 'Batter-fried chicken strips glazed in fiery red sauce with cashew nuts', 270.00, 270.00, 300.00, false, 3, true, true),
('m0000034-0000-0000-0000-000000000034', 'cat-chinese', 'Gobi Manchurian Dry', 'Crispy cauliflower florets coated with tangy Indo-Chinese Manchurian glaze', 190.00, 190.00, 210.00, true, 1, true, true),
('m0000035-0000-0000-0000-000000000035', 'cat-chinese', 'Chicken Schezwan Fried Rice', 'Fragrant wok-fried basmati rice tossed with shredded chicken, egg, and spicy Schezwan sauce', 240.00, 240.00, 270.00, false, 2, true, true),
('m0000036-0000-0000-0000-000000000036', 'cat-chinese', 'Veg Hakka Noodles', 'Stir-fried noodles with crisp julienned vegetables and light soy seasoning', 180.00, 180.00, 200.00, true, 1, true, true),
('m0000037-0000-0000-0000-000000000037', 'cat-chinese', 'Paneer Chilli Wok Tossed', 'Cottage cheese cubes tossed with capsicum, onion, and oriental spicy chilli sauce', 230.00, 230.00, 260.00, true, 2, true, true),
('m0000038-0000-0000-0000-000000000038', 'cat-chinese', 'Schezwan Chicken Noodles', 'Spicy wok tossed noodles with chicken cuts and authentic Schezwan pepper relish', 250.00, 250.00, 280.00, false, 3, true, true),

-- South Indian
('m0000001-0000-0000-0000-000000000001', 'cat-south-indian', 'Naga Special Chicken 65', 'Crispy spiced boneless chicken infused with curry leaves and crushed peppercorn', 240.00, 240.00, 265.00, false, 2, true, true),
('m0000003-0000-0000-0000-000000000003', 'cat-south-indian', 'Mutton Chukka Varuval', 'Tender boneless mutton pan-roasted with shallots, black pepper, and curry leaves', 340.00, 340.00, 380.00, false, 3, true, true),
('m0000005-0000-0000-0000-000000000005', 'cat-south-indian', 'Nethili Fish Fry', 'Fresh anchovies coated with stone-ground coastal spices and deep fried crisp', 280.00, 280.00, 310.00, false, 2, true, true),
('m0000010-0000-0000-0000-000000000010', 'cat-south-indian', 'Chettinad Pepper Chicken Gravy', 'Classic country chicken cooked in freshly roasted peppercorn and coconut paste', 290.00, 290.00, 320.00, false, 3, true, true),
('m0000013-0000-0000-0000-000000000013', 'cat-south-indian', 'Madras Fish Curry', 'Fresh coastal fish simmered in tangy shallot, garlic, and tamarind reduction', 320.00, 320.00, 360.00, false, 2, true, true),
('m0000015-0000-0000-0000-000000000015', 'cat-south-indian', 'Malabar Flaky Parotta (2 pcs)', 'Multi-layered crispy and soft Kerala style tawa parotta', 20.00, 20.00, 25.00, true, 0, true, true),
('m0000017-0000-0000-0000-000000000017', 'cat-south-indian', 'Kothu Parotta (Chicken)', 'Shredded parotta beaten on hot griddle with eggs, chicken, and spicy salna', 230.00, 230.00, 260.00, false, 2, true, true),
('m0000019-0000-0000-0000-000000000019', 'cat-south-indian', 'Ghee Roast Dosa', 'Crisp golden crepe smeared with pure aromatic cow ghee, served with 3 chutneys & sambar', 110.00, 110.00, 125.00, true, 0, true, true),
('m0000020-0000-0000-0000-000000000020', 'cat-south-indian', 'Kari Dosa (Mutton Special)', 'Thick sponge dosa topped with spicy egg layer and shredded tender mutton chukka', 280.00, 280.00, 310.00, false, 2, true, true),
('m0000021-0000-0000-0000-000000000021', 'cat-south-indian', 'Steamed Button Idli (14 pcs)', 'Mini rice cakes dipped in piping hot drumstick sambar with ghee drop', 90.00, 90.00, 100.00, true, 0, true, true),

-- North Indian
('m0000002-0000-0000-0000-000000000002', 'cat-north-indian', 'Guntur Paneer Tikka', 'Tandoor grilled cottage cheese marinated in spiced curd and herbs', 220.00, 220.00, 245.00, true, 2, true, true),
('m0000011-0000-0000-0000-000000000011', 'cat-north-indian', 'Butter Chicken Masala', 'Charcoal grilled chicken simmered in rich creamy tomato and butter gravy', 310.00, 310.00, 350.00, false, 1, true, true),
('m0000012-0000-0000-0000-000000000012', 'cat-north-indian', 'Paneer Butter Masala', 'Tender paneer cubes in velvety cashew-tomato gravy with kasuri methi', 250.00, 250.00, 280.00, true, 1, true, true),
('m0000014-0000-0000-0000-000000000014', 'cat-north-indian', 'Dal Tadka Special', 'Yellow lentils tempered with cumin, garlic, and desi ghee', 180.00, 180.00, 200.00, true, 1, true, true),
('m0000016-0000-0000-0000-000000000016', 'cat-north-indian', 'Butter Garlic Naan', 'Tandoori refined flour bread glazed with minced garlic and butter', 75.00, 75.00, 85.00, true, 0, true, true),
('m0000018-0000-0000-0000-000000000018', 'cat-north-indian', 'Tandoori Roti (Butter)', 'Whole wheat unleavened bread baked fresh in clay tandoor', 45.00, 45.00, 50.00, true, 0, true, true),
('m0000030-0000-0000-0000-000000000030', 'cat-north-indian', 'Kadai Paneer Special', 'Paneer cooked in thick spicy gravy with freshly ground coriander and bell peppers', 260.00, 260.00, 290.00, true, 2, true, true),

-- Biryani & Rice
('m0000006-0000-0000-0000-000000000006', 'cat-biryani', 'Naga Signature Mutton Dum Biryani', 'Slow-cooked Seeraga Samba rice with succulent mutton, served with raita & brinjal', 360.00, 360.00, 395.00, false, 2, true, true),
('m0000007-0000-0000-0000-000000000007', 'cat-biryani', 'Chettinad Chicken Biryani', 'Fragrant basmati rice cooked with authentic Chettinad spices and tender chicken cuts', 200.00, 200.00, 220.00, false, 2, true, true),
('m0000008-0000-0000-0000-000000000008', 'cat-biryani', 'Shahi Paneer Biryani', 'Layered basmati rice with spiced cottage cheese cubes, caramelized onions, & saffron', 240.00, 240.00, 270.00, true, 1, true, true),
('m0000009-0000-0000-0000-000000000009', 'cat-biryani', 'Egg Biryani (Double Egg)', 'Spiced biryani rice served with two boiled and roasted eggs', 210.00, 210.00, 230.00, false, 1, true, true),

-- Beverages & Desserts
('m0000022-0000-0000-0000-000000000022', 'cat-beverages', 'Filter Coffee (Degree)', 'Traditional Kumbakonam chicory filter coffee served in brass davarah', 45.00, 45.00, 50.00, true, 0, true, true),
('m0000023-0000-0000-0000-000000000023', 'cat-beverages', 'Jigarthanda Special', 'Madurai chilled dessert drink with almond gum, nannari syrup, basundi & ice cream', 95.00, 95.00, 105.00, true, 0, true, true),
('m0000024-0000-0000-0000-000000000024', 'cat-beverages', 'Fresh Lime Soda (Sweet & Salt)', 'Carbonated fresh lemon juice with mint sprig', 60.00, 60.00, 70.00, true, 0, true, true),
('m0000025-0000-0000-0000-000000000025', 'cat-beverages', 'Elaneer Payasam', 'Chilled tender coconut pudding made with condensed milk and coconut slivers', 120.00, 120.00, 135.00, true, 0, true, true),
('m0000026-0000-0000-0000-000000000026', 'cat-beverages', 'Gulab Jamun with Ice Cream', 'Warm milk dumplings soaked in cardamom syrup with Madagascar vanilla ice cream', 110.00, 110.00, 125.00, true, 0, true, true)
ON CONFLICT (id) DO NOTHING;
