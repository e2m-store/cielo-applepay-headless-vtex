import type {
  ApplePayBaseRequest,
  ApplePayPaymentEvent,
} from './types'
import type {
  ApplePayClient,
  ApplePaySessionController,
  ApplePaySessionHandlers,
} from './contracts'

type BrowserApplePaySession = {
  onvalidatemerchant: ((event: { validationURL: string }) => void) | null
  onpaymentauthorized: ((event: ApplePayPaymentEvent) => void) | null
  oncancel: (() => void) | null
  completeMerchantValidation: (merchantSession: unknown) => void
  completePayment: (result: { status: number; errors?: unknown[] }) => void
  begin: () => void
  abort: () => void
}

type BrowserApplePayConstructor = {
  new (version: number, request: unknown): BrowserApplePaySession
  canMakePayments(): boolean
  readonly STATUS_SUCCESS: number
  readonly STATUS_FAILURE: number
}

type BrowserApplePayWindow = Window & {
  ApplePaySession?: BrowserApplePayConstructor
}

function getApplePayConstructor(): BrowserApplePayConstructor {
  const ctor = typeof window !== 'undefined'
    ? (window as BrowserApplePayWindow).ApplePaySession
    : undefined

  if (!ctor) {
    throw new Error('Apple Pay unavailable in current browser environment.')
  }

  return ctor
}

export function createBrowserApplePayClient(version = 3): ApplePayClient {
  return {
    canMakePayments(): boolean {
      try {
        const ApplePaySession = getApplePayConstructor()
        return ApplePaySession.canMakePayments()
      } catch {
        return false
      }
    },

    createSession(request: ApplePayBaseRequest, handlers: ApplePaySessionHandlers): ApplePaySessionController {
      const ApplePaySession = getApplePayConstructor()
      const session = new ApplePaySession(version, request)

      session.onvalidatemerchant = () => {
        void handlers.onValidateMerchant()
      }

      session.onpaymentauthorized = (event) => {
        void handlers.onPaymentAuthorized(event)
      }

      session.oncancel = () => {
        void handlers.onCancel()
      }

      return {
        completeMerchantValidation(merchantSession: unknown) {
          session.completeMerchantValidation(merchantSession)
        },
        completePaymentSuccess() {
          session.completePayment({ status: ApplePaySession.STATUS_SUCCESS })
        },
        completePaymentFailure(errors?: unknown[]) {
          session.completePayment({ status: ApplePaySession.STATUS_FAILURE, errors })
        },
        begin() {
          session.begin()
        },
      }
    },
  }
}
