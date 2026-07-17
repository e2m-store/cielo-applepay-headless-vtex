import {
  createBrowserApplePayClient,
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  type ApplePaySessionResponse,
  isBillingContactValid,
  isShippingContactValid,
  type AppPayload,
  type ApplePayPaymentEvent,
  type ApplePayRequestConfig,
} from '@conectores_cielo/cielo-applepay-headless-vtex-core'
import {
  requestApplePayCancel,
  requestApplePayComplete,
  requestApplePaySession,
} from './index'

// Contrato minimo e agnostico de provedor: o app consumidor e responsavel por
// toda a criacao/registro do pedido (incluindo chamadas especificas de gateway,
// ex: VTEX Payments) antes de retornar aqui. Isso mantem este pacote reutilizavel
// em outros projetos, sem acoplar HTTP calls de um backend especifico.
type PreparedApplePayOrder = {
  orderReference: string
  orderId?: string
}

type ProcessPlacedOrderApp = {
  appName: string
  appPayload?: string
}

type ProcessPlacedOrderResult = {
  apps?: ProcessPlacedOrderApp[]
}

export type StartVtexApplePayFlowDeps = {
  /**
   * Deve concluir toda a criacao do pedido e o registro do pagamento no gateway
   * (ex: attachments VTEX + POST no paymentsUrl) antes de resolver, retornando
   * apenas as referencias necessarias para o restante do fluxo Apple Pay.
   */
  prepareOrder: () => Promise<PreparedApplePayOrder>
  processPlacedOrder: (orderReference: string) => Promise<ProcessPlacedOrderResult | undefined>
  cancelOrder: (orderId: string) => Promise<boolean>
  /**
   * Valor total do pedido como string decimal (ex: "99.90").
   * NecessÃ¡rio para criar a ApplePaySession sincronamente no handler de gesto do usuÃ¡rio,
   * antes de qualquer operaÃ§Ã£o assÃ­ncrona, conforme exigÃªncia do iOS Safari.
   */
  initialAmount: string
  onSuccess: (orderReference: string) => void
  onError: (message: string) => void
}

export type ClientOpenSessionFn = (
  payload: AppPayload
) => Promise<ApplePaySessionResponse>

export type ClientCancelFn = (
  appPayload: AppPayload,
  cancelRequest: ReturnType<typeof getApplePayCancelRequest>
) => Promise<void>

export type CieloApplePaySetupOptions = {
  clientOpenSession?: ClientOpenSessionFn
  clientCancel?: ClientCancelFn
  ClientRequestConfig?: Partial<ApplePayRequestConfig>
  strictDeviceValidation?: boolean
}

const DEFAULT_APPLE_PAY_REQUEST_CONFIG: Partial<ApplePayRequestConfig> = {
  countryCode: 'BR',
  currencyCode: 'BRL',
  merchantCapabilities: ['supports3DS', 'supportsCredit'],
  supportedNetworks: ['masterCard', 'visa'],
  requiredBillingContactFields: ['postalAddress'],
  requiredShippingContactFields: ['name', 'email', 'phone'],
  totalLabel: 'Cielo Store',
  totalType: 'final',
}

async function cancelPreparedOrder(
  prepared: PreparedApplePayOrder,
  cancelOrder: (orderId: string) => Promise<boolean>,
  onError: (message: string) => void
) {
  const candidates = [prepared.orderId, prepared.orderReference].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
  )

  for (const candidate of candidates) {
    const cancelled = await cancelOrder(candidate)
    if (cancelled) {
      return
    }
  }

  if (candidates.length > 0) {
    onError('Nao foi possivel confirmar o cancelamento automatico do pedido. Verifique o status em Meus pedidos.')
  }
}

export function CieloApplePaySetup() {
  let clientOpenSession: ClientOpenSessionFn | undefined
  let clientCancel: ClientCancelFn | undefined
  let strictDeviceValidation = true
  let ClientRequestConfig: Partial<ApplePayRequestConfig> = {
    ...DEFAULT_APPLE_PAY_REQUEST_CONFIG,
  }

  function Init(options?: CieloApplePaySetupOptions): void {
    clientOpenSession = options?.clientOpenSession
    clientCancel = options?.clientCancel
    strictDeviceValidation = options?.strictDeviceValidation ?? true
    ClientRequestConfig = {
      ...DEFAULT_APPLE_PAY_REQUEST_CONFIG,
      ...(options?.ClientRequestConfig ?? {}),
    }
  }

  async function startVtexApplePayFlow(deps: StartVtexApplePayFlowDeps): Promise<void> {
    const getStartupErrorMessage = (error: unknown) => {
      if (error instanceof Error && error.message) {
        return error.message
      }

      if (typeof error === 'string' && error.trim().length > 0) {
        return error
      }

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String((error as { message?: unknown }).message ?? '').trim()
        if (message) return message
      }

      return 'Nao foi possivel iniciar a sessao do Apple Pay.'
    }

    const isBrowserApplePayAvailable =
      typeof window !== 'undefined' &&
      typeof (window as Window & { ApplePaySession?: unknown }).ApplePaySession !== 'undefined'

    const client = createBrowserApplePayClient(3)

    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      deps.onError('Apple Pay requer HTTPS. Acesse a loja por um domÃ­nio seguro (https://) para usar este meio de pagamento.')
      return
    }

    if (!isBrowserApplePayAvailable) {
      deps.onError('Apple Pay indisponivel neste navegador. Use Safari em um dispositivo compativel.')
      return
    }

    if (strictDeviceValidation && !client.canMakePayments()) {
      deps.onError('Apple Pay nÃ£o estÃ¡ disponÃ­vel neste dispositivo.')
      return
    }

    // Contexto compartilhado entre os callbacks da sessÃ£o.
    // Preenchido de forma assÃ­ncrona dentro de onValidateMerchant.
    const ctx: {
      prepared: PreparedApplePayOrder | null
      fullPayload: AppPayload | null
    } = { prepared: null, fullPayload: null }

    // Delega ao app toda a criacao do pedido (e o registro do pagamento no
    // gateway, se aplicavel) via deps.prepareOrder. Esta rotina e iniciada no
    // clique, mas sem await antes de createSession, para preservar o contexto
    // de gesto exigido pelo iOS Safari.
    async function prepareVtexOrderBeforeOpenSession(): Promise<AppPayload> {
      const prepared = await deps.prepareOrder()
      ctx.prepared = prepared

      const processResult = await deps.processPlacedOrder(prepared.orderReference)
      const applePayApp = processResult?.apps?.find((app) => /ewallet|applepay|apple.pay/i.test(app.appName))

      if (!applePayApp?.appPayload) {
        throw new Error('Connector Cielo nÃ£o retornou paymentAppData para Apple Pay. Verifique a configuraÃ§Ã£o do connector.')
      }

      const parsedPayload = JSON.parse(applePayApp.appPayload) as AppPayload
      parsedPayload.MerchantUrl = window.location.origin.replace(/^https?:\/\//, '')

      return parsedPayload
    }

    // Dispara o preparo do pedido imediatamente, sem bloquear a criaÃ§Ã£o da sessÃ£o.
    const preparedPayloadPromise = prepareVtexOrderBeforeOpenSession()

    const request = getApplePayBaseRequest(
      { Amount: deps.initialAmount } as AppPayload,
      ClientRequestConfig
    )

    // Cria a ApplePaySession de forma sÃ­ncrona no clique (exigÃªncia do iOS Safari
    // para o construtor de ApplePaySession), mas sÃ³ exibe a wallet ao usuÃ¡rio
    // (session.begin()) depois que o pedido tiver sido criado na VTEX.
    try {
      const session = client.createSession(request, {
        onValidateMerchant: async () => {
          try {
            const preparedPayload = await preparedPayloadPromise
            const openSession = clientOpenSession ?? requestApplePaySession
            const sessionResponse = await openSession(preparedPayload)

            const fullPayload = JSON.parse(sessionResponse.Response) as AppPayload
            const mergedPayload: AppPayload = {
              ...preparedPayload,
              ...fullPayload,
              BearerToken: fullPayload.BearerToken ?? preparedPayload.BearerToken,
              AppleSessionResponse: fullPayload.AppleSessionResponse,
            }
            ctx.fullPayload = mergedPayload

            session.completeMerchantValidation(fullPayload.AppleSessionResponse)
          } catch (error) {
            session.completePaymentFailure()
            if (ctx.prepared) {
              void cancelPreparedOrder(ctx.prepared, deps.cancelOrder, deps.onError)
            }
            deps.onError((error as Error).message ?? 'Erro ao validar merchant Apple Pay.')
          }
        },
        onPaymentAuthorized: async (event: ApplePayPaymentEvent) => {
          const { prepared, fullPayload } = ctx

          if (!prepared || !fullPayload) {
            session.completePaymentFailure()
            deps.onError('Estado do fluxo Apple Pay invÃ¡lido.')
            return
          }

          const errors: unknown[] = []

          if (!isBillingContactValid(event.payment.billingContact)) {
            errors.push({ code: 'billingContactInvalid', contactField: 'postalCode', message: 'EndereÃ§o de cobranÃ§a incompleto.' })
            session.completePaymentFailure(errors)
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError)
            return
          }

          if (!isShippingContactValid(event.payment.shippingContact)) {
            errors.push({ code: 'shippingContactInvalid', contactField: 'givenName', message: 'Dados de contato incompletos.' })
            session.completePaymentFailure(errors)
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError)
            return
          }

          try {
            const walletRequest = getApplePayCompleteRequest(fullPayload, event)
            const approved = await requestApplePayComplete(fullPayload, walletRequest)

            if (!approved) {
              session.completePaymentFailure()
              deps.onError('Pagamento Apple Pay nÃ£o autorizado pelo emissor.')
              await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError)
              return
            }

            try {
              await deps.processPlacedOrder(prepared.orderReference)
            } catch {
              // Callback de confirmaÃ§Ã£o pode falhar sem bloquear o status final para o usuÃ¡rio.
            }

            session.completePaymentSuccess()
            deps.onSuccess(prepared.orderReference)
          } catch (error) {
            session.completePaymentFailure()
            deps.onError((error as Error).message ?? 'Erro ao processar pagamento Apple Pay.')
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError)
          }
        },
        onCancel: async () => {
          const { prepared, fullPayload } = ctx
          if (!fullPayload || !prepared) return

          const cancelRequest = getApplePayCancelRequest(fullPayload)
          const cancelPayment = clientCancel ?? requestApplePayCancel
          await cancelPayment(fullPayload, cancelRequest).catch(() => {
          })

          // onError Ã© no-op: o dismiss Ã© uma aÃ§Ã£o voluntÃ¡ria do usuÃ¡rio; falha de
          // rollback no OMS nÃ£o deve gerar toast de erro - o VTEX cancela
          // automaticamente por timeout de pagamento caso o cancel nÃ£o persista.
          await cancelPreparedOrder(prepared, deps.cancelOrder, () => {
          })
        },
      })

      // A wallet sÃ³ Ã© apresentada ao usuÃ¡rio depois que o pedido for criado na
      // VTEX (preparedPayloadPromise resolvida). Se a criaÃ§Ã£o do pedido falhar,
      // a sessÃ£o nunca Ã© iniciada e nenhum modal chega a aparecer.
      preparedPayloadPromise
        .then(() => {
          session.begin()
        })
        .catch((error) => {
          if (ctx.prepared) {
            void cancelPreparedOrder(ctx.prepared, deps.cancelOrder, deps.onError)
          }
          deps.onError(getStartupErrorMessage(error))
        })
    } catch (error) {
      deps.onError(getStartupErrorMessage(error))
    }
  }

  return {
    Init,
    startVtexApplePayFlow,
  }
}

const defaultSetup = CieloApplePaySetup()

export const Init = defaultSetup.Init
export const startVtexApplePayFlow = defaultSetup.startVtexApplePayFlow



