import type {
  ApplePayConnector,
  TransactionGateway,
  TransactionPrepared,
} from '@cielo/applepay-headless-vtex'
import type {
  AppPayload,
  ApplePayCancelRequest,
  ApplePayCompleteRequest,
  ApplePaySessionResponse,
} from '@cielo/applepay-headless-vtex'

export type VtexTransactionsDeps = {
  prepare: () => Promise<TransactionPrepared>
  finalize: (orderGroup: string) => Promise<void>
  fail: (orderId?: string) => Promise<void>
}

export function createVtexTransactionGateway(deps: VtexTransactionsDeps): TransactionGateway {
  return {
    prepareTransaction: deps.prepare,
    finalizeTransaction: deps.finalize,
    failTransaction: deps.fail,
  }
}

export type VtexConnectorDeps = {
  session: (appPayload: AppPayload) => Promise<ApplePaySessionResponse>
  complete: (appPayload: AppPayload, request: ApplePayCompleteRequest) => Promise<unknown>
  cancel: (appPayload: AppPayload, request: ApplePayCancelRequest) => Promise<void>
}

export function createVtexApplePayConnector(deps: VtexConnectorDeps): ApplePayConnector {
  return {
    openMerchantSession: deps.session,
    completePayment: deps.complete,
    cancelPayment: deps.cancel,
  }
}

// HTTP helper reutilizavel para chamadas diretas ao connector Cielo.
export async function postCielo<T>(
  path: string,
  body: unknown,
  apiUrl: string,
  merchantId?: string
): Promise<T> {
  const url = `${apiUrl}${path}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': merchantId ?? '',
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `Falha na requisicao Apple Pay ao connector Cielo (${url}) - HTTP ${response.status}: ${text || '(sem corpo)'}`
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export async function requestApplePaySession(
  appPayload: AppPayload
): Promise<ApplePaySessionResponse> {
  return postCielo<ApplePaySessionResponse>(
    '/wallet/applepayopensession',
    {
      PaymentId: appPayload.PaymentId,
      OriginRequestId: appPayload.OriginRequestId,
      MerchantUrl: appPayload.MerchantUrl,
    },
    appPayload.ApiUrl,
    appPayload.MerchantId
  )
}

export async function requestApplePayComplete(
  appPayload: AppPayload,
  walletRequest: ApplePayCompleteRequest
): Promise<ApplePaySessionResponse> {
  return postCielo<ApplePaySessionResponse>(
    '/wallet/applepaycomplete',
    {
      PaymentId: walletRequest.PaymentId,
      WalletKey: walletRequest.WalletKey,
      EphemeralPublicKey: walletRequest.EphemeralPublicKey,
    },
    appPayload.ApiUrl,
    appPayload.MerchantId
  )
}

export async function requestApplePayCancel(
  appPayload: AppPayload,
  cancelRequest: ApplePayCancelRequest
): Promise<void> {
  await postCielo<void>(
    '/wallet/applepaycancel',
    {
      PaymentId: cancelRequest.PaymentId,
    },
    appPayload.ApiUrl,
    appPayload.MerchantId
  )
}

export * from './flow'
