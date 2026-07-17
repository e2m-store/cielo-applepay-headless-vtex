import { describe, expect, it, vi } from 'vitest'
import {
  createVtexApplePayConnector,
  createVtexTransactionGateway,
  postCielo,
} from './index'

describe('applepay-adapter-vtex', () => {
  it('maps VTEX transaction handlers to gateway contract', async () => {
    const prepare = vi.fn(async () => ({ orderGroup: 'og-1', orderId: 'o-1' }))
    const finalize = vi.fn(async () => undefined)
    const fail = vi.fn(async () => undefined)

    const gateway = createVtexTransactionGateway({ prepare, finalize, fail })

    await gateway.prepareTransaction()
    await gateway.finalizeTransaction('og-1')
    await gateway.failTransaction('o-1')

    expect(prepare).toHaveBeenCalledTimes(1)
    expect(finalize).toHaveBeenCalledWith('og-1')
    expect(fail).toHaveBeenCalledWith('o-1')
  })

  it('maps connector handlers to Apple Pay connector contract', async () => {
    const session = vi.fn(async () => ({ Response: 'ok' }))
    const complete = vi.fn(async () => ({ status: 'approved' }))
    const cancel = vi.fn(async () => undefined)

    const connector = createVtexApplePayConnector({ session, complete, cancel })

    const payload = {
      MerchantId: 'm',
      ApiUrl: 'https://api.example.com',
      PaymentId: 'p',
      Amount: '10.00',
    }

    await connector.openMerchantSession(payload)
    await connector.completePayment(payload, {
      PaymentId: 'p',
      MerchantId: 'm',
      WalletKey: 'wallet',
      EphemeralPublicKey: 'key',
    })
    await connector.cancelPayment(payload, { PaymentId: 'p' })

    expect(session).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('throws descriptive error when connector response is not ok', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    }))

    vi.stubGlobal('fetch', fetchMock)

    await expect(postCielo('/wallets/test', {}, 'https://api.example.com')).rejects.toThrow(
      'HTTP 500: internal error'
    )

    vi.unstubAllGlobals()
  })
})
