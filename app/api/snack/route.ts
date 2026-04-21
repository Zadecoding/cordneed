import { NextResponse } from 'next/server';

// Snack API is no longer used — preview is handled client-side via Sandpack.
export async function POST() {
  return NextResponse.json({ message: 'Deprecated' }, { status: 410 });
}
