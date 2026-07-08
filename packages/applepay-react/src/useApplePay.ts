import { useCallback, useMemo, useState } from 'react'
import { createApplePayOrchestrator } from '@cielo/applepay-headless-vtex'
import type {
  ApplePayClient,
  ApplePayConnector,
  TransactionGateway,
} from '@cielo/applepay-headless-vtex'
import type { AppPayload, ApplePayRequestConfig } from '@cielo/applepay-headless-vtex'

export type UseApplePayParams = {
  transactions: TransactionGateway
  connector: ApplePayConnector
  client: ApplePayClient
  parsePayload?: (raw: string) => AppPayload
  requestConfig?: Partial<ApplePayRequestConfig>
  onSuccess?: (orderGroup: string) => void
  onError?: (message: string) => void
  onCancel?: () => void
}

export function useApplePay(params: UseApplePayParams) {
  const { transactions, connector, client, onSuccess, onError, onCancel } = params
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsePayload = useMemo(
    () => params.parsePayload ?? ((raw: string) => JSON.parse(raw) as AppPayload),
    [params.parsePayload]
  )

  const requestConfig = useMemo(() => params.requestConfig, [params.requestConfig])

  const orchestrator = useMemo(
    () =>
      createApplePayOrchestrator({
        transactions,
        connector,
        client,
        parsePayload,
        requestConfig,
        onSuccess,
        onError: (message) => {
          setError(message)
          onError?.(message)
        },
        onCancel,
      }),
    [transactions, connector, client, parsePayload, requestConfig, onSuccess, onError, onCancel]
  )

  const start = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await orchestrator.start()
    } catch (e) {
      const message = (e as Error).message ?? 'Failed to start Apple Pay flow.'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [orchestrator, onError])

  return {
    start,
    loading,
    error,
  }
}
