import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: 'Naga Hotel - Restaurant Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
