import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get the admin token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    // STEP 2: Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `DayTips Admin (${profile.email})`,
      issuer: 'DayTips'
    });

    // STEP 3: Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // STEP 4: Save secret temporarily to database (not enabled yet)
    await supabase
      .from('profiles')
      .update({ 
        two_factor_secret: secret.base32,
        two_factor_enabled: false 
      })
      .eq('id', profile.id);

    // STEP 5: Return secret and QR code
    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCode,
      message: 'Scan this QR code with Google Authenticator'
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}