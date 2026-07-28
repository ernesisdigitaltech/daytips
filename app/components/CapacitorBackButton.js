'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CapacitorBackButton() {
  const router = useRouter()

  useEffect(() => {
    let listenerHandle

    async function setup() {
      // Only relevant inside the actual Android/iOS app shell — do nothing
      // on the normal website, so this has zero effect on web users.
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return

      const { App } = await import('@capacitor/app')

      listenerHandle = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          router.back()
        } else {
          // Nothing left to go back to — minimize like a normal Android app
          // at its home screen, rather than force-killing the process.
          App.minimizeApp()
        }
      })
    }

    setup()

    return () => {
      listenerHandle?.remove()
    }
  }, [router])

  return null
}