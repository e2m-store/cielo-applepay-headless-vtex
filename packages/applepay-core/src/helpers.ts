import type {
  AppPayload,
  ApplePayBaseRequest,
  ApplePayCancelRequest,
  ApplePayCompleteRequest,
  ApplePayPaymentEvent,
  ApplePayRequestConfig,
} from './types'

const DEFAULT_APPLE_PAY_REQUEST_CONFIG: ApplePayRequestConfig = {
  countryCode: 'BR',
  currencyCode: 'BRL',
  merchantCapabilities: ['supports3DS', 'supportsCredit'],
  supportedNetworks: ['masterCard', 'visa'],
  requiredBillingContactFields: ['postalAddress'],
  requiredShippingContactFields: ['name', 'email', 'phone'],
  totalLabel: '',
  totalType: 'final',
}

export function getApplePayBaseRequest(
  appPayload: AppPayload,
  config?: Partial<ApplePayRequestConfig>
): ApplePayBaseRequest {
  const mergedConfig: ApplePayRequestConfig = {
    ...DEFAULT_APPLE_PAY_REQUEST_CONFIG,
    ...config,
  }

  return {
    countryCode: mergedConfig.countryCode,
    currencyCode: mergedConfig.currencyCode,
    merchantCapabilities: mergedConfig.merchantCapabilities,
    supportedNetworks: mergedConfig.supportedNetworks,
    requiredBillingContactFields: mergedConfig.requiredBillingContactFields,
    requiredShippingContactFields: mergedConfig.requiredShippingContactFields,
    total: {
      label: mergedConfig.totalLabel,
      type: mergedConfig.totalType,
      amount: appPayload.Amount,
    },
  }
}

export function getApplePayCompleteRequest(
  appPayload: AppPayload,
  event: ApplePayPaymentEvent
): ApplePayCompleteRequest {
  return {
    PaymentId: appPayload.PaymentId,
    MerchantId: appPayload.MerchantId,
    WalletKey: event.payment.token.paymentData.data,
    EphemeralPublicKey: event.payment.token.paymentData.header.ephemeralPublicKey,
  }
}

export function getApplePayCancelRequest(appPayload: AppPayload): ApplePayCancelRequest {
  return { PaymentId: appPayload.PaymentId }
}

export function isBillingContactValid(billingContact: unknown): boolean {
  if (!billingContact || typeof billingContact !== 'object') return false
  const c = billingContact as Record<string, unknown>
  return Boolean(
    Array.isArray(c.addressLines) &&
      c.addressLines[0] &&
      c.postalCode &&
      c.locality &&
      c.subLocality &&
      c.administrativeArea
  )
}

export function isShippingContactValid(shippingContact: unknown): boolean {
  if (!shippingContact || typeof shippingContact !== 'object') return false
  const c = shippingContact as Record<string, unknown>
  return Boolean(c.givenName && c.emailAddress && c.phoneNumber)
}
