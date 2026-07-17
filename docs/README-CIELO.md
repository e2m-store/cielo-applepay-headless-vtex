# cielo-applepay-headless-vtex - Guia Interno Cielo

Este arquivo e exclusivo para manutencao e distribuicao do SDK pela equipe Cielo.

---

## Objetivo

Padronizar o fluxo de release e publicacao dos pacotes:

- @conectores_cielo/cielo-applepay-headless-vtex-core
- @conectores_cielo/cielo-applepay-headless-vtex-adapter
- @conectores_cielo/cielo-applepay-headless-vtex-react

---

## Estrategia oficial

- Canal oficial de distribuicao: npm publico
- GitHub e fonte de codigo, CI e automacao de release
- Clientes devem consumir por nome de pacote e versao semantica

---

## Workflows

- Validacao de qualidade: .github/workflows/ci.yml
- Publicacao no npm por tag: .github/workflows/release-npm.yml

---

## Pre-requisitos internos

1. Permissao de publish no escopo @conectores_cielo no npm
2. Secret NPM_TOKEN configurado no repositorio GitHub
3. Branch main atualizada

## Convencao do campo private

- O arquivo `package.json` da raiz do monorepo deve permanecer com `"private": true`.
- Motivo: evitar publicacao acidental do workspace raiz no npm.
- Os pacotes publicaveis em `packages/*/package.json` devem permanecer com `"private": false`.
- Essa combinacao e o padrao correto para monorepo com workspaces e publicacao por pacote.

---

## Checklist de release

1. Atualizar versoes:
- packages/applepay-core/package.json
- packages/applepay-adapter-vtex/package.json
- packages/applepay-react/package.json

2. Garantir consistencia das dependencias internas

3. Validar localmente:

```bash
yarn install
yarn build
yarn test:coverage
```

4. Garantir que PR passou no CI

5. Criar e publicar tag semantica:

```bash
git tag v0.x.x
git push origin v0.x.x
```

6. Confirmar execucao do workflow release-npm

7. Validar publicacao dos 3 pacotes no npm

---

## Publicacao manual (contingencia)

```bash
yarn workspace @conectores_cielo/cielo-applepay-headless-vtex-core npm publish --access public
yarn workspace @conectores_cielo/cielo-applepay-headless-vtex-adapter npm publish --access public
yarn workspace @conectores_cielo/cielo-applepay-headless-vtex-react npm publish --access public
```

---

## Checklist pronto - proxima release (modelo v0.1.2)

Use este bloco como modelo copiavel para cada nova release.

### 1) Definir versao alvo

- [ ] Versao alvo definida: `v0.1.2`
- [ ] Tipo de release validado: `patch` | `minor` | `major`

### 2) Atualizar versoes dos pacotes

- [ ] `packages/applepay-core/package.json` atualizado para `0.1.2`
- [ ] `packages/applepay-adapter-vtex/package.json` atualizado para `0.1.2`
- [ ] `packages/applepay-react/package.json` atualizado para `0.1.2`

### 3) Alinhar dependencias internas

- [ ] `applepay-adapter-vtex` depende de `@conectores_cielo/cielo-applepay-headless-vtex-core@^0.1.2`
- [ ] `applepay-react` depende de:
- [ ] `@conectores_cielo/cielo-applepay-headless-vtex-core@^0.1.2`
- [ ] `@conectores_cielo/cielo-applepay-headless-vtex-adapter@^0.1.2`

### 4) Validacao local obrigatoria

```bash
yarn install
yarn build
yarn test:coverage
```

- [ ] Build local OK
- [ ] Testes OK
- [ ] Cobertura gerada

### 5) Confirmacoes de CI e segredo

- [ ] PR aprovado e mergeado em `main`
- [ ] Workflow CI verde
- [ ] Secret `NPM_TOKEN` configurado no repositorio

### 6) Criar e publicar tag

```bash
git tag v0.1.2
git push origin v0.1.2
```

- [ ] Tag criada e publicada

### 7) Acompanhar release automatizada

- [ ] Workflow `release-npm` iniciou
- [ ] Step de testes executou com sucesso
- [ ] Autenticacao npm validada (`npm whoami`)
- [ ] Publicacao de core finalizada
- [ ] Publicacao de adapter finalizada
- [ ] Publicacao de react finalizada

### 8) Pos-publicacao

- [ ] Pacotes visiveis no npm
- [ ] Instalacao de teste em projeto limpo executada

```bash
npm i @conectores_cielo/cielo-applepay-headless-vtex-core@^0.1.2 @conectores_cielo/cielo-applepay-headless-vtex-adapter@^0.1.2 @conectores_cielo/cielo-applepay-headless-vtex-react@^0.1.2
```

- [ ] Release comunicada internamente


