import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

// Import challenges map from register-options
import { challenges } from '../register-options/route';

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

    // Store authenticator
    const { credential, counter } = registrationInfo;
    const credentialID = isoBase64URL.fromBuffer(credential.id);
    const credentialPublicKey = isoBase64URL.fromBuffer(credential.publicKey);

    authenticatorDB.create(
      user.id,
      credentialID,
      credentialPublicKey,
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
