# petsearch

Portal mobile-first para avisos de animais perdidos e encontrados em Indaiatuba (SP).
O projeto usa React + TypeScript, Express 5 e PostgreSQL 17 em containers.

## Rodar localmente

Requisitos: Docker com Compose e Node.js 22.12 ou superior.

```sh
npm ci
docker compose up -d db
npm run dev:api
```

Em outro terminal, inicie o frontend:

```sh
npm run dev:web
```

O Vite mostra a URL local do frontend. Para subir a aplicação compilada em containers,
use `docker compose up --build`; a interface e a API serão servidas pelo serviço `app`.

## Contas de demonstração

O seed local cria avisos fictícios e estas contas (senha das duas: `senha-demo-123`):

- Tutora: `tutora.demo@exemplo.test`
- Moderação: `moderacao.demo@exemplo.test`

Use apenas esses dados fictícios no ambiente de demonstração. O aviso da Luna também é
fictício.

## Moderação

O cadastro sempre cria uma conta comum. Para dar ou retirar o papel de moderação de uma conta
que já existe, rode `npm run moderator -- email@dominio [--revoke]` (no container:
`docker compose exec app node apps/api/dist/admin/moderator.js email@dominio`). Confirme quem é
a pessoa antes de liberar o acesso.

## Verificações

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run check:trace
docker compose up -d db
npx playwright install chromium
npm run build
npx playwright test
```

Os E2E usam a base isolada `petsearch_e2e`, zerada no início de cada execução, e cobrem
os viewports mobile de 360×800 e 412×915. Os testes de API usam `petsearch_test`.
