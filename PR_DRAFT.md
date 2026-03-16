# feat: linha do tempo operacional por evento

## Tarefa

- ROAD-101 — Linha do tempo operacional com histórico de alterações por evento

## Resumo das mudanças

- Criação de componente dedicado de histórico operacional com filtros por ação, entidade e período.
- Paginação incremental de registros com botão de carregamento adicional.
- Extração de funções utilitárias para labels de auditoria com documentação JSDoc.
- Integração da timeline na página de detalhe do evento.
- Atualização do README e ROADMAP com status e instruções de uso.

## Evidências de teste

- `npm run test -- src/lib/domain/audit-log-presenter.test.ts src/components/events/operational-timeline-section.integration.test.tsx src/stores/events-store.audit.integration.test.ts src/lib/db/audit-trail.integration.test.ts`
- `npx vitest run --coverage src/lib/domain/audit-log-presenter.test.ts src/components/events/operational-timeline-section.integration.test.tsx`
- `npm run lint`

## Cobertura

- Cobertura dos novos arquivos acima de 80%:
  - `src/components/events/operational-timeline-section.tsx`: 90.32% linhas / 83.33% branches
  - `src/lib/domain/audit-log-presenter.ts`: 100% linhas / 100% branches

## Checklist

- [x] Funcionalidade implementada
- [x] Testes unitários adicionados
- [x] Testes de integração adicionados
- [x] Lint executado sem erros
- [x] README atualizado
- [x] ROADMAP atualizado

## Observações

- O repositório já possui mudanças locais pré-existentes não relacionadas nesta branch. Recomenda-se revisar o escopo final antes do commit/push.
