import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get the token and 2FA code from request
    const { token: twoFactorToken } = await request.json();

    if (!twoFactorToken) {
      return NextResponse.json(
        { error: '2FA code is required' },
        { status: 400 }
      );
    }

    // Get the admin token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const adminToken = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // STEP 1: Get user from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, two_factor_secret')
      .eq('id', decoded.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!profile.is_admin) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // Check if 2FA secret exists
    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: 'No 2FA setup in progress. Please run setup first.' },
        { status: 400 }
      );
    }

    // STEP 2: Verify the 6-digit code
    const verified = speakeasy.totp.verify({
      secret: profile.two_factor_secret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code. Please check your Google Authenticator app.' },
        { status: 400 }
      );
    }

    // STEP 3: Permanently enable 2FA
    await supabase
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', profile.id);

    // STEP 4: Return success
    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully! You can now login with 2FA.'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}