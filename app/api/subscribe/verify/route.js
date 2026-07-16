import { NextResponse } from 'next/server'
import { applyProSubscription } from '@/lib/subscriptionUtils'

// Set this as the "Redirect URL" on BOTH your weekly and monthly
// Flutterwave recurring Payment Links:
//   https://<your-domain>/api/subscribe/verify

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const transactionId = searchParams.get('transaction_id')
  const status = searchParams.get('status')

  if (status !== 'successful' || !transactionId) {
    return NextResponse.redirect(`${origin}/subscribe?upgrade=failed`)
  }

  try {
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    )
    const verifyJson = await verifyRes.json()

    const tx = verifyJson?.data
    if (verifyJson.status !== 'success' || tx?.status !== 'successful') {
      return NextResponse.redirect(`${origin}/subscribe?upgrade=failed`)
    }

    const result = await applyProSubscription({
      email: tx.customer?.email,
      amount: tx.amount,
      txRef: tx.tx_ref,
    })

    if (!result.success) {
      console.error('Subscription apply failed:', result.reason)
      return NextResponse.redirect(`${origin}/subscribe?upgrade=failed`)
    }

    return NextResponse.redirect(`${origin}/dashboard?upgraded=${result.plan}`)
  } catch (err) {
    console.error('Verify route error:', err)
    return NextResponse.redirect(`${origin}/subscribe?upgrade=failed`)
  }
}