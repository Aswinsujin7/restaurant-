import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const tableNumber = searchParams.get('tableNumber');

  const state = restaurantStore.getState();
  let orders = state.orders;

  if (statusFilter) {
    const statuses = statusFilter.split(',');
    orders = orders.filter((o) => statuses.includes(o.status));
  }

  if (tableNumber) {
    orders = orders.filter((o) => o.table_number === Number(tableNumber));
  }

  return NextResponse.json({
    orders,
    count: orders.length,
  });
}
