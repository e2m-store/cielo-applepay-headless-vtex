'use client'

import { useState } from 'react'
import {
  createBrowserApplePayClient,
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  isBillingContactValid,
  isShippingContactValid,
  type ApplePayPaymentEvent,
  type ApplePayRequestConfig,
  type ApplePaySessionState,
} from '@conectores_cielo/cielo-applepay-headless-vtex-core'
import {
  requestApplePayComplete,
  requestApplePayCancel,
} from '@conectores_cielo/cielo-applepay-headless-vtex-adapter'
import { useApplePaySdk } from './useApplePaySdk'

type ApplePayModalProps = {
  sessionState: ApplePaySessionState
  requestConfig?: Partial<ApplePayRequestConfig>
  onSuccess: (orderGroup: string) => void
  onError: (message: string) => void
  onCancel: () => void
}

export function ApplePayModal({
  sessionState,
  requestConfig,
  onSuccess,
  onError,
  onCancel,
}: ApplePayModalProps) {
  const { appPayload, orderGroup } = sessionState
  const { sdkReady, sdkError } = useApplePaySdk()
  const [loading, setLoading] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)

  async function handleApplePayClick() {
    const client = createBrowserApplePayClient(3)

    if (!client.canMakePayments()) {
      setFlowError('Este dispositivo nao suporta Apple Pay. Verifique se ha um cartao cadastrado na sua Carteira.')
      return
    }

    setFlowError(null)
    setLoading(true)

    const request = getApplePayBaseRequest(appPayload, requestConfig)
    const session = client.createSession(request, {
      onValidateMerchant: async () => {
        session.completeMerchantValidation(appPayload.AppleSessionResponse)
      },
      onPaymentAuthorized: async (event: ApplePayPaymentEvent) => {
        const errors: unknown[] = []

        if (!isBillingContactValid(event.payment.billingContact)) {
          errors.push({ code: 'billingContactInvalid', contactField: 'postalCode', message: 'Endereco de cobranca incompleto.' })
          session.completePaymentFailure(errors)
          return
        }

        if (!isShippingContactValid(event.payment.shippingContact)) {
          errors.push({ code: 'shippingContactInvalid', contactField: 'givenName', message: 'Dados de contato incompletos.' })
          session.completePaymentFailure(errors)
          return
        }

        try {
          const walletRequest = getApplePayCompleteRequest(appPayload, event)

          await requestApplePayComplete(appPayload, walletRequest)

          session.completePaymentSuccess()
          onSuccess(orderGroup)
        } catch (err) {
          session.completePaymentFailure()
          onError((err as Error).message ?? 'Erro ao processar pagamento Apple Pay.')
        } finally {
          setLoading(false)
        }
      },
      onCancel: async () => {
        const cancelRequest = getApplePayCancelRequest(appPayload)
        await requestApplePayCancel(appPayload, cancelRequest).catch(() => {
        })
        setLoading(false)
        onCancel()
      },
    })

    session.begin()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pagamento com Apple Pay"
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm rounded-xl border border-[#d8e1ec] bg-white p-7 shadow-2xl sm:p-8">
        <div className="flex flex-col items-center gap-5">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="8" fill="#000" />
            <path
              d="M20.5 11c1.1-1.3 2.8-2.2 4.2-2.2.2 1.6-.5 3.2-1.5 4.3-1 1.1-2.6 2-4.1 1.9-.2-1.5.5-3.1 1.4-4zm-1.3 5.5c-2.2 0-4.2 1.3-5.2 1.3-1.1 0-2.8-1.2-4.7-1.2-2.4.1-4.6 1.4-5.8 3.6-2.5 4.3-.7 10.6 1.7 14.1 1.2 1.7 2.6 3.5 4.5 3.5 1.8-.1 2.4-1.1 4.6-1.1 2.2 0 2.7 1.1 4.6 1.1 1.9-.1 3.1-1.8 4.3-3.5.7-1 1.2-2.1 1.6-3.1-4.2-1.6-4.8-7.7-.7-10-1.2-1.5-3-2.7-5-2.7z"
              fill="white"
            />
          </svg>

          <div className="space-y-1 text-center">
            <p className="text-lg font-semibold text-[#304258]">
              Pagamento com Apple Pay
            </p>
            <p className="text-sm text-[#5f7592]">
              Confirme o pagamento de{' '}
              <strong>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(appPayload.Amount) / 100)}
              </strong>{' '}
              com Touch ID ou Face ID.
            </p>
          </div>

          {(sdkError || flowError) && (
            <p className="w-full rounded-lg border border-red-700/20 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
              {sdkError ?? flowError}
            </p>
          )}

          {sdkReady && !sdkError && !flowError && (
            <button
              type="button"
              disabled={loading}
              onClick={() => { void handleApplePayClick() }}
              className="block w-full border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Pagar com Apple Pay"
            >
              {/* @ts-expect-error - elemento customizado injetado pelo Apple Pay SDK */}
              <apple-pay-button
                buttonstyle="black"
                type="buy"
                locale="pt-BR"
                style={{ width: '100%', height: '48px', '--apple-pay-button-border-radius': '10px' }}
              />
            </button>
          )}

          {!sdkReady && !sdkError && !flowError && (
            <p className="text-sm text-[#8699ad]">Carregando Apple Pay...</p>
          )}

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-transparent text-sm font-medium text-[var(--brand)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar e escolher outro meio de pagamento
          </button>
        </div>
      </div>
    </div>
  )
}



