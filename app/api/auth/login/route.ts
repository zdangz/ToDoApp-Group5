import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user exists, if not create automatically (simplified auth)
    let user = userDB.getByUsername(username.trim());
    if (!user) {
      // Auto-create user on first login
      user = userDB.create(username.trim());
    }

    // Create session (simplified - production would verify WebAuthn)
    await createSession(user.id, user.username);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
