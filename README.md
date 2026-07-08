# cielo-applepay-headless-vtex

Pacotes de orquestração **Apple Pay** para checkouts headless integrados a **VTEX Checkout API** e **Cielo eWallet**.

---

## Pré-requisitos

Antes de instalar, certifique-se de que o seu projeto atende aos seguintes requisitos:

- **Node.js 18+** e **npm 7+** (ou Yarn 1.x)
- **React 19+** como peer dependency
- Site servido em **HTTPS** — o Apple Pay JS não funciona em HTTP
- **Domínio verificado** no Apple Developer Portal (arquivo `apple-developer-merchantid-domain-association` publicado na raiz do domínio)
- Connector **`braspag.cielo-ewallet-payment-app`** habilitado na sua conta VTEX

---

## Passo 1 — Instalar os pacotes

Execute o comando abaixo na raiz do seu projeto React:

```bash
npm install \
  "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core" \
  "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-adapter-vtex" \
  "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-react"
```

Ou adicione as entradas abaixo ao `package.json` do seu projeto e rode `npm install`:

```json
{
  "dependencies": {
    "@cielo/applepay-headless-vtex": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-core",
    "@cielo/applepay-headless-vtex-adapter": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-adapter-vtex",
    "@cielo/applepay-headless-vtex-react": "github:e2m-store/cielo-applepay-headless-vtex#path:packages/applepay-react"
  }
}
```

---

## Passo 2 — Configurar o SDK (uma única vez)

Chame `Init` **fora de qualquer componente**, no arquivo de entrada da sua aplicação (ex: `main.tsx`, `_app.tsx`, `layout.tsx`):

```ts
import { Init } from '@cielo/applepay-headless-vtex-adapter'

Init({
  strictDeviceValidation: true, // use false apenas para testes em ambiente sem Apple Pay
  ClientRequestConfig: {
    countryCode: 'BR',
    currencyCode: 'BRL',
    totalLabel: 'Nome da sua loja', // texto exibido no modal de pagamento da Apple
  },
})
```

---

## Passo 3 — Adicionar o botão Apple Pay

Crie um componente de checkout e use `ApplePayButton` junto com `startVtexApplePayFlow`:

```tsx
import { ApplePayButton } from '@cielo/applepay-headless-vtex-react'
import { startVtexApplePayFlow } from '@cielo/applepay-headless-vtex-adapter'
import { useState } from 'react'

export function CheckoutApplePay() {
  const [loading, setLoading] = useState(false)

  async function handleApplePayClick() {
    setLoading(true)

    await startVtexApplePayFlow({
      // 1. Cria o pedido na VTEX antes de abrir a wallet Apple Pay
      prepareOrder: async () => {
        // Aqui você executa o fluxo do seu checkout:
        // - adicionar perfil, endereço, forma de pagamento ao orderForm
        // - chamar /api/checkout/pub/orders para fechar o pedido
        return {
          orderReference: 'GRUPO_DO_PEDIDO', // orderGroup retornado pela VTEX
          orderId: 'ID_DO_PEDIDO',           // orderId retornado pela VTEX
        }
      },

      // 2. Obtém os dados do gateway após o pedido ser criado
      processPlacedOrder: async (orderReference) => {
        // Chame: GET /api/checkout/pub/gatewayCallback/{orderReference}
        // e retorne os apps de pagamento
        return {
          apps: [
            {
              appName: 'braspag.cielo-ewallet-payment-app',
              appPayload: '...', // payload retornado pelo endpoint acima
            },
          ],
        }
      },

      // 3. Cancela o pedido caso o usuário feche a wallet ou o pagamento falhe
      cancelOrder: async (orderId) => {
        // Chame sua API de cancelamento no OMS da VTEX
        return true
      },

      initialAmount: '99.90', // valor total do pedido como string
      onSuccess: (orderReference) => {
        // Redirecione para a página de confirmação do pedido
        window.location.href = `/checkout/orderPlaced?og=${orderReference}`
      },
      onError: (message) => {
        console.error('Erro no Apple Pay:', message)
        setLoading(false)
      },
    })
  }

  return (
    <ApplePayButton onClick={handleApplePayClick} loading={loading} />
  )
}
```

---

## Passo 4 — Usar o componente na sua página de checkout

```tsx
import { CheckoutApplePay } from './CheckoutApplePay'

export function CheckoutPage() {
  return (
    <div>
      {/* ... outros elementos do checkout ... */}
      <CheckoutApplePay />
    </div>
  )
}
```

---

## Observações importantes

- O botão Apple Pay **só aparece** em dispositivos Apple com Safari e Apple Pay configurado. Em outros navegadores o componente não renderiza nada.
- Para testar sem um dispositivo Apple, use `strictDeviceValidation: false` no `Init`.
- O `initialAmount` deve ser o valor final do pedido (frete + produtos). Você pode atualizá-lo dinamicamente antes de chamar `startVtexApplePayFlow`.

---

## Pacotes incluídos

| Pacote | Descrição |
|---|---|
| [`@cielo/applepay-headless-vtex`](./packages/applepay-core) | Núcleo agnóstico de framework/gateway (contratos, orquestrador, client) |
| [`@cielo/applepay-headless-vtex-adapter`](./packages/applepay-adapter-vtex) | Integração pronta VTEX Checkout + Cielo eWallet |
| [`@cielo/applepay-headless-vtex-react`](./packages/applepay-react) | Hooks e componentes React (`useApplePay`, `ApplePayButton`, `ApplePayModal`) |

---

## Para a equipe Cielo — publicar uma nova versão

> Esta seção é exclusiva para quem **mantém e distribui** este repositório. Clientes não precisam seguir estes passos.

**Pré-requisito:** ter Node.js e Yarn instalados.

```bash
# 1. Instalar as dependências de desenvolvimento
yarn install

# 2. Compilar todos os pacotes
yarn build

# 3. Commitar os arquivos compilados
git add packages/*/dist
git commit -m "chore: build v0.x.x"

# 4. Criar uma tag de versão (opcional, recomendado)
git tag v0.x.x

# 5. Publicar no GitHub
git push
git push --tags
```

Após o `git push`, os clientes já podem instalar a versão mais recente com `npm install`.

---

## Licença

MIT
