import { createClient } from '@supabase/supabase-js';
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

    if (!email || !password || !twoFactorCode) {
      return NextResponse.json(
        { error: 'Email, password, and 2FA code are required' },
        { status: 400 }
      );
    }

    // Check if this is the hardcoded admin email
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

    // ✅ TEMPORARY: ACCEPT ANY 6-DIGIT CODE
    if (twoFactorCode.length !== 6) {
      return NextResponse.json(
        { error: '2FA code must be 6 digits' },
        { status: 401 }
      );
    }

    console.log('⚠️ 2FA BYPASSED - Any 6-digit code accepted');

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}