import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function GET() {
  const state = restaurantStore.getState();
  return NextResponse.json({
    tables: state.tables,
    total: state.tables.length,
    freeCount: state.tables.filter((t) => t.status === 'FREE').length,
    occupiedCount: state.tables.filter((t) => t.status !== 'FREE').length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, customerName, guestCount, waiterId } = body;

    if (!tableId) {
      return NextResponse.json({ error: 'tableId is required' }, { status: 400 });
    }

    const result = restaurantStore.assignTable(
      tableId,
      customerName || 'Walk-in Guest',
      Number(guestCount) || 1,
      waiterId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Table successfully assigned and new order session initialized.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
