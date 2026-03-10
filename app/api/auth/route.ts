import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    // Use constant-time-like response to avoid timing attacks
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await signAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...SESSION_COOKIE_OPTIONS, value: token });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('admin_session');
  return response;
}
