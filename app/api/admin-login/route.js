import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'dominicernest38@gmail.com';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, password, twoFactorCode } = await request.json();

    // Check if admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify password with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if it's a 6-digit code
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      return NextResponse.json(
        { error: '6-digit code required' },
        { status: 400 }
      );
    }

    // FOR NOW: Accept any 6-digit code
    // After you set up real 2FA, we'll replace this
    console.log('✅ 2FA bypassed - any 6-digit code accepted');

    // Generate simple token (for admin access)
    const token = Buffer.from(
      JSON.stringify({ 
        userId: data.user.id, 
        email: data.user.email,
        isAdmin: true,
        timestamp: Date.now()
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      token: token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}