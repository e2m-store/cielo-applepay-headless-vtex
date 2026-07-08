export type ApplePayBillingContact = {
  addressLines?: string[]
  postalCode?: string
  locality?: string
  subLocality?: string
  administrativeArea?: string
}

export type ApplePayShippingContact = {
  givenName?: string
  emailAddress?: string
  phoneNumber?: string
}

export type ApplePayPaymentEvent = {
  payment: {
    billingContact?: ApplePayBillingContact
    shippingContact?: ApplePayShippingContact
    token: ApplePayPaymentToken
  }
}

export type ApplePayPaymentToken = {
  paymentData: {
    data: string
    header: {
      ephemeralPublicKey: string
      publicKeyHash?: string
      transactionId?: string
    }
    signature?: string
    version?: string
  }
}

export type ApplePayBaseRequest = {
  countryCode: string
  currencyCode: string
  merchantCapabilities: string[]
  supportedNetworks: string[]
  requiredBillingContactFields: string[]
  requiredShippingContactFields: string[]
  total: {
    label: string
    type: 'final' | 'pending'
    amount: string
  }
}

export type ApplePayRequestConfig = {
  countryCode: string
  currencyCode: string
  merchantCapabilities: string[]
  supportedNetworks: string[]
  requiredBillingContactFields: string[]
  requiredShippingContactFields: string[]
  totalLabel: string
  totalType: 'final' | 'pending'
}

export type AppPayload = {
  MerchantId: string
  ApiUrl: string
  PaymentId: string
  CertificateName?: string
  OriginRequestId?: string
  MerchantUrl?: string
  Amount: string
  AppleSessionResponse?: unknown
  Response?: string
}

export type AppPayloadResponse = {
  Response: string
}

export type ApplePayCompleteRequest = {
  PaymentId: string
  MerchantId: string
  WalletKey: string
  EphemeralPublicKey: string
}

export type ApplePayCancelRequest = {
  PaymentId: string
}

export type ApplePaySessionResponse = {
  Response: string
}

export type ApplePaySessionState = {
  appPayload: AppPayload
  orderGroup: string
}
