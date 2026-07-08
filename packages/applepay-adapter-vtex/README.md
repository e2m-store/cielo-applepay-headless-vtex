# @cielo/applepay-headless-vtex-adapter

Integração pronta de **Apple Pay** para checkouts headless construídos sobre **VTEX Checkout API + Cielo eWallet**. Este é o pacote recomendado para a maioria dos integradores — cuida da sessão Apple Pay JS, validação de merchant, autorização e cancelamento, delegando ao seu app apenas a criação do pedido VTEX.

## Instalação

```bash
yarn add @cielo/applepay-headless-vtex-adapter @cielo/applepay-headless-vtex
```

## Requisitos

- Site servido em **HTTPS** (Apple Pay JS exige contexto seguro).
- Domínio verificado no Apple Developer (arquivo `apple-developer-merchantid-domain-association`).
- Connector `braspag.cielo-ewallet-payment-app` habilitado na conta VTEX.

## Uso básico

```ts
import { Init, startVtexApplePayFlow } from '@cielo/applepay-headless-vtex-adapter'

// Configuração global (uma vez, fora do componente/handler de clique)
Init({
  strictDeviceValidation: true, // false para testar em navegadores sem `canMakePayments()`
  ClientRequestConfig: {
    countryCode: 'BR',
    currencyCode: 'BRL',
    totalLabel: 'Minha Loja',
  },
})

// No clique do botão "Finalizar compra com Apple Pay"
async function handleApplePayClick() {
  await startVtexApplePayFlow({
    // Cria o pedido na VTEX e registra o pagamento no gateway antes de abrir a wallet.
    prepareOrder: async () => {
      // ... sua lógica de checkout (profile/shipping/payment attachments + /orders)
      return { orderReference: 'ORDER_GROUP', orderId: 'ORDER_ID' }
    },
    processPlacedOrder: async (orderReference) => {
      // Chama /api/checkout/pub/gatewayCallback/{orderGroup} e retorna os apps de pagamento
      return { apps: [{ appName: 'braspag.cielo-ewallet-payment-app', appPayload: '...' }] }
    },
    cancelOrder: async (orderId) => {
      // Cancela o pedido no OMS caso o usuário feche a wallet ou o pagamento falhe
      return true
    },
    initialAmount: '99.90',
    onSuccess: (orderReference) => console.log('Pedido confirmado:', orderReference),
    onError: (message) => console.error(message),
  })
}
```

## API

### `Init(options?)`

Configura o comportamento global do fluxo antes do primeiro uso.

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `clientOpenSession` | `(payload) => Promise<ApplePaySessionResponse>` | chamada padrão ao connector Cielo | Sobrescreve como a sessão Apple Pay é aberta |
| `clientCancel` | `(payload, request) => Promise<void>` | chamada padrão ao connector Cielo | Sobrescreve o cancelamento na wallet |
| `ClientRequestConfig` | `Partial<ApplePayRequestConfig>` | `BR`/`BRL`, `supports3DS`/`supportsCredit` | Configuração da `ApplePayPaymentRequest` |
| `strictDeviceValidation` | `boolean` | `true` | Se `false`, ignora `canMakePayments()` (útil para testes) |

### `startVtexApplePayFlow(deps)`

Inicia a sessão Apple Pay. Veja `StartVtexApplePayFlowDeps` nos tipos exportados para a assinatura completa de `prepareOrder`, `processPlacedOrder` e `cancelOrder`.

## Pacotes relacionados

- [`@cielo/applepay-headless-vtex`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex) — núcleo agnóstico usado internamente por este adapter.
- [`@cielo/applepay-headless-vtex-react`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex-react) — hooks e componentes React prontos.

## Licença

MIT
