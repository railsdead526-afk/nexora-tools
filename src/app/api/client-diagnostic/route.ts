import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const tool =
      typeof body?.tool === 'string'
        ? body.tool.slice(0, 50)
        : 'unknown';

    const action =
      typeof body?.action === 'string'
        ? body.action.slice(0, 50)
        : 'unknown';

    console.log(`[client-diagnostic] tool=${tool} action=${action}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 400 },
    );
  }
}
