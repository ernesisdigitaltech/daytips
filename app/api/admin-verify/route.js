import { NextResponse } from 'next/server';

// The known correct answer (stored securely on server only)
const CORRECT_ANSWER = 'Ekop';

export async function POST(request) {
  try {
    const { email, answer } = await request.json();

    if (!email || !answer) {
      return NextResponse.json(
        { error: 'Email and answer are required' },
        { status: 400 }
      );
    }

    // Check if answer matches (case insensitive)
    if (answer.toLowerCase() === CORRECT_ANSWER.toLowerCase()) {
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