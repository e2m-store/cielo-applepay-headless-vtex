import { describe, expect, it } from 'vitest'
import {
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  isBillingContactValid,
  isShippingContactValid,
  type AppPayload,
} from './index'

const appPayload: AppPayload = {
  MerchantId: 'merchant-123',
  ApiUrl: 'https://api.example.com',
  PaymentId: 'payment-123',
  Amount: '99.90',
}

describe('applepay-core helpers', () => {
  it('builds base request with defaults and custom label', () => {
    const request = getApplePayBaseRequest(appPayload, { totalLabel: 'Minha Loja' })

    expect(request.countryCode).toBe('BR')
    expect(request.currencyCode).toBe('BRL')
    expect(request.total.label).toBe('Minha Loja')
    expect(request.total.amount).toBe('99.90')
  })

  it('builds complete and cancel requests from payload', () => {
    const complete = getApplePayCompleteRequest(appPayload, {
      payment: {
        token: {
          paymentData: {
            data: 'wallet-key',
            header: { ephemeralPublicKey: 'ephemeral-key' },
          },
        },
      },
    })

    const cancel = getApplePayCancelRequest(appPayload)

    expect(complete).toEqual({
      PaymentId: 'payment-123',
      MerchantId: 'merchant-123',
      WalletKey: 'wallet-key',
      EphemeralPublicKey: 'ephemeral-key',
    })
    expect(cancel).toEqual({ PaymentId: 'payment-123' })
  })

  it('validates billing and shipping contacts', () => {
    expect(
      isBillingContactValid({
        addressLines: ['Rua 1'],
        postalCode: '12345',
        locality: 'Sao Paulo',
        subLocality: 'Centro',
        administrativeArea: 'SP',
      })
    ).toBe(true)
    expect(isBillingContactValid({})).toBe(false)

    expect(
      isShippingContactValid({
        givenName: 'Joao',
        emailAddress: 'joao@example.com',
        phoneNumber: '11999999999',
      })
    ).toBe(true)
    expect(isShippingContactValid({ givenName: 'Joao' })).toBe(false)
  })
})
