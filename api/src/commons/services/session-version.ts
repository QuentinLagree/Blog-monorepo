import { createHash } from 'node:crypto';

// Fingerprint of the stored password hash; never put the hash itself in a session.
export function sessionVersion(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex');
}
