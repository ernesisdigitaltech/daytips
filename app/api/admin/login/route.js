import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, password, twoFactorCode } = await request.json();

    if (!email || !password || !twoFactorCode) {
      return NextResponse.json(
        { error: 'Email, password, and 2FA code are required' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
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

    // Check if user is admin
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

    // Verify admin
    if (!profile.is_admin) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // Check 2FA setup
    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not set up. Please contact administrator.' },
        { status: 400 }
      );
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: profile.two_factor_secret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // Generate JWT
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

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id);

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