import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const result = restaurantStore.requestBill(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bill requested. Notified cashier counter.',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
