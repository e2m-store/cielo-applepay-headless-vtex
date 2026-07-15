'use client'

import { useEffect, useRef, useState } from 'react'

type UseApplePaySdkParams = {
  scriptId?: string
  sdkUrl?: string
  getIsReady?: () => boolean
  errorMessage?: string
}

const DEFAULT_SDK_URL = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js'

export function useApplePaySdk({
  scriptId = 'apple-pay-sdk',
  sdkUrl = DEFAULT_SDK_URL,
  getIsReady,
  errorMessage = 'Falha ao carregar SDK do Apple Pay.',
}: UseApplePaySdkParams = {}) {
  const [sdkReady, setSdkReady] = useState(() => {
    if (typeof document === 'undefined') return false
    if (getIsReady?.()) return true
    return Boolean(document.getElementById(scriptId))
  })
  const [sdkError, setSdkError] = useState<string | null>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    if (sdkReady || getIsReady?.() || document.getElementById(scriptId)) {
      return
    }

    if (scriptLoadedRef.current) {
      return
    }

    scriptLoadedRef.current = true

    const script = document.createElement('script')
    script.id = scriptId
    script.src = sdkUrl
    script.async = true
    script.defer = true
    script.onload = () => {
      setSdkReady(Boolean(getIsReady?.() ?? true))
    }
    script.onerror = () => {
      setSdkError(errorMessage)
    }

    document.head.appendChild(script)
  }, [sdkReady, scriptId, sdkUrl, getIsReady, errorMessage, setSdkReady, setSdkError])

  return {
    sdkReady,
    sdkError,
  }
}
