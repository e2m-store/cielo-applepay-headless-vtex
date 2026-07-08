# cielo-applepay-headless-vtex

Monorepo com os pacotes de orquestração **Apple Pay** para checkouts headless integrados a **VTEX Checkout API** e **Cielo eWallet**.

> Repositório de testes. A migração para o repositório oficial de produção da Cielo será feita posteriormente.

## Pacotes

| Pacote | Descrição |
|---|---|
| [`@cielo/applepay-headless-vtex`](./packages/applepay-core) | Núcleo agnóstico de framework/gateway (contratos, orquestrador, client) |
| [`@cielo/applepay-headless-vtex-adapter`](./packages/applepay-adapter-vtex) | Integração pronta VTEX Checkout + Cielo eWallet |
| [`@cielo/applepay-headless-vtex-react`](./packages/applepay-react) | Hooks e componentes React (`useApplePay`, `ApplePayButton`, `ApplePayModal`) |

## Desenvolvimento

```bash
yarn install
yarn build
```

Cada pacote é buildado com [`tsup`](https://tsup.egoist.dev/) gerando saída ESM + CJS + `.d.ts`.

## Licença

MIT
