import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use named export for POST
export async function POST(request) {
  try {
    // Get login details from request body
    const { email, password, twoFactorCode } = await request.json();

    // Check all fields are provided
    if (!email || !password || !twoFactorCode) {
      return NextResponse.json(
        { error: 'Email, password, and 2FA code are required' },
        { status: 400 }
      );
    }

    // STEP 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // STEP 2: Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, two_factor_secret')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      );
    }

    // STEP 3: Verify user is an admin
    if (!profile.is_admin) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // STEP 4: Check if 2FA is set up
    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not set up. Please contact system administrator.' },
        { status: 400 }
      );
    }

    // STEP 5: Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: profile.two_factor_secret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code. Please check your Google Authenticator app.' },
        { status: 401 }
      );
    }

    // STEP 6: Generate JWT token for admin session
    const token = jwt.sign(
      { 
        userId: profile.id,
        email: profile.email,
        isAdmin: true,
        authenticated: true,
        twoFactorVerified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // STEP 7: Update last login time
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id);

    // STEP 8: Return success response
    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: profile.id,
        email: profile.email
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}