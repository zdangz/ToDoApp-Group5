import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { storeChallenge } from '@/lib/challenge-store';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user exists
    const user = userDB.getByUsername(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's authenticators
    const authenticators = authenticatorDB.getByUserId(user.id);
    if (authenticators.length === 0) {
      return NextResponse.json({ error: 'No authenticators found' }, { status: 404 });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: authenticators.map(auth => ({
        id: auth.credential_id,
        type: 'public-key' as const,
      })),
    });

    // Store challenge temporarily
    storeChallenge(username.trim(), options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Login options error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
