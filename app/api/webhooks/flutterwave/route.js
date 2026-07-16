import { NextResponse } from 'next/server'
import { applyProSubscription } from '@/lib/subscriptionUtils'

// Set this as your webhook URL in Flutterwave Dashboard → Settings → Webhooks:
//   https://<your-domain>/api/webhooks/flutterwave
// Also set a "Secret Hash" there (any string you choose) and put the same
// value in FLUTTERWAVE_WEBHOOK_SECRET_HASH in your env vars.

export async function POST(request) {
  const receivedHash = request.headers.get('verif-hash')

  if (!receivedHash || receivedHash !== process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = await request.json()

  // This fires for the initial charge AND every recurring renewal charge.
  if (body.event === 'charge.completed' && body.data?.status === 'successful') {
    const result = await applyProSubscription({
      email: body.data.customer?.email,
      amount: body.data.amount,
      txRef: body.data.tx_ref,
    })

    if (!result.success) {
      console.error('Webhook: failed to apply subscription:', result.reason)
    }
  }

  // Flutterwave just needs a 200 to know we received it — respond quickly
  // regardless of internal outcome so it doesn't retry unnecessarily.
  return NextResponse.json({ received: true }, { status: 200 })
}