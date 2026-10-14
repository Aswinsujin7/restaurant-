import { NextResponse } from 'next/server';
import { restaurantStore } from '@/lib/store/restaurant-store';

export async function GET() {
  const state = restaurantStore.getState();
  return NextResponse.json({
    categories: state.categories,
    items: state.menuItems,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category_id, price, price_non_ac, price_ac, ac_price, is_veg, spicy_level, description, is_active } = body;

    const nonAcPrice = price_non_ac !== undefined ? Number(price_non_ac) : (price !== undefined ? Number(price) : NaN);
    const resolvedAcPrice = price_ac !== undefined ? Number(price_ac) : (ac_price !== undefined ? Number(ac_price) : nonAcPrice);

    if (!name || !category_id || isNaN(nonAcPrice)) {
      return NextResponse.json(
        { error: 'name, category_id, and valid non-AC price are required' },
        { status: 400 }
      );
    }

    const res = restaurantStore.addMenuItem({
      name,
      category_id,
      price: nonAcPrice,
      price_non_ac: nonAcPrice,
      price_ac: resolvedAcPrice,
      ac_price: resolvedAcPrice,
      non_ac_price: nonAcPrice,
      is_veg: Boolean(is_veg),
      spicy_level: Number(spicy_level) || 0,
      description: description || '',
      is_available: true,
      is_active: is_active ?? true,
    }, 'admin');

    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to add item' }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: res.item });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, toggleAvailability, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (toggleAvailability) {
      restaurantStore.toggleItemAvailability(id);
      return NextResponse.json({ success: true, message: 'Item availability toggled' });
    }

    const currentItem = restaurantStore.getState().menuItems.find((m) => m.id === id);
    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const res = restaurantStore.updateMenuItem({
      ...currentItem,
      ...updates,
    }, 'admin');

    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to update item' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Item updated' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const res = restaurantStore.deleteMenuItem(id, 'admin');
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to delete item' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
