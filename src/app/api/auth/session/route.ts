import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('bg_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const verified = await verifySessionToken(sessionCookie);
  if (!verified) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: verified.id,
      email: verified.email,
      full_name: verified.full_name,
      role: verified.role,
    },
  });
}
