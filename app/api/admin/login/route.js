import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// HARDCODED ADMIN EMAIL
const ADMIN_EMAIL = 'dominicernest38@gmail.com';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, password, twoFactorCode } = await request.json();

    console.log('📡 Admin Login API called');
    console.log('📧 Email:', email);
    console.log('🔑 2FA Code received:', twoFactorCode);

    if (!email || !password || !twoFactorCode) {
      return NextResponse.json(
        { error: 'Email, password, and 2FA code are required' },
        { status: 400 }
      );
    }

    // ✅ Check if this is the hardcoded admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.log('❌ Not admin email');
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    console.log('✅ Admin email confirmed');

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', authData.user.email);

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, two_factor_secret')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Profile error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      );
    }

    console.log('📊 Profile:', profile);
    console.log('🔑 is_admin:', profile.is_admin);
    console.log('🔐 two_factor_secret:', profile.two_factor_secret);

    // Verify 2FA code
    console.log('🔐 Verifying 2FA code...');
    const verified = speakeasy.totp.verify({
      secret: profile.two_factor_secret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1
    });

    console.log('✅ 2FA Verified:', verified);

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

    console.log('✅ Login successful for admin');

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
    console.error('❌ Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}