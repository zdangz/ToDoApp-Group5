import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getChallenge, deleteChallenge } from '@/lib/challenge-store';

export async function POST(request: NextRequest) {
  try {
    const { username, response } = await request.json() as {
      username: string;
      response: AuthenticationResponseJSON;
    };

    if (!username || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user
    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get stored challenge
    const expectedChallenge = getChallenge(username);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge not found or expired' }, { status: 400 });
    }

    // Get authenticator by credential ID
    const credentialID = response.id;
    const authenticator = authenticatorDB.getByCredentialId(credentialID);
    
    if (!authenticator || authenticator.user_id !== user.id) {
      return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
      requireUserVerification: true,
      authenticator: {
        credentialID: authenticator.credential_id,
        credentialPublicKey: isoBase64URL.toBuffer(authenticator.public_key),
        counter: authenticator.counter ?? 0,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update authenticator counter
    const newCounter = authenticationInfo.newCounter ?? 0;
    authenticatorDB.updateCounter(authenticator.id, newCounter);

    // Clean up challenge
    deleteChallenge(username);

    // Create session
    await createSession(user.id, user.username);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
