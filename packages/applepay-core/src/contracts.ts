import type {
  AppPayload,
  ApplePayBaseRequest,
  ApplePayCancelRequest,
  ApplePayCompleteRequest,
  ApplePayPaymentEvent,
  ApplePaySessionResponse,
} from './types'

export type TransactionPrepared = {
  orderGroup: string
  orderId?: string
  appPayloadRaw: string
}

export interface TransactionGateway {
  prepareTransaction(): Promise<TransactionPrepared>
  finalizeTransaction(orderGroup: string): Promise<void>
  failTransaction(orderId?: string): Promise<void>
}

export interface ApplePayConnector {
  openMerchantSession(appPayload: AppPayload): Promise<ApplePaySessionResponse>
  completePayment(appPayload: AppPayload, request: ApplePayCompleteRequest): Promise<unknown>
  cancelPayment(appPayload: AppPayload, request: ApplePayCancelRequest): Promise<void>
}

export type ApplePaySessionHandlers = {
  onValidateMerchant: () => Promise<void>
  onPaymentAuthorized: (event: ApplePayPaymentEvent) => Promise<void>
  onCancel: () => Promise<void>
}

export interface ApplePaySessionController {
  completeMerchantValidation(merchantSession: unknown): void
  completePaymentSuccess(): void
  completePaymentFailure(errors?: unknown[]): void
  begin(): void
}

export interface ApplePayClient {
  canMakePayments(): boolean
  createSession(request: ApplePayBaseRequest, handlers: ApplePaySessionHandlers): ApplePaySessionController
}
