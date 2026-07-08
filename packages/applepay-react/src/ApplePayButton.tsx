 'use client'

import type { ButtonHTMLAttributes } from 'react'
import { useApplePaySdk } from './useApplePaySdk'

type ApplePayButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  loading?: boolean
  sdkScriptId?: string
  sdkUrl?: string
  sdkLoadingLabel?: string
  sdkErrorLabel?: string
}

export function ApplePayButton({
  loading,
  disabled,
  sdkScriptId = 'apple-pay-sdk',
  sdkUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js',
  sdkLoadingLabel = 'Carregando Apple Pay...',
  sdkErrorLabel = 'Falha ao carregar SDK do Apple Pay.',
  ...rest
}: ApplePayButtonProps) {
  const { sdkReady, sdkError } = useApplePaySdk({
    scriptId: sdkScriptId,
    sdkUrl,
    errorMessage: sdkErrorLabel,
  })

  if (sdkError) {
    return <p className="text-xs text-red-700">{sdkError}</p>
  }

  if (!sdkReady) {
    return <p className="text-xs text-[#8699ad]">{sdkLoadingLabel}</p>
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
      }}
      aria-label="Pagar com Apple Pay"
      {...rest}
    >
      {/* @ts-expect-error - custom element provided by Apple Pay SDK */}
      <apple-pay-button
        buttonstyle="black"
        type="buy"
        locale="pt-BR"
        style={{ width: '100%', height: '48px', '--apple-pay-button-border-radius': '10px' }}
      />
    </button>
  )
}
