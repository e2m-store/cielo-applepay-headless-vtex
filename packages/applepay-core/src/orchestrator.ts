import {
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  isBillingContactValid,
  isShippingContactValid,
} from './helpers'
import type {
  ApplePayClient,
  ApplePayConnector,
  TransactionGateway,
} from './contracts'
import type { AppPayload, ApplePayPaymentEvent, ApplePayRequestConfig } from './types'

export type ApplePayOrchestratorDeps = {
  transactions: TransactionGateway
  connector: ApplePayConnector
  client: ApplePayClient
  parsePayload: (raw: string) => AppPayload
  requestConfig?: Partial<ApplePayRequestConfig>
  onSuccess?: (orderGroup: string) => void
  onError?: (message: string) => void
  onCancel?: () => void
}

export function createApplePayOrchestrator(deps: ApplePayOrchestratorDeps) {
  async function start(): Promise<void> {
    if (!deps.client.canMakePayments()) {
      throw new Error('Apple Pay is not available on this device.')
    }

    const prepared = await deps.transactions.prepareTransaction()
    const parsedPayload = deps.parsePayload(prepared.appPayloadRaw)

    const sessionResponse = await deps.connector.openMerchantSession(parsedPayload)
    const fullPayload = deps.parsePayload(sessionResponse.Response)

    const request = getApplePayBaseRequest(
      { ...parsedPayload, Amount: fullPayload.Amount },
      deps.requestConfig
    )

    const session = deps.client.createSession(request, {
      onValidateMerchant: async () => {
        session.completeMerchantValidation(fullPayload.AppleSessionResponse)
      },
      onPaymentAuthorized: async (event: ApplePayPaymentEvent) => {
        try {
          if (!isBillingContactValid(event.payment.billingContact)) {
            session.completePaymentFailure([
              { code: 'billingContactInvalid', message: 'Billing contact is incomplete.' },
            ])
            await deps.transactions.failTransaction(prepared.orderId)
            return
          }

          if (!isShippingContactValid(event.payment.shippingContact)) {
            session.completePaymentFailure([
              { code: 'shippingContactInvalid', message: 'Shipping contact is incomplete.' },
            ])
            await deps.transactions.failTransaction(prepared.orderId)
            return
          }

          const completeRequest = getApplePayCompleteRequest(fullPayload, event)
          await deps.connector.completePayment(fullPayload, completeRequest)
          await deps.transactions.finalizeTransaction(prepared.orderGroup)

          session.completePaymentSuccess()
          deps.onSuccess?.(prepared.orderGroup)
        } catch (error) {
          session.completePaymentFailure()
          await deps.transactions.failTransaction(prepared.orderId)
          deps.onError?.((error as Error).message)
        }
      },
      onCancel: async () => {
        try {
          const cancelRequest = getApplePayCancelRequest(fullPayload)
          await deps.connector.cancelPayment(fullPayload, cancelRequest)
        } finally {
          await deps.transactions.failTransaction(prepared.orderId)
          deps.onCancel?.()
        }
      },
    })

    session.begin()
  }

  return { start }
}
