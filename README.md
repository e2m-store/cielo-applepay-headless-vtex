# cielo-applepay-headless-vtex

Pacotes de orquestracao Apple Pay para checkouts headless integrados a VTEX Checkout API e Cielo eWallet.

---

## Pre-requisitos

Antes de instalar, certifique-se de que o seu projeto atende aos seguintes requisitos:

- Node.js 18+ e npm 7+ (ou Yarn 1.x)
- React 19+ como peer dependency
- Site servido em HTTPS (Apple Pay JS nao funciona em HTTP)
- Dominio verificado no Apple Developer Portal (arquivo apple-developer-merchantid-domain-association publicado na raiz do dominio)
- Connector braspag.cielo-ewallet-payment-app habilitado na conta VTEX

---

## Passo 1 - Instalar os pacotes

Use sempre os pacotes publicados no npm (modelo recomendado para SDK):

```bash
npm install @conectores_cielo/cielo-applepay-headless-vtex-core @conectores_cielo/cielo-applepay-headless-vtex-adapter @conectores_cielo/cielo-applepay-headless-vtex-react
```

Ou com Yarn:

```bash
yarn add @conectores_cielo/cielo-applepay-headless-vtex-core @conectores_cielo/cielo-applepay-headless-vtex-adapter @conectores_cielo/cielo-applepay-headless-vtex-react
```

---

## Passo 2 - Configurar o SDK (uma unica vez)

Chame Init fora de qualquer componente, no arquivo de entrada da aplicacao (ex: main.tsx, _app.tsx, layout.tsx):

```ts
import { Init } from '@conectores_cielo/cielo-applepay-headless-vtex-adapter'

Init({
  strictDeviceValidation: true,
  ClientRequestConfig: {
    countryCode: 'BR',
    currencyCode: 'BRL',
    totalLabel: 'Nome da sua loja',
  },
})
```

---

## Passo 3 - Adicionar o botao Apple Pay

Crie um componente de checkout e use ApplePayButton junto com startVtexApplePayFlow:

```tsx
import { ApplePayButton } from '@conectores_cielo/cielo-applepay-headless-vtex-react'
import { startVtexApplePayFlow } from '@conectores_cielo/cielo-applepay-headless-vtex-adapter'
import { useState } from 'react'

export function CheckoutApplePay() {
  const [loading, setLoading] = useState(false)

  async function handleApplePayClick() {
    setLoading(true)

    await startVtexApplePayFlow({
      prepareOrder: async () => ({
        orderReference: 'GRUPO_DO_PEDIDO',
        orderId: 'ID_DO_PEDIDO',
      }),
      processPlacedOrder: async () => ({
        apps: [
          {
            appName: 'braspag.cielo-ewallet-payment-app',
            appPayload: '...',
          },
        ],
      }),
      cancelOrder: async () => true,
      initialAmount: '99.90',
      onSuccess: (orderReference) => {
        window.location.href = `/checkout/orderPlaced?og=${orderReference}`
      },
      onError: (message) => {
        console.error('Erro no Apple Pay:', message)
        setLoading(false)
      },
    })
  }

  return <ApplePayButton onClick={handleApplePayClick} loading={loading} />
}
```

---

## Observacoes importantes

- O botao Apple Pay so aparece em dispositivos Apple com Safari e Apple Pay configurado
- Para testar sem dispositivo Apple, use strictDeviceValidation: false no Init
- O initialAmount deve ser o valor final do pedido (frete + produtos)

---

## Pacotes incluidos

| Pacote | Descricao |
|---|---|
| @conectores_cielo/cielo-applepay-headless-vtex-core | Nucleo agnostico de framework/gateway |
| @conectores_cielo/cielo-applepay-headless-vtex-adapter | Integracao pronta VTEX Checkout + Cielo eWallet |
| @conectores_cielo/cielo-applepay-headless-vtex-react | Hooks e componentes React (useApplePay, ApplePayButton, ApplePayModal) |

---

## Consumo recomendado para clientes

```bash
npm install @conectores_cielo/cielo-applepay-headless-vtex-core@^0.x @conectores_cielo/cielo-applepay-headless-vtex-adapter@^0.x @conectores_cielo/cielo-applepay-headless-vtex-react@^0.x
```

---

## Documentacao interna Cielo

Para processo de release/publicacao e operacao interna, consulte docs/README-CIELO.md.

---

## Licenca

MIT


