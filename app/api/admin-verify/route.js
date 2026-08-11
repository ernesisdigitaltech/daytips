import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, answer } = await request.json();

    if (!email || !answer) {
      return NextResponse.json(
        { error: 'Email and answer are required' },
        { status: 400 }
      );
    }

    // Get stored hash and salt from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('security_answer_hash, security_salt')
      .eq('email', email)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if security is set up
    if (!profile.security_answer_hash || !profile.security_salt) {
      return NextResponse.json(
        { error: 'Security not set up. Contact administrator.' },
        { status: 400 }
      );
    }

    // Hash the provided answer with the stored salt
    const encoder = new TextEncoder();
    const data = encoder.encode(answer + profile.security_salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedAnswer = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare with stored hash
    if (hashedAnswer === profile.security_answer_hash) {
      return NextResponse.json({
        success: true,
        message: 'Answer verified'
      });
    } else {
      return NextResponse.json(
        { error: 'Incorrect answer' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}