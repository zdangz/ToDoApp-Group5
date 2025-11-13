/**
 * Shared challenge store for WebAuthn authentication
 * In production, this should be replaced with Redis or database storage
 */
export const challenges = new Map<string, string>();

/**
 * Store a challenge for a username with automatic cleanup after 5 minutes
 */
export function storeChallenge(username: string, challenge: string): void {
  challenges.set(username, challenge);
  // Clean up old challenges (older than 5 minutes)
  setTimeout(() => challenges.delete(username), 5 * 60 * 1000);
}

/**
 * Get a challenge for a username
 */
export function getChallenge(username: string): string | undefined {
  return challenges.get(username);
}

/**
 * Delete a challenge for a username
 */
export function deleteChallenge(username: string): void {
  challenges.delete(username);
}
