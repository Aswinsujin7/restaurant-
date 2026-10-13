import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const state = restaurantStore.getState();
  const order = state.orders.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const body = await request.json();
    const { status, itemId, itemStatus } = body;

    if (itemId && itemStatus) {
      const res = restaurantStore.updateOrderItemStatus(id, itemId, itemStatus);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Item status updated' });
    }

    if (status) {
      const res = restaurantStore.updateTicketStatus(id, status);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Ticket status updated' });
    }

    return NextResponse.json({ error: 'No status modification provided' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
