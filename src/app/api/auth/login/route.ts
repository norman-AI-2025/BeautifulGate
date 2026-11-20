import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  verifyPasswordMatch,
  signSessionToken,
  secureHashPassword,
} from '@/lib/serverAuth';
import { Profile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Rate Limiting Check (Max 5 failed attempts per 5 minutes per IP)
    const rateCheck = checkRateLimit(ip, 5, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'too_many_attempts',
          message: `Too many failed login attempts. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'invalid_payload', message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'missing_credentials', message: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    // 2. Fetch User Record from Supabase
    let matchedProfile: Profile | null = null;
    let storedPasswordHash: string | undefined = undefined;

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        matchedProfile = data as Profile;

        // Extract password hash from column or from notes tag if stored there
        storedPasswordHash = data.password_hash;
        if (!storedPasswordHash && data.notes) {
          const pwdMatch = data.notes.match(/\[pwd:(.+?)\]/);
          if (pwdMatch) {
            storedPasswordHash = pwdMatch[1];
          }
        }
      }
    }

    // 3. Fallback for offline / seed admin if database is unreachable or profile not found
    if (!matchedProfile) {
      if (email === 'tan.beechian@beautifulgate.org.my') {
        matchedProfile = {
          id: 'user-admin-tanbeechian',
          full_name: 'Tan Bee Chian',
          email: 'tan.beechian@beautifulgate.org.my',
          phone: '+6012-2523642',
          ic_or_oku_number: '730922-05-5206',
          role: 'admin',
          mobility_type: 'None',
        };
      } else if (email === 'wong.kokfu@beautifulgate.org.my') {
        matchedProfile = {
          id: 'user-driver-wongkokfu',
          full_name: 'Wong Kok Fu',
          email: 'wong.kokfu@beautifulgate.org.my',
          phone: '+6016-3382910',
          ic_or_oku_number: '680514-05-5183',
          role: 'driver',
          mobility_type: 'None',
        };
      }
    }

    if (!matchedProfile) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'account_not_found',
          message: 'No account found with this email address.',
          remainingAttempts: Math.max(0, rateCheck.remaining - 1),
        },
        { status: 401 }
      );
    }

    // 4. Verify Password Cryptographically
    const isPasswordValid = await verifyPasswordMatch(
      password,
      storedPasswordHash,
      matchedProfile.role,
      matchedProfile.email
    );

    if (!isPasswordValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_password',
          message: 'Incorrect password. Please try again.',
          remainingAttempts: Math.max(0, rateCheck.remaining - 1),
        },
        { status: 401 }
      );
    }

    // Successful login: reset failed attempts
    clearRateLimit(ip);

    // If profile had no password hash saved, optionally update it with a secure hash
    if (!storedPasswordHash && supabase && matchedProfile.id) {
      const newSecHash = await secureHashPassword(password);
      try {
        const safeNotes = (matchedProfile.notes || '').replace(/\[pwd:.+?\]\s?/, '').trim();
        const updatedNotes = `${safeNotes} [pwd:${newSecHash}]`.trim();
        await supabase
          .from('profiles')
          .update({ notes: updatedNotes })
          .eq('id', matchedProfile.id);
      } catch (e) {
        console.warn('Failed to save secure password hash to notes:', e);
      }
    }

    // 5. Generate Signed Session Token (JWT-like HMAC-SHA256)
    const sessionToken = await signSessionToken({
      id: matchedProfile.id,
      email: matchedProfile.email,
      full_name: matchedProfile.full_name,
      role: matchedProfile.role,
    });

    // 6. Return Safe Profile (STRIP password_hash and internal credential notes)
    const safeUser: Profile = {
      ...matchedProfile,
      password_hash: undefined,
      notes: matchedProfile.notes
        ? matchedProfile.notes.replace(/\[pwd:.+?\]\s?/, '').trim()
        : undefined,
    };

    // 7. Set Secure HttpOnly Session Cookie
    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    response.cookies.set('bg_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error('API /auth/login error:', err);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
