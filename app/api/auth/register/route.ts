import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = userDB.getByUsername(username.trim());
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // Create user (simplified - production would use WebAuthn)
    const user = userDB.create(username.trim());

    // Create session
    await createSession(user.id, user.username);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
