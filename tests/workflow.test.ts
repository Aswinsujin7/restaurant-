// ============================================================================
// Naga Hotel - End-to-End Restaurant Workflow Automated Test Suite
// ============================================================================

import assert from 'node:assert';
import { restaurantStore } from '../src/lib/store/restaurant-store';

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

  console.log('------------------------------------------------------------');
  console.log('🎉 ALL 11 END-TO-END WORKFLOW INTEGRATION TESTS PASSED 100%!');
  console.log('------------------------------------------------------------\n');
}

runWorkflowTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
