// Store WebAuthn challenges in memory
// In production, use Redis or database for distributed systems
export const challenges = new Map<string, string>();
