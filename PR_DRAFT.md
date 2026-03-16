# feat: endurece cache do service worker com política same-origin

## Tarefa

- ROAD-2 — Endurecer política de cache do Service Worker

## Resumo das mudanças

- Atualização da política de cache em `public/sw.js` para aceitar apenas requests `GET` same-origin com destinos permitidos.
- Bloqueio explícito de rotas sensíveis (`/api`, `/_next/image`, `/artist-image`) para reduzir superfície de risco.
- Estratégia `network-first` para navegação e `stale-while-revalidate` para recursos cacheáveis.
- Retenção de cache runtime com limite de entradas para prevenir crescimento indefinido.
- Inclusão de testes unitários e de integração para sucesso, falha de rede e edge cases de interceptação.
- Atualização de `test:quick`, README e ROADMAP com a nova entrega.

## Evidências de teste

- `npm run test:coverage -- src/lib/domain/service-worker-cache-policy.test.ts src/lib/db/service-worker.integration.test.ts`
- `npm run test:quick`
- `npm run lint`

## Cobertura

- Cobertura de `sw.js` validada em 90% de statements e 83.33% de branches.
- Testes cobrindo casos de sucesso, erro de rede, fallback offline e edge cases de bloqueio por política.

## Checklist

- [x] Funcionalidade implementada
- [x] Testes unitários adicionados
- [x] Testes de integração adicionados
- [x] Lint executado sem erros
- [x] README atualizado
- [x] ROADMAP atualizado
- [ ] Squash de commits aplicado (se necessário)
- [ ] Evidências visuais anexadas (screenshots/gifs)
- [ ] Link da tarefa original anexado no PR

## Observações

- Esta branch foi criada a partir de `main` atualizada com `origin/main` em fast-forward.
- Abertura de PR e merge/deploy em produção dependem do fluxo remoto (GitHub/CI) fora deste ambiente local.
