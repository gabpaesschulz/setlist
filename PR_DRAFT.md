# feat: centraliza hidratação do store e remove loadAll redundante

## Tarefa

- ROAD-201 — Centralização de hidratação do store e remoção de `loadAll` redundante

## Resumo das mudanças

- Introdução de hidratação idempotente no `events-store` com `ensureHydrated`, `refreshAll` e deduplicação de chamadas concorrentes.
- Centralização da hidratação inicial no `AppShell`.
- Remoção de `loadAll` redundante nas páginas Home, Gastos e Insights.
- Ajuste dos fluxos de Import, Restore de snapshot e Seed para usar refresh explícito pós-mutação.
- Proteção de telas de evento para evitar falso estado "não encontrado" durante bootstrap inicial.
- Inclusão de testes unitários/integrados para hidratação e atualização de `test:quick`.
- Atualização de README e ROADMAP com o novo fluxo e sugestões pós-análise técnica.

## Evidências de teste

- `npx vitest run src/stores/events-store.hydration.test.ts src/hooks/use-events-store.test.tsx src/components/app-shell/app-shell.integration.test.tsx src/stores/events-store.itinerary.test.ts src/stores/events-store.audit.integration.test.ts --coverage`
- `npm run test:quick`
- `npm run lint`

## Cobertura

- Cobertura dos novos testes de hidratação validada em cenários de sucesso, concorrência e refresh explícito.
- Cobertura total do subset executado: 12 testes passando.

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
