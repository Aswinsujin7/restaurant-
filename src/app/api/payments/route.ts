import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function GET() {
  const state = restaurantStore.getState();
  return NextResponse.json({
    payments: state.payments,
    totalCount: state.payments.length,
    totalRevenue: state.payments.reduce((sum, p) => sum + (p.final_total || 0), 0),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentMethod, paymentReference, discountAmount, cashierId, cashierName } =
      body;

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'orderId and paymentMethod (CASH, UPI, CARD) are required' },
        { status: 400 }
      );
    }

    const result = restaurantStore.processPayment(orderId, {
      paymentMethod,
      paymentReference,
      discountAmount: Number(discountAmount) || 0,
      cashierId,
      cashierName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      message: 'Payment recorded successfully. Order closed and Table released to FREE.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
