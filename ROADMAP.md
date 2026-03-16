# Roadmap de Produto e Engenharia (Baseado no Estado Atual)

## Análise do estado atual

### Arquitetura
- Aplicação Next.js (App Router) com React e TypeScript.
- Estado global centralizado em Zustand (`events-store`) com múltiplos domínios de negócio.
- Persistência local offline-first em IndexedDB via Dexie, com suporte a backup, restore e import/export.
- Camadas bem separadas entre `app`, `components`, `lib/domain`, `lib/db`, `schemas`, `stores` e `types`.

### Performance
- Hidratação de dados ocorre em mais de um ponto de entrada, com chamadas redundantes de carregamento.
- O carregamento inicial busca tabelas completas em alguns fluxos, elevando I/O e custo de render em bases grandes.
- Páginas relevantes ainda consomem store global sem seletor fino em pontos críticos, causando re-renderizações amplas.

### Experiência do usuário
- Produto já entrega alto valor com simulador de compra antecipada, guardrails de orçamento, auditoria operacional e compartilhamento.
- Há espaço para reduzir latência percebida na abertura e melhorar mensagens de erro orientadas à ação.
- Fluxos de settings e backup são robustos, porém podem evoluir em clareza de feedback e segurança percebida.

### Segurança
- Política de cache do Service Worker pode ser endurecida para reduzir superfície de risco e crescimento indevido de cache.
- Campos de URL externa em módulos de ingresso/viagem/hospedagem podem ser validados com regras mais estritas.
- Backups locais em JSON sem proteção opcional por senha expõem dados sensíveis em cenários de compartilhamento indevido.

### Funcionalidades existentes
- CRUD completo de eventos e subentidades (ingresso, viagem, hospedagem, gastos, roteiro, checklist e reflexão).
- Simulação de compra antecipada com cenários e recomendação por categoria.
- Timeline operacional auditável por evento.
- Compartilhamento por link/QR e importação segura com deduplicação.
- Notificações D-7/D-1, backup automático e restauração completa/seletiva.

## Melhorias prioritárias (alto impacto para o usuário)

### 1) Centralizar hidratação do store em fluxo único idempotente
- **Descrição detalhada:** mover a hidratação inicial para um único ponto canônico da aplicação e transformar o refresh em gatilhos explícitos por ação (import, restore, reset), removendo chamadas redundantes.
- **Justificativa do impacto no usuário:** reduz tempo de abertura percebido e inconsistências ocasionais de dados entre telas, melhorando fluidez e confiança.
- **Estimativa de esforço:** 5 SP (médio).
- **Dependências técnicas:** ajuste no `AppShell`, revisão dos pontos que invocam `loadAll`, testes de hidratação e restore.
- **Critérios de sucesso mensuráveis:** p95 de abertura da Home reduzido em >= 30%; apenas 1 hidratação inicial por ciclo de abertura; 0 regressões em import/restore/reset na suíte de testes.

### 2) Endurecer política de cache do Service Worker
- **Descrição detalhada:** limitar cache a same-origin e recursos permitidos, aplicar estratégia de revalidação e política de retenção para evitar crescimento descontrolado.
- **Justificativa do impacto no usuário:** melhora estabilidade offline e reduz riscos de comportamento inesperado com conteúdo externo.
- **Estimativa de esforço:** 3 SP (baixo-médio).
- **Dependências técnicas:** atualização de `public/sw.js`, testes de fluxo offline e validação do impacto em notificações.
- **Critérios de sucesso mensuráveis:** redução >= 25% no tamanho médio do cache em uso típico; 0 cache de origem externa não autorizada; taxa de sucesso em navegação offline mantida >= baseline atual.

### 3) Validar e normalizar URLs externas nos formulários críticos
- **Descrição detalhada:** aplicar validação `http/https` em schema, normalização antes de persistir e fallback seguro para dados legados fora do padrão.
- **Justificativa do impacto no usuário:** reduz risco de links maliciosos e aumenta confiança ao abrir links de compra/viagem/hospedagem.
- **Estimativa de esforço:** 3 SP (baixo-médio).
- **Dependências técnicas:** atualização de `schemas`, ajustes em seções de formulário e estratégia de migração para registros existentes.
- **Critérios de sucesso mensuráveis:** 100% dos novos links validados por schema; 0 quebra de render para dados legados; cobertura automatizada >= 85% dos fluxos de validação de URL.

### 4) Introduzir criptografia opcional para backup/export
- **Descrição detalhada:** adicionar modo protegido por senha (ex.: AES-GCM + verificação de integridade) para export/import, mantendo compatibilidade com backups legados.
- **Justificativa do impacto no usuário:** protege dados pessoais em compartilhamento de arquivo e eleva percepção de segurança do produto.
- **Estimativa de esforço:** 8 SP (médio-alto).
- **Dependências técnicas:** versionamento do formato de backup, UX para senha e testes de compatibilidade retroativa.
- **Critérios de sucesso mensuráveis:** 100% dos backups protegidos exigem senha válida; falha com mensagem clara para senha incorreta/payload adulterado; impacto de tempo em export/import protegido <= 15%.

### 5) Otimizar consumo do Zustand com seletores granulares
- **Descrição detalhada:** substituir assinaturas amplas do store por seletores específicos com comparação rasa, reduzindo renderizações em cascata.
- **Justificativa do impacto no usuário:** melhora responsividade em interações frequentes de gastos, insights e detalhe de evento.
- **Estimativa de esforço:** 5 SP (médio).
- **Dependências técnicas:** mapeamento dos componentes mais custosos, refatoração incremental de hooks e validação visual/regressão.
- **Critérios de sucesso mensuráveis:** redução >= 25% de re-renders em fluxos de edição de evento; tempo médio de interação reduzido em >= 20% nas telas priorizadas.

### 6) Particionar carregamento de dados por contexto de tela
- **Descrição detalhada:** evoluir carregamento inicial para fatias por domínio/tela, evitando leitura completa de todas as tabelas quando não necessário.
- **Justificativa do impacto no usuário:** acelera telas com menor necessidade de dados e melhora performance em bases grandes.
- **Estimativa de esforço:** 8 SP (médio-alto).
- **Dependências técnicas:** redesign de acesso no `events-store`, contratos de carregamento incremental e ajustes em cache local.
- **Critérios de sucesso mensuráveis:** redução >= 35% no tempo de fetch inicial em telas parciais; latência p95 da Home e Insights abaixo de baseline acordada.

### 7) Melhorar feedback de erro com mensagens acionáveis
- **Descrição detalhada:** substituir capturas genéricas por mapeamento de erros de domínio para mensagens orientadas à resolução e ação do usuário.
- **Justificativa do impacto no usuário:** diminui frustração em falhas de backup/import/notificação e reduz abandono de fluxo.
- **Estimativa de esforço:** 3 SP (baixo-médio).
- **Dependências técnicas:** catálogo de erros de domínio, padrão de mensagens na UI e testes de integração dos cenários de falha.
- **Critérios de sucesso mensuráveis:** >= 90% dos erros críticos exibem mensagem específica; redução >= 30% de retries manuais em fluxos de settings durante testes de usabilidade.

### 8) Definir allowlist de imagens remotas no Next
- **Descrição detalhada:** trocar padrão amplo de hosts remotos por lista explícita e auditável de domínios permitidos para `next/image`.
- **Justificativa do impacto no usuário:** melhora previsibilidade de carregamento de mídia e reduz exposição a fontes externas não confiáveis.
- **Estimativa de esforço:** 2 SP (baixo).
- **Dependências técnicas:** levantamento de domínios reais usados por capa de evento e atualização de `next.config.ts`.
- **Critérios de sucesso mensuráveis:** 100% das imagens carregadas via domínios aprovados; 0 quebra em upload/importação válidos após ajuste.

## Ordem recomendada de execução
1. Centralizar hidratação do store.
2. Endurecer cache do Service Worker.
3. Validar e normalizar URLs externas.
4. Otimizar seletores no Zustand.
5. Melhorar feedback de erro.
6. Definir allowlist de imagens remotas.
7. Particionar carregamento por contexto de tela.
8. Introduzir criptografia opcional para backup/export.
