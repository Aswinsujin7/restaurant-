// ============================================================================
// Naga Hotel - End-to-End Restaurant Workflow Automated Test Suite
// ============================================================================

import assert from 'node:assert';
import { restaurantStore } from '../src/lib/store/restaurant-store';
import { getMenuItemNumber, searchMenuItems } from '../src/components/MenuItemSearch';

async function runWorkflowTests() {
  console.log('------------------------------------------------------------');
  console.log('🚀 Running Naga Hotel RMS Workflow Verification Test Suite');
  console.log('------------------------------------------------------------\n');

  // Reset to clean demo state
  restaurantStore.resetToDemo();
  const initialState = restaurantStore.getState();

  // Test 1: Verify initial state
  console.log('✓ Test 1: Verifying initial table and catalog state...');
  const table1 = initialState.tables.find((t) => t.table_number === 1);
  assert.ok(table1, 'Table 1 must exist');
  assert.strictEqual(table1.status, 'FREE', 'Table 1 should initially be FREE');
  assert.strictEqual(table1.active_order_id, null, 'Table 1 should have no active order');
  console.log('  -> Passed: Table 1 is FREE and ready for guests.\n');

  // Test 2: Double-assignment protection
  console.log('✓ Test 2: Verifying occupied table assignment guard...');
  const table3 = initialState.tables.find((t) => t.table_number === 3);
  assert.ok(table3, 'Table 3 must exist');
  assert.notStrictEqual(table3.status, 'FREE', 'Table 3 should already be occupied in seed');

  const invalidAssignResult = restaurantStore.assignTable(
    table3.id,
    'Intruder Guest',
    2,
    'waiter-test'
  );
  assert.strictEqual(invalidAssignResult.success, false, 'Assigning occupied table must fail');
  assert.ok(
    invalidAssignResult.error?.includes('already occupied'),
    'Error message must indicate table is already occupied'
  );
  console.log('  -> Passed: System correctly rejects assigning an already occupied table.\n');

  // Test 3: Waiter assigns Table 1 for Mr. Arvind
  console.log('✓ Test 3: Waiter assigns Table 1 (Customer: Mr. Arvind, Guests: 3)...');
  const assignResult = restaurantStore.assignTable(
    table1.id,
    'Mr. Arvind',
    3,
    '33333333-3333-3333-3333-333333333333'
  );
  assert.strictEqual(assignResult.success, true, 'Table 1 assignment must succeed');
  assert.ok(assignResult.orderId, 'A unique order ID must be generated');

  const order1Id = assignResult.orderId!;
  const stateAfterAssign = restaurantStore.getState();
  const updatedTable1 = stateAfterAssign.tables.find((t) => t.id === table1.id)!;
  assert.strictEqual(updatedTable1.status, 'OCCUPIED', 'Table 1 status must be OCCUPIED');
  assert.strictEqual(updatedTable1.current_customer_name, 'Mr. Arvind', 'Customer name must be set');
  assert.strictEqual(updatedTable1.active_order_id, order1Id, 'Active order ID must link to order');

  const order1 = stateAfterAssign.orders.find((o) => o.id === order1Id)!;
  assert.ok(order1, 'Order record must be present in orders list');
  assert.strictEqual(order1.customer_name, 'Mr. Arvind');
  assert.strictEqual(order1.status, 'NEW');
  assert.strictEqual(order1.subtotal, 0);
  assert.strictEqual(order1.items.length, 0);
  console.log(`  -> Passed: Unique Order ID ${order1.id} created with number ${order1.order_number}.\n`);

  // Test 4: Submit Round 1 KOT Items
  console.log('✓ Test 4: Waiter submits Round 1 KOT food items...');
  const biryaniItem = stateAfterAssign.menuItems.find((m) =>
    m.name.includes('Mutton Dum Biryani')
  )!;
  const chicken65Item = stateAfterAssign.menuItems.find((m) =>
    m.name.includes('Chicken 65')
  )!;

  const addItemsResult = restaurantStore.addItemsToOrder(order1Id, [
    { menuItemId: biryaniItem.id, quantity: 2, specialInstructions: 'Medium spicy' },
    { menuItemId: chicken65Item.id, quantity: 1, specialInstructions: 'Crispy' },
  ]);
  assert.strictEqual(addItemsResult.success, true, 'Submitting items must succeed');

  const stateAfterItems = restaurantStore.getState();
  const orderWithItems = stateAfterItems.orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(orderWithItems.items.length, 2, 'Should have 2 order items');

  const expectedSubtotal = biryaniItem.price * 2 + chicken65Item.price * 1;
  const expectedTax = Number(((expectedSubtotal * 5) / 100).toFixed(2));
  const expectedTotal = expectedSubtotal + expectedTax;

  assert.strictEqual(orderWithItems.subtotal, expectedSubtotal, `Subtotal must be ₹${expectedSubtotal}`);
  assert.strictEqual(orderWithItems.tax_amount, expectedTax, `Tax must be ₹${expectedTax}`);
  assert.strictEqual(orderWithItems.final_total, expectedTotal, `Final total must be ₹${expectedTotal}`);
  assert.strictEqual(orderWithItems.items[0].round_number, 1, 'First batch must be round 1');
  console.log(`  -> Passed: Round 1 items added. Subtotal: ₹${orderWithItems.subtotal}, Tax: ₹${orderWithItems.tax_amount}, Total: ₹${orderWithItems.final_total}.\n`);

  // Test 5: Submit Round 2 Extra Items to the same active order
  console.log('✓ Test 5: Waiter adds extra items (Round 2 KOT)...');
  const dessertItem = stateAfterAssign.menuItems.find((m) =>
    m.name.includes('Jigarthanda')
  )!;

  const addExtraResult = restaurantStore.addItemsToOrder(order1Id, [
    { menuItemId: dessertItem.id, quantity: 2, specialInstructions: 'Chilled' },
  ]);
  assert.strictEqual(addExtraResult.success, true, 'Submitting extra items must succeed');

  const stateAfterRound2 = restaurantStore.getState();
  const orderRound2 = stateAfterRound2.orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(orderRound2.items.length, 3, 'Should now have 3 items total');

  const round2Item = orderRound2.items.find((i) => i.menu_item_id === dessertItem.id)!;
  assert.strictEqual(round2Item.round_number, 2, 'Extra items must be marked round 2');
  console.log('  -> Passed: Extra item added as Round 2 without disrupting active order.\n');

  // Test 6: Kitchen Preparation Workflow
  console.log('✓ Test 6: Kitchen updates status (NEW -> PREPARING -> READY -> SERVED)...');
  const firstItemId = orderRound2.items[0].id;

  // Item prep
  restaurantStore.updateOrderItemStatus(order1Id, firstItemId, 'PREPARING');
  let orderInPrep = restaurantStore.getState().orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(orderInPrep.status, 'PREPARING', 'Order should transition to PREPARING');

  // Whole ticket marked READY by kitchen
  restaurantStore.updateTicketStatus(order1Id, 'READY');
  let orderReady = restaurantStore.getState().orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(orderReady.status, 'READY', 'Order status should be READY');
  assert.ok(
    orderReady.items.every((i) => i.status === 'READY'),
    'All items should be marked READY'
  );

  // Waiter marks SERVED
  restaurantStore.updateTicketStatus(order1Id, 'SERVED');
  let orderServed = restaurantStore.getState().orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(orderServed.status, 'SERVED', 'Order status should be SERVED');
  console.log('  -> Passed: Kitchen and Waiter status transitions completed seamlessly.\n');

  // Test 7: Waiter requests bill
  console.log('✓ Test 7: Waiter requests bill when dining finishes...');
  const billReqResult = restaurantStore.requestBill(order1Id);
  assert.strictEqual(billReqResult.success, true, 'Requesting bill must succeed');

  const stateAfterBillReq = restaurantStore.getState();
  const orderBillReq = stateAfterBillReq.orders.find((o) => o.id === order1Id)!;
  const table1BillReq = stateAfterBillReq.tables.find((t) => t.id === table1.id)!;

  assert.strictEqual(orderBillReq.status, 'BILL_REQUESTED', 'Order status must be BILL_REQUESTED');
  assert.strictEqual(table1BillReq.status, 'BILL_REQUESTED', 'Table status must be BILL_REQUESTED');
  assert.notStrictEqual(table1BillReq.status, 'FREE', 'Table MUST NOT become FREE merely on bill request!');
  console.log('  -> Passed: Bill requested. Table status is BILL_REQUESTED (remains occupied until paid).\n');

  // Test 8: Cashier completes payment and table is released
  console.log('✓ Test 8: Cashier settles payment via UPI and table is freed...');
  const paymentResult = restaurantStore.processPayment(order1Id, {
    paymentMethod: 'UPI',
    paymentReference: 'UPI-TEST-88492019',
    discountAmount: 0,
    cashierName: 'Suresh Raj (Cashier)',
  });

  assert.strictEqual(paymentResult.success, true, 'Payment processing must succeed');
  assert.ok(paymentResult.payment, 'Payment record must be created');
  assert.strictEqual(paymentResult.payment?.payment_status, 'COMPLETED');
  assert.strictEqual(paymentResult.payment?.payment_method, 'UPI');

  const stateAfterPayment = restaurantStore.getState();
  const closedOrder = stateAfterPayment.orders.find((o) => o.id === order1Id)!;
  assert.strictEqual(closedOrder.status, 'PAID', 'Order must be closed with status PAID');
  assert.ok(closedOrder.closed_at, 'Order must have a closed_at timestamp');

  // CRITICAL: Table 1 must be immediately FREE
  const table1AfterPay = stateAfterPayment.tables.find((t) => t.id === table1.id)!;
  assert.strictEqual(table1AfterPay.status, 'FREE', 'Table 1 status must immediately be FREE');
  assert.strictEqual(table1AfterPay.active_order_id, null, 'Table 1 active_order_id must be cleared (null)');
  assert.strictEqual(table1AfterPay.current_customer_name, null, 'Table 1 customer name must be cleared (null)');

  // Billing history must contain the payment
  const historyPayment = stateAfterPayment.payments.find((p) => p.order_id === order1Id);
  assert.ok(historyPayment, 'Payment must be preserved in billing history');
  console.log('  -> Passed: Payment recorded, order closed, table freed and cleared.\n');

  // Test 9: Next customer receives a FRESH, isolated order on Table 1
  console.log('✓ Test 9: Next customer receives fresh order on Table 1 (No data leaks)...');
  const nextAssignResult = restaurantStore.assignTable(
    table1.id,
    'Mrs. Priya',
    2,
    '44444444-4444-4444-4444-444444444444'
  );
  assert.strictEqual(nextAssignResult.success, true, 'Next customer assignment must succeed');
  assert.ok(nextAssignResult.orderId, 'Must generate new unique order ID');
  assert.notStrictEqual(
    nextAssignResult.orderId,
    order1Id,
    'CRITICAL: New order ID must not be identical to previous order ID'
  );

  const stateFinal = restaurantStore.getState();
  const freshOrder = stateFinal.orders.find((o) => o.id === nextAssignResult.orderId)!;
  const table1New = stateFinal.tables.find((t) => t.id === table1.id)!;

  assert.strictEqual(table1New.status, 'OCCUPIED');
  assert.strictEqual(table1New.current_customer_name, 'Mrs. Priya');
  assert.strictEqual(table1New.guest_count, 2);

  assert.strictEqual(freshOrder.customer_name, 'Mrs. Priya');
  assert.strictEqual(freshOrder.items.length, 0, 'New order must have 0 items (clean slate)');
  assert.strictEqual(freshOrder.subtotal, 0, 'New order subtotal must start at 0');
  assert.strictEqual(freshOrder.final_total, 0, 'New order final total must start at 0');
  assert.strictEqual(freshOrder.status, 'NEW');

  console.log(`  -> Passed: Fresh order ${freshOrder.order_number} initialized with zero items for Mrs. Priya.\n`);

  // Test 10: Cashier creates Category B Parcel Bill
  console.log('✓ Test 10: Cashier generates Category B Parcel Bill with Token...');
  const parcelResult = restaurantStore.createParcelOrder({
    customerName: 'Karthi Rajan',
    customerPhone: '98840 99887',
    items: [
      { menuItemId: initialState.menuItems[0].id, quantity: 2 },
      { menuItemId: initialState.menuItems[1].id, quantity: 1 },
    ],
    packagingCharge: 25,
    paymentMethod: 'UPI',
  });
  assert.strictEqual(parcelResult.success, true, 'Parcel order creation must succeed');
  assert.ok(parcelResult.parcel, 'Parcel record must be created');
  assert.ok(parcelResult.parcel.token_number.startsWith('P-'), 'Token number must start with P-');
  assert.strictEqual(parcelResult.parcel.customer_name, 'Karthi Rajan');
  assert.strictEqual(parcelResult.parcel.packaging_charge, 25);
  assert.strictEqual(parcelResult.parcel.payment_status, 'COMPLETED');
  console.log(`  -> Passed: Parcel Token #${parcelResult.parcel.token_number} generated. Total: ₹${parcelResult.parcel.final_total}.\n`);

  // Test 11: Cashier creates Category C Catering Contract & Settles Balance
  console.log('✓ Test 11: Cashier creates Category C Catering Bill & settles balance...');
  const cateringResult = restaurantStore.createCateringOrder({
    customerName: 'Murugan Textiles',
    customerPhone: '94440 12345',
    eventName: 'Diwali Staff Feast',
    eventDate: '2026-10-30',
    paxCount: 200,
    pricePerPlate: 300,
    menuSummary: 'Chicken Dum Biryani, 65, Parotta, Payasam',
    advancePaid: 30000,
    paymentMethod: 'UPI',
  });
  assert.strictEqual(cateringResult.success, true, 'Catering order booking must succeed');
  assert.ok(cateringResult.catering, 'Catering contract must be created');
  assert.strictEqual(cateringResult.catering.subtotal, 60000); // 200 * 300
  assert.strictEqual(cateringResult.catering.tax_amount, 3000); // 5%
  assert.strictEqual(cateringResult.catering.total_amount, 63000);
  assert.strictEqual(cateringResult.catering.advance_paid, 30000);
  assert.strictEqual(cateringResult.catering.balance_due, 33000);
  assert.strictEqual(cateringResult.catering.status, 'ADVANCE_PAID');

  // Settle the catering balance
  const settleResult = restaurantStore.settleCateringBalance(cateringResult.catering.id, 'CARD', 'CARD-TXN-888');
  assert.strictEqual(settleResult.success, true, 'Settle catering balance must succeed');

  const settledOrder = restaurantStore.getState().caterings.find((c) => c.id === cateringResult.catering?.id)!;
  assert.strictEqual(settledOrder.balance_due, 0, 'Balance due must be 0 after settlement');
  assert.strictEqual(settledOrder.status, 'FULLY_PAID', 'Status must transition to FULLY_PAID');
  console.log(`  -> Passed: Catering Invoice ${settledOrder.invoice_number} created & fully settled (₹${settledOrder.total_amount}).\n`);

  // ==========================================================================
  // AC / Non-AC PRICING VERIFICATION SUITE
  // ==========================================================================
  console.log('------------------------------------------------------------');
  console.log('❄️ AC vs 🌿 Non-AC Pricing & Role Security Verification');
  console.log('------------------------------------------------------------\n');

  // Test 12: Admin configures Chicken Biryani AC and Non-AC prices
  console.log('✓ Test 12: Admin sets Chicken Biryani AC price ₹220 and Non-AC price ₹200...');
  restaurantStore.setUserRole('admin');
  const allMenuItems = restaurantStore.getState().menuItems;
  const biryani = allMenuItems.find((m) => m.name.toLowerCase().includes('biryani'))!;
  assert.ok(biryani, 'Biryani menu item must exist');

  const updatePriceResult = restaurantStore.updateMenuItem({
    ...biryani,
    price_non_ac: 200,
    price_ac: 220,
    price: 200,
  });
  assert.strictEqual(updatePriceResult.success, true, 'Admin updating dual prices must succeed');

  const updatedBiryani = restaurantStore.getState().menuItems.find((m) => m.id === biryani.id)!;
  assert.strictEqual(updatedBiryani.price_non_ac, 200, 'Non-AC price must be ₹200');
  assert.strictEqual(updatedBiryani.price_ac, 220, 'AC price must be ₹220');

  // Verify negative price validation
  const negativePriceResult = restaurantStore.updateMenuItem({
    ...biryani,
    price_non_ac: -50,
  });
  assert.strictEqual(negativePriceResult.success, false, 'Negative prices must be rejected');
  console.log('  -> Passed: Admin successfully configured AC ₹220 / Non-AC ₹200; negative prices rejected.\n');

  // Test 13: Waiter selects AC Table -> adds Chicken Biryani -> applied price is ₹220
  console.log('✓ Test 13: Waiter orders Chicken Biryani at AC Table (Table 6)...');
  restaurantStore.setUserRole('waiter');
  const acTable = restaurantStore.getState().tables.find((t) => t.table_number === 6)!;
  assert.ok(acTable, 'Table 6 must exist');
  assert.strictEqual(acTable.pricing_section, 'AC', 'Table 6 must be an AC table');

  const acAssign = restaurantStore.assignTable(acTable.id, 'AC Guest Anand', 2, 'waiter-uuid');
  assert.strictEqual(acAssign.success, true, 'AC Table assignment must succeed');
  const acOrderId = acAssign.orderId!;

  const addAcBiryani = restaurantStore.addItemsToOrder(acOrderId, [
    { menuItemId: biryani.id, quantity: 1 },
  ]);
  assert.strictEqual(addAcBiryani.success, true, 'Adding Biryani to AC order must succeed');

  const acOrder = restaurantStore.getState().orders.find((o) => o.id === acOrderId)!;
  assert.strictEqual(acOrder.pricing_section, 'AC', 'Order must be tagged with AC pricing section');
  assert.strictEqual(acOrder.items.length, 1);
  assert.strictEqual(acOrder.items[0].unit_price, 220, 'AC Table unit price MUST be ₹220');
  assert.strictEqual(acOrder.items[0].total_price, 220, 'AC Table line total MUST be ₹220');
  console.log(`  -> Passed: AC Table order applied unit price ₹${acOrder.items[0].unit_price} (Line total: ₹${acOrder.items[0].total_price}).\n`);

  // Test 14: Waiter selects Non-AC Table -> adds Chicken Biryani -> applied price is ₹200
  console.log('✓ Test 14: Waiter orders Chicken Biryani at Non-AC Table (Table 8)...');
  const nonAcTable = restaurantStore.getState().tables.find((t) => t.table_number === 8)!;
  assert.ok(nonAcTable, 'Table 8 must exist');
  assert.strictEqual(nonAcTable.pricing_section, 'NON_AC', 'Table 8 must be Non-AC table');

  const nonAcAssign = restaurantStore.assignTable(nonAcTable.id, 'Non-AC Guest Bala', 2, 'waiter-uuid');
  assert.strictEqual(nonAcAssign.success, true, 'Non-AC Table assignment must succeed');
  const nonAcOrderId = nonAcAssign.orderId!;

  const addNonAcBiryani = restaurantStore.addItemsToOrder(nonAcOrderId, [
    { menuItemId: biryani.id, quantity: 1 },
  ]);
  assert.strictEqual(addNonAcBiryani.success, true, 'Adding Biryani to Non-AC order must succeed');

  const nonAcOrder = restaurantStore.getState().orders.find((o) => o.id === nonAcOrderId)!;
  assert.strictEqual(nonAcOrder.pricing_section, 'NON_AC', 'Order must be tagged with NON_AC pricing section');
  assert.strictEqual(nonAcOrder.items.length, 1);
  assert.strictEqual(nonAcOrder.items[0].unit_price, 200, 'Non-AC Table unit price MUST be ₹200');
  assert.strictEqual(nonAcOrder.items[0].total_price, 200, 'Non-AC Table line total MUST be ₹200');
  console.log(`  -> Passed: Non-AC Table order applied unit price ₹${nonAcOrder.items[0].unit_price} (Line total: ₹${nonAcOrder.items[0].total_price}).\n`);

  // Test 15: Additional items added to active order use the correct section price
  console.log('✓ Test 15: Additional round of items to AC Table uses AC price...');
  // Parotta has price_non_ac: 20, price_ac: 25
  const parotta = restaurantStore.getState().menuItems.find((m) => m.name.toLowerCase().includes('parotta'))!;
  assert.ok(parotta, 'Parotta must exist');

  const addRound2Ac = restaurantStore.addItemsToOrder(acOrderId, [
    { menuItemId: parotta.id, quantity: 2 },
  ]);
  assert.strictEqual(addRound2Ac.success, true, 'Adding round 2 items must succeed');

  const acOrderRound2 = restaurantStore.getState().orders.find((o) => o.id === acOrderId)!;
  assert.strictEqual(acOrderRound2.items.length, 2);
  const acParottaItem = acOrderRound2.items.find((i) => i.menu_item_id === parotta.id)!;
  const expectedAcParottaRate = parotta.price_ac ?? parotta.ac_price ?? 25;
  assert.strictEqual(acParottaItem.unit_price, expectedAcParottaRate, `Parotta AC price must be ₹${expectedAcParottaRate}`);
  assert.strictEqual(acParottaItem.total_price, expectedAcParottaRate * 2, `Parotta AC total must be ₹${expectedAcParottaRate * 2}`);
  console.log(`  -> Passed: Additional items in AC order used AC price (₹${acParottaItem.unit_price} each).\n`);

  // Test 16: Changing menu price does not change an existing order or completed bill
  console.log('✓ Test 16: Admin inflates menu price; existing active and historical orders remain untouched...');
  restaurantStore.setUserRole('admin');
  restaurantStore.updateMenuItem({
    ...biryani,
    price_non_ac: 350,
    price_ac: 400,
    price: 350,
  });

  // Verify the active orders still have ₹220 and ₹200
  const acOrderAfterPriceChange = restaurantStore.getState().orders.find((o) => o.id === acOrderId)!;
  const nonAcOrderAfterPriceChange = restaurantStore.getState().orders.find((o) => o.id === nonAcOrderId)!;
  assert.strictEqual(
    acOrderAfterPriceChange.items[0].unit_price,
    220,
    'CRITICAL: Active AC order item price MUST remain ₹220 after menu price change'
  );
  assert.strictEqual(
    nonAcOrderAfterPriceChange.items[0].unit_price,
    200,
    'CRITICAL: Active Non-AC order item price MUST remain ₹200 after menu price change'
  );
  console.log('  -> Passed: Changing menu price did NOT alter existing active orders (snapshot immutability preserved).\n');

  // Test 17: Cashier settlements snapshot and preserve original section and prices
  console.log('✓ Test 17: Cashier settles AC order; payment record preserves AC pricing section...');
  restaurantStore.setUserRole('cashier');
  const payAcResult = restaurantStore.processPayment(acOrderId, {
    paymentMethod: 'CARD',
    paymentReference: 'CARD-AC-9921',
  });
  assert.strictEqual(payAcResult.success, true, 'AC order settlement must succeed');
  assert.strictEqual(payAcResult.payment?.pricing_section, 'AC', 'Payment record must capture AC pricing_section');
  assert.strictEqual(payAcResult.payment?.final_total, acOrderAfterPriceChange.final_total);

  // Completed order remains frozen
  const settledAcOrder = restaurantStore.getState().orders.find((o) => o.id === acOrderId)!;
  assert.strictEqual(settledAcOrder.status, 'PAID');
  assert.strictEqual(settledAcOrder.items[0].unit_price, 220);
  console.log('  -> Passed: Settled bill recorded exactly the prices applied when items were ordered.\n');

  // Test 18: Unauthorized users cannot edit menu prices
  console.log('✓ Test 18: Non-admin users (waiter/cashier) are blocked from modifying menu prices...');
  restaurantStore.setUserRole('waiter');
  const waiterTamperResult = restaurantStore.updateMenuItem({
    ...biryani,
    price_non_ac: 10,
  });
  assert.strictEqual(waiterTamperResult.success, false, 'Waiter must NOT be allowed to edit menu item');
  assert.ok(waiterTamperResult.error?.includes('Unauthorized'), 'Error must specify unauthorized');

  restaurantStore.setUserRole('cashier');
  const cashierTamperResult = restaurantStore.updateMenuItem({
    ...biryani,
    price_ac: 15,
  });
  assert.strictEqual(cashierTamperResult.success, false, 'Cashier must NOT be allowed to edit menu item');
  assert.ok(cashierTamperResult.error?.includes('Unauthorized'), 'Error must specify unauthorized');
  console.log('  -> Passed: Unauthorized roles strictly blocked from updating product catalog.\n');

  // Test 19: Admin section configuration: Occupied table cannot be reassigned
  console.log('✓ Test 19: Admin cannot reassign or release an occupied table with active order...');
  restaurantStore.setUserRole('admin');
  const occupiedNonAcTable = restaurantStore.getState().tables.find((t) => t.id === nonAcTable.id)!;
  assert.strictEqual(occupiedNonAcTable.status, 'OCCUPIED', 'Table 8 must currently be occupied');

  const reassignBlockedResult = restaurantStore.updateTableSection(nonAcTable.id, 'AC Dining', 'AC');
  assert.strictEqual(reassignBlockedResult.success, false, 'Reassigning occupied table section must fail');
  assert.ok(
    reassignBlockedResult.error?.includes('active order') || reassignBlockedResult.error?.includes('occupied'),
    'Error message must indicate table has active order'
  );

  // Settle Table 8 to free it, then reassigning should succeed
  restaurantStore.processPayment(nonAcOrderId, { paymentMethod: 'CASH' });
  const freedTable8 = restaurantStore.getState().tables.find((t) => t.id === nonAcTable.id)!;
  assert.strictEqual(freedTable8.status, 'FREE', 'Table 8 must now be FREE');

  const reassignAllowedResult = restaurantStore.updateTableSection(nonAcTable.id, 'AC Dining', 'AC');
  assert.strictEqual(reassignAllowedResult.success, true, 'Reassigning freed table section must succeed');

  const updatedTable8 = restaurantStore.getState().tables.find((t) => t.id === nonAcTable.id)!;
  assert.strictEqual(updatedTable8.pricing_section, 'AC', 'Table 8 must now be AC');
  assert.strictEqual(updatedTable8.section, 'AC Dining');
  console.log('  -> Passed: Reassignment of occupied table blocked; permitted once freed.\n');

  // Test 20: Fast Keyboard Billing Workflow (select dish → enter quantity → add item → enter next dish → add more items → verify totals)
  console.log('✓ Test 20: Testing Fast Keyboard Billing multi-item flow & totals...');
  const fastOrderResult = restaurantStore.createWalkInOrder(
    'Keyboard Counter Guest',
    1,
    '33333333-3333-3333-3333-333333333333',
    'NON_AC'
  );
  assert.strictEqual(fastOrderResult.success, true, 'Creating walk-in fast order must succeed');
  assert.ok(fastOrderResult.orderId, 'Order ID must be generated');
  const fastOrderId = fastOrderResult.orderId!;

  // Item 1: Chicken Biryani (Non-AC price: ₹200) x 2
  const fastBiryani = restaurantStore.getState().menuItems.find((m) => m.name.includes('Chicken Biryani'))!;
  const addFastItem1 = restaurantStore.addItemsToOrder(
    fastOrderId,
    [{ menuItemId: fastBiryani.id, quantity: 2 }],
    'NON_AC'
  );
  assert.strictEqual(addFastItem1.success, true, 'Adding Item 1 via keyboard flow must succeed');

  // Item 2: Parotta (Non-AC price: ₹20) x 4
  const fastParotta = restaurantStore.getState().menuItems.find((m) => m.name.includes('Parotta'))!;
  const addFastItem2 = restaurantStore.addItemsToOrder(
    fastOrderId,
    [{ menuItemId: fastParotta.id, quantity: 4 }],
    'NON_AC'
  );
  assert.strictEqual(addFastItem2.success, true, 'Adding Item 2 via keyboard flow must succeed');

  // Verify line items and totals
  const fastOrderAfterItems = restaurantStore.getState().orders.find((o) => o.id === fastOrderId)!;
  assert.strictEqual(fastOrderAfterItems.items.length, 2, 'Must have exactly 2 line items');
  
  const expectedFastSubtotal = 200 * 2 + 20 * 4; // 400 + 80 = 480
  const expectedFastTax = Number(((480 * 5) / 100).toFixed(2)); // 24
  const expectedFastTotal = expectedFastSubtotal + expectedFastTax; // 504

  assert.strictEqual(fastOrderAfterItems.subtotal, expectedFastSubtotal, `Subtotal must be ₹${expectedFastSubtotal}`);
  assert.strictEqual(fastOrderAfterItems.tax_amount, expectedFastTax, `5% GST must be ₹${expectedFastTax}`);
  assert.strictEqual(fastOrderAfterItems.final_total, expectedFastTotal, `Final total must be ₹${expectedFastTotal}`);
  console.log(`  -> Passed: Fast billing items verified. Subtotal: ₹${fastOrderAfterItems.subtotal}, Tax: ₹${fastOrderAfterItems.tax_amount}, Total: ₹${fastOrderAfterItems.final_total}.\n`);

  // Test 21: Verify Print Preview settlement & duplicate prevention
  console.log('✓ Test 21: Verifying print settlement & duplicate bill prevention...');
  const initialPaymentCount = restaurantStore.getState().payments.length;
  
  // Settle bill via Cash
  const settleFastBillRes = restaurantStore.processPayment(fastOrderId, {
    paymentMethod: 'CASH',
    cashierName: 'Front Desk Cashier',
  });
  assert.strictEqual(settleFastBillRes.success, true, 'Payment processing must succeed');
  assert.strictEqual(settleFastBillRes.payment?.final_total, 504, 'Payment must record exact bill total');
  assert.strictEqual(restaurantStore.getState().payments.length, initialPaymentCount + 1, 'Payment count must increment by 1');

  // Duplicate settlement attempt must be rejected (idempotency)
  const duplicateSettleRes = restaurantStore.processPayment(fastOrderId, {
    paymentMethod: 'CASH',
  });
  assert.strictEqual(duplicateSettleRes.success, false, 'Duplicate payment processing must be rejected');
  assert.strictEqual(restaurantStore.getState().payments.length, initialPaymentCount + 1, 'Payment count must not increase on duplicate print/settle');
  console.log('  -> Passed: Order settled once and duplicate bill creation strictly blocked.\n');

  // Test 22: Dish individual numbers & search by number and name
  console.log('✓ Test 22: Testing individual dish numbers, Admin assignment, and number/name search...');
  const menuItems = restaurantStore.getState().menuItems;

  // 1. Every menu item must have a positive item_number
  const itemsWithoutNumbers = menuItems.filter((m) => !getMenuItemNumber(m) || getMenuItemNumber(m) <= 0);
  assert.strictEqual(itemsWithoutNumbers.length, 0, 'Every menu item must have an individual dish number > 0');

  // 2. Search by numeric dish number
  const searchByNumber = searchMenuItems(menuItems, '6');
  assert.ok(searchByNumber.exact.length > 0, 'Search for "6" must return exact match');
  assert.strictEqual(getMenuItemNumber(searchByNumber.exact[0]), 6, 'Exact match must have dish #6');

  // 3. Search with hash prefix '#6'
  const searchWithHash = searchMenuItems(menuItems, '#6');
  assert.ok(searchWithHash.exact.length > 0, 'Search for "#6" must return dish #6');
  assert.strictEqual(getMenuItemNumber(searchWithHash.exact[0]), 6, 'Result must be dish #6');

  // 4. Search by dish name
  const searchByName = searchMenuItems(menuItems, 'biryani');
  assert.ok(searchByName.exact.length + searchByName.partial.length > 0, 'Search for "biryani" must return items');

  // 5. Admin adds a new dish with explicit dish number
  const addDishRes = restaurantStore.addMenuItem({
    item_number: 99,
    name: 'Special Mutton Sukka',
    category_id: 'cat-south-indian',
    price: 320,
    price_non_ac: 320,
    price_ac: 350,
    is_veg: false,
    spicy_level: 3,
  }, 'admin');
  assert.strictEqual(addDishRes.success, true, 'Admin adding item with dish number must succeed');
  const addedItem = restaurantStore.getState().menuItems.find((m) => m.name === 'Special Mutton Sukka');
  assert.ok(addedItem, 'New dish must be added to catalog');
  assert.strictEqual(addedItem?.item_number, 99, 'Item number must be persisted as 99');

  // 6. Search for the newly added dish number '99'
  const search99 = searchMenuItems(restaurantStore.getState().menuItems, '99');
  assert.ok(search99.exact.length > 0, 'Search for "99" must find the newly added item');
  assert.strictEqual(search99.exact[0].name, 'Special Mutton Sukka');
  console.log('  -> Passed: Dish numbers, auto/manual assignment, and #number/name search verified.\n');

  console.log('------------------------------------------------------------');
  console.log('🎉 ALL 22 END-TO-END WORKFLOW INTEGRATION TESTS PASSED 100%!');
  console.log('------------------------------------------------------------\n');
}

runWorkflowTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
