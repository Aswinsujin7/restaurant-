import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function POST() {
  restaurantStore.resetToDemo();
  return NextResponse.json({
    success: true,
    message: 'Reset restaurant store to default demo state.',
  });
}
