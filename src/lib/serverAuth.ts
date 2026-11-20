// ==============================================================================
// Beautiful Gate Server-Side Authentication & Cryptographic Utilities
// Web Crypto API Compatible (Works seamlessly in Next.js Edge & Node.js runtimes)
// ==============================================================================

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'driver' | 'admin';
  exp: number; // Unix timestamp in seconds
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'beautiful-gate-seremban-sec-salt-2026';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Helper to encode/decode UTF-8 and Base64URL
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign session payload into a tamper-proof JWT-like token: base64url(header).base64url(payload).base64url(signature)
 */
export async function signSessionToken(user: Omit<SessionUser, 'exp'>): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload: SessionUser = { ...user, exp };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binarySig = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binarySig += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(binarySig)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify and decode session token. Returns null if expired or tampered with.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey();
    let base64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(dataToSign)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: SessionUser = JSON.parse(payloadJson);

    // Check expiration
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSeconds) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Legacy polynomial hash for backward compatibility with existing seeded profiles
 */
export function legacyHashPassword(pwd: string): string {
  if (!pwd) return '';
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'bg_' + Math.abs(hash).toString(16);
}

/**
 * Strong SHA-256 salted password hashing
 */
export async function secureHashPassword(pwd: string): Promise<string> {
  if (!pwd) return '';
  const enc = new TextEncoder();
  const data = enc.encode(`${SESSION_SECRET}:${pwd}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify whether an input password matches stored password hash or fallback seed rules
 */
export async function verifyPasswordMatch(
  inputPassword: string,
  storedHash?: string,
  userRole?: string,
  userEmail?: string
): Promise<boolean> {
  if (!inputPassword) return false;

  // 1. Check strong SHA-256 hash match
  const strongHash = await secureHashPassword(inputPassword);
  if (storedHash === strongHash) return true;

  // 2. Check legacy polynomial hash match
  const legHash = legacyHashPassword(inputPassword);
  if (storedHash === legHash) return true;

  // 3. Fallback for default seed accounts without hash in DB
  if (!storedHash) {
    if (userRole === 'admin' && inputPassword === 'admin123') return true;
    if (userRole === 'driver' && inputPassword === 'driver123') return true;
    if (userEmail === 'tan.beechian@beautifulgate.org.my' && inputPassword === 'admin123') return true;
    if (userEmail === 'wong.kokfu@beautifulgate.org.my' && inputPassword === 'driver123') return true;
    // For beneficiaries without a password yet, any non-empty password initializes their account
    if (userRole === 'customer') return true;
  }

  return false;
}

// ==============================================================================
// RATE LIMITER (In-Memory sliding window to prevent brute force login attacks)
// ==============================================================================
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Check if the given client identifier (IP address) has exceeded allowed login attempts.
 * Max 5 failed attempts per 5 minutes.
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000
): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    return { allowed: true, remaining: maxAttempts, resetSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.attempts >= maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetSeconds };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.attempts,
    resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function recordFailedAttempt(
  identifier: string,
  windowMs: number = 5 * 60 * 1000
): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identifier, { attempts: 1, resetAt: now + windowMs });
  } else {
    entry.attempts += 1;
  }
}

export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
