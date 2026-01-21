import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSessionId, generateToken } from '../lib/auth.js';

describe('Auth utilities', () => {
  it('should hash password', async () => {
    const password = 'test123456';
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
  });

  it('should verify correct password', async () => {
    const password = 'test123456';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'test123456';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(hash, 'wrongpassword');
    expect(isValid).toBe(false);
  });

  it('should generate session ID', () => {
    const sessionId = generateSessionId();
    expect(sessionId).toBeTruthy();
    expect(sessionId.length).toBe(32);
  });

  it('should generate token', () => {
    const token = generateToken();
    expect(token).toBeTruthy();
    expect(token.length).toBe(64);
  });
});
