# @cielo/applepay-headless-vtex-react

Hooks e componentes React para orquestrar o fluxo **Apple Pay** em checkouts headless, construídos sobre [`@cielo/applepay-headless-vtex`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex).

## Instalação

```bash
npm install "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-react" "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-adapter-vtex" "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core"
```

Ou via `package.json`:

```json
{
  "dependencies": {
    "@cielo/applepay-headless-vtex-react": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-react",
    "@cielo/applepay-headless-vtex-adapter": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-adapter-vtex",
    "@cielo/applepay-headless-vtex": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core"
  }
}
```

Requer `react` `^19.0.0` como peer dependency.

> Requer **npm 7+** ou **Yarn 1.x**. O repositório deve ser público ou o cliente deve ter acesso de leitura.

## `ApplePayButton`

Renderiza o botão oficial `<apple-pay-button>`, carregando o SDK da Apple sob demanda.

```tsx
import { ApplePayButton } from '@cielo/applepay-headless-vtex-react'

<ApplePayButton onClick={handleApplePayClick} loading={isProcessing} />
```

## `useApplePay`

Hook de baixo nível que orquestra a sessão via `createApplePayOrchestrator` do core, dado um `connector` e `transactions` (gateway) já implementados.

```tsx
import { useApplePay } from '@cielo/applepay-headless-vtex-react'

const { start, loading, error } = useApplePay({
  transactions: myTransactionGateway,
  connector: myApplePayConnector,
  client: myApplePayClient,
  onSuccess: (orderGroup) => console.log('Pedido confirmado:', orderGroup),
  onError: (message) => console.error(message),
})

<ApplePayButton onClick={start} loading={loading} />
{error && <p role="alert">{error}</p>}
```

> Para integração direta com VTEX + Cielo eWallet, prefira usar `startVtexApplePayFlow` de [`@cielo/applepay-headless-vtex-adapter`](https://www.npmjs.com/package/@cielo/applepay-headless-vtex-adapter), que já implementa `connector`/`transactions` prontos.

## `ApplePayModal`

Componente de fallback com `onCancel` para exibir estado de processamento fora do modal nativo do Apple Pay JS (uso avançado).

## Licença

MIT
