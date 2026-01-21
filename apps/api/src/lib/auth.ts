import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { nanoid } from 'nanoid';

const hashOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, hashOptions);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password, hashOptions);
  } catch {
    return false;
  }
}

export function generateSessionId(): string {
  return nanoid(32);
}

export function generateToken(): string {
  return nanoid(64);
}

export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 days
  return expiry;
}
