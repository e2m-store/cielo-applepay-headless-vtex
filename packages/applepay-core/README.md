# @cielo/applepay-headless-vtex

Núcleo (core) agnóstico de framework e de gateway para orquestração do fluxo Apple Pay JS em checkouts headless. Não depende de VTEX, React ou qualquer backend específico — define apenas os contratos e o estado de sessão do Apple Pay.

Se você está integrando **VTEX + Cielo eWallet**, normalmente não usa este pacote diretamente. Instale [`@cielo/applepay-headless-vtex-adapter`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex-adapter), que já traz a integração pronta.

Use este pacote diretamente apenas se estiver construindo um **adapter customizado** para outro gateway/conector de pagamento.

## Instalação

```bash
npm install "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core"
```

Ou via `package.json`:

```json
{
  "dependencies": {
    "@cielo/applepay-headless-vtex": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core"
  }
}
```

> Requer **npm 7+** ou **Yarn 1.x**. O repositório deve ser público ou o cliente deve ter acesso de leitura.

## Conceitos principais

- `createBrowserApplePayClient(version)` — cria o client que encapsula o `window.ApplePaySession`.
- `createApplePayOrchestrator(deps)` — orquestra o ciclo de vida completo da sessão (validação de merchant, autorização de pagamento, cancelamento).
- `ApplePayConnector` / `TransactionGateway` — contratos que um adapter precisa implementar para plugar seu próprio gateway de pagamento.
- `getApplePayBaseRequest`, `getApplePayCompleteRequest`, `getApplePayCancelRequest` — helpers para montar os payloads exigidos pelo Apple Pay JS API.
- `isBillingContactValid`, `isShippingContactValid` — validação dos dados de contato retornados pela Apple.

## Construindo um adapter customizado

```ts
import {
  createApplePayOrchestrator,
  createBrowserApplePayClient,
  type ApplePayConnector,
  type TransactionGateway,
} from '@cielo/applepay-headless-vtex'

const transactions: TransactionGateway = {
  prepareTransaction: async () => { /* cria pedido no seu backend */ },
  finalizeTransaction: async (orderGroup) => { /* confirma pedido */ },
  failTransaction: async (orderId) => { /* cancela pedido */ },
}

const connector: ApplePayConnector = {
  openMerchantSession: async (appPayload) => { /* abre sessão no seu gateway */ },
  completePayment: async (appPayload, request) => { /* autoriza pagamento */ },
  cancelPayment: async (appPayload, request) => { /* cancela na wallet */ },
}

const orchestrator = createApplePayOrchestrator({
  transactions,
  connector,
  client: createBrowserApplePayClient(3),
  onSuccess: (orderGroup) => console.log('Pedido confirmado:', orderGroup),
  onError: (message) => console.error(message),
})

await orchestrator.start()
```

## Pacotes relacionados

- [`@cielo/applepay-headless-vtex-adapter`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex-adapter) — integração pronta com VTEX Checkout + Cielo eWallet.
- [`@cielo/applepay-headless-vtex-react`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex-react) — hooks e componentes React (`useApplePay`, `ApplePayButton`, `ApplePayModal`).

## Licença

MIT
