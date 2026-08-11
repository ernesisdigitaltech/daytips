import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'dominicernest38@gmail.com';

export async function POST(request) {
  try {
    const { email, password, twoFactorCode } = await request.json();

    console.log('📡 API called');
    console.log('📧 Email:', email);
    console.log('🔑 Code:', twoFactorCode);

    // Check admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check 6-digit code
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      return NextResponse.json({ error: '6-digit code required' }, { status: 400 });
    }

    // Verify password
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('❌ Auth error:', error.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token
    const token = Buffer.from(
      JSON.stringify({ 
        userId: data.user.id, 
        email: data.user.email,
        isAdmin: true,
        timestamp: Date.now()
      })
    ).toString('base64');

    console.log('✅ Login successful');

    return NextResponse.json({ 
      success: true, 
      token,
      message: 'Login successful' 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}