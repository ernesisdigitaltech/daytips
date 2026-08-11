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

    // Get user's security data from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('security_answer_hash, security_salt, security_attempts, security_locked_until')
      .eq('email', email)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is locked
    if (profile.security_locked_until) {
      const lockTime = new Date(profile.security_locked_until);
      const now = new Date();
      
      if (lockTime > now) {
        const minutesLeft = Math.ceil((lockTime - now) / (1000 * 60));
        return NextResponse.json(
          { error: `Account locked. Try again in ${minutesLeft} minutes.` },
          { status: 403 }
        );
      }
    }

    // Hash the provided answer with the stored salt
    const encoder = new TextEncoder();
    const data = encoder.encode(answer + profile.security_salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedAnswer = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if answer matches
    if (hashedAnswer !== profile.security_answer_hash) {
      // Increment failed attempts
      const newAttempts = (profile.security_attempts || 0) + 1;
      
      // Lock after 5 failed attempts
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await supabase
        .from('profiles')
        .update({
          security_attempts: newAttempts,
          security_locked_until: lockedUntil
        })
        .eq('email', email);

      const attemptsLeft = 5 - newAttempts;
      return NextResponse.json(
        { 
          error: `Incorrect answer. ${attemptsLeft} attempts remaining.`,
          attemptsLeft: attemptsLeft
        },
        { status: 401 }
      );
    }

    // ✅ Answer is correct - reset attempts
    await supabase
      .from('profiles')
      .update({
        security_attempts: 0,
        security_locked_until: null
      })
      .eq('email', email);

    return NextResponse.json({
      success: true,
      message: 'Answer verified successfully'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}