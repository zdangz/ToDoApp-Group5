import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { challenges } from '@/lib/challenges';

export async function POST(request: NextRequest) {
  try {
    const { username, response } = await request.json() as {
      username: string;
      response: RegistrationResponseJSON;
    };

    if (!username || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get stored challenge
    const expectedChallenge = challenges.get(username);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 400 });
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Create user
    const user = userDB.create(username);

    // Store authenticator - in v10, registrationInfo has fields directly
    const { credentialID, credentialPublicKey, counter } = registrationInfo;

    authenticatorDB.create(
      user.id,
      credentialID,  // Already a base64url string in v10
      isoBase64URL.fromBuffer(credentialPublicKey),  // Convert Uint8Array to base64url string
      counter ?? 0
    );

    // Clean up challenge
    challenges.delete(username);

    // Create session
    await createSession(user.id, user.username);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Register verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
