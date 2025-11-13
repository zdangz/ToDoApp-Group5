import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/db';
import { storeChallenge } from '@/lib/challenge-store';

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

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: 'Todo App',
      rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
      userName: username.trim(),
      userDisplayName: username.trim(),
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
        userVerification: 'required',
        residentKey: 'preferred',
      },
    });

    // Store challenge temporarily
    storeChallenge(username.trim(), options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Register options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
