# Roadmap de Produto

## Entregas recentes

- [x] Guardrails de orçamento por evento com alertas preditivos
  - **Descrição detalhada:** cada evento aceita orçamento total e orçamento por categoria no formulário. A seção de gastos exibe análise de risco, projeção de gasto até a data do evento e categorias de maior pressão para apoiar ajustes.
  - **Critérios de aceitação:**
    - usuário define orçamento total e por categoria no evento;
    - sistema projeta gasto final conforme ritmo de despesas já lançadas;
    - app exibe alertas visuais por nível de risco;
    - seção de gastos destaca categorias com maior pressão sobre o orçamento.
  - **Complexidade estimada:** média.
  - **Valor de negócio:** melhora previsibilidade financeira e aumenta uso recorrente da área de gastos.

- [x] Simulador de compra antecipada com cenários de preço
  - **Descrição detalhada:** simulador por evento para comparar comprar agora vs aguardar em ingresso, viagem e hospedagem, com persistência de configuração, cenários otimista/provável/conservador e recomendação por categoria.
  - **Critérios de aceitação:**
    - usuário cria cenário por evento com data alvo e limites por categoria;
    - sistema exibe cenários conservador, provável e otimista com impacto no total;
    - app alerta risco financeiro e risco logístico por proximidade do evento;
    - recomendação por categoria orienta melhor janela de compra.
  - **Complexidade estimada:** alta.
  - **Valor de negócio:** melhora qualidade da decisão de compra, reduz custo total e diferencia o produto com inteligência de planejamento.

- [x] Linha do tempo operacional com histórico de alterações por evento
  - **Descrição detalhada:** timeline operacional no detalhe do evento com registros de alterações em entidades críticas, diffs resumidos por campo e filtros por ação, entidade e período.
  - **Critérios de aceitação:**
    - alterações relevantes de evento, ingresso, viagem, hospedagem, gastos, roteiro, checklist e reflexão são registradas;
    - usuário filtra histórico por tipo de alteração, entidade e recorte temporal (7, 30 e 90 dias);
    - itens mostram resumo, tags de entidade/ação e campos alterados;
    - histórico permanece compatível com exportação/importação de backup.
  - **Complexidade estimada:** alta.
  - **Valor de negócio:** reduz tempo para auditoria pessoal de mudanças, melhora rastreabilidade de decisões e aumenta confiança em restaurações.

## Oportunidade de melhoria sugerida

- [ ] Motor de planejamento anual com teto mensal e metas por cidade
  - **Descrição detalhada:** criar um módulo de planejamento financeiro anual que distribui orçamento global por mês/cidade, compara previsão versus realizado por eventos futuros e sugere realocação entre meses quando houver risco de extrapolação.
  - **Critérios de aceitação:**
    - usuário define orçamento anual e teto mensal por cidade ou global;
    - sistema projeta gasto futuro combinando eventos agendados, custos fixos e média histórica;
    - app alerta conflitos entre metas mensais e eventos planejados antes da compra;
    - usuário recebe sugestões acionáveis de realocação (adiar compra, reduzir categoria crítica ou mover meta entre meses).
  - **Complexidade estimada:** média/alta.
  - **Valor de negócio:** amplia o app de controle pontual para planejamento estratégico do ano, elevando retenção, previsibilidade e confiança em decisões de compra.

## Sugestões técnicas priorizadas (matriz impacto x esforço)

- [ ] Cobertura de testes da store de eventos e fluxos críticos de persistência
  - **Descrição detalhada:** aumentar cobertura de `events-store` para fluxos de atualização, importação, exclusão e recuperação por seletores, reduzindo regressões em mudanças de estado.
  - **Critérios de aceitação mensuráveis:**
    - cobertura de linhas da store >= 80%;
    - cenários de erro (falha de persistência) cobertos em ações críticas;
    - validação em CI com bloqueio em caso de queda abaixo do threshold.
  - **Estimativa:** 8 SP.
  - **Riscos técnicos:** alto acoplamento de mocks pode aumentar manutenção dos testes.
  - **Valor de negócio quantificado:** redução estimada de 30% em bugs regressivos de fluxo CRUD e restore.
  - **Dependências:** estabilização dos contratos de ação da store e mocks compartilhados de DB.
  - **Impacto x esforço:** alto impacto / médio esforço (**prioridade P1**).

- [ ] Otimização de renderização no simulador e seções com cálculos reativos
  - **Descrição detalhada:** reduzir recomputações em componentes de gastos/simulação com memoização explícita e simplificação de dependências de hooks.
  - **Critérios de aceitação mensuráveis:**
    - eliminar warnings de `react-hooks/exhaustive-deps` nos componentes de gastos/simulação;
    - reduzir em pelo menos 20% o tempo médio de render em interações do simulador;
    - manter resultado funcional equivalente em testes de integração.
  - **Estimativa:** 5 SP.
  - **Riscos técnicos:** mudanças em dependências de hooks podem introduzir stale state se mal aplicadas.
  - **Valor de negócio quantificado:** melhoria estimada de 15-20% na fluidez percebida da UX em telas de evento.
  - **Dependências:** baseline de medição de performance em ambiente de desenvolvimento.
  - **Impacto x esforço:** médio impacto / baixo esforço (**prioridade P1**).

- [ ] Harden de qualidade contínua com lint sem warnings e cobertura por módulo
  - **Descrição detalhada:** evoluir pipeline local para reduzir warnings recorrentes e adicionar metas por domínio (UI, store, DB, domain).
  - **Critérios de aceitação mensuráveis:**
    - `npm run lint` sem warnings em módulos prioritários;
    - relatório de cobertura por domínio publicado em cada execução de CI;
    - regra de bloqueio para novos warnings em arquivos alterados.
  - **Estimativa:** 3 SP.
  - **Riscos técnicos:** endurecimento abrupto pode aumentar fricção inicial em contribuições.
  - **Valor de negócio quantificado:** redução estimada de 20% no retrabalho de revisão e aceleração de onboarding técnico.
  - **Dependências:** alinhamento com stakeholders sobre política de qualidade incremental.
  - **Impacto x esforço:** alto impacto / baixo esforço (**prioridade P0**).

## Sugestões pós-análise técnica (matriz impacto x esforço)

- [ ] Centralização de hidratação do store e remoção de `loadAll` redundante
  - **Descrição detalhada:** hoje múltiplas páginas disparam `loadAll()` em paralelo, gerando I/O redundante no IndexedDB e re-renders de inicialização. Centralizar hidratação em ponto único e aplicar refresh orientado a ação.
  - **Critérios de aceitação mensuráveis:**
    - apenas um fluxo de hidratação inicial é executado por ciclo de abertura do app;
    - redução mínima de 30% no tempo de carregamento percebido da home em dispositivo de referência;
    - zero regressões nos fluxos de `import`, `restore` e `reset`;
    - cobertura automatizada dos gatilhos de hidratação e refresh >= 80%.
  - **Story points:** 5.
  - **Riscos técnicos:** risco de estado desatualizado se gatilhos de refresh não forem mapeados corretamente.
  - **Valor de negócio quantificado:** ganho estimado de 20-30% na responsividade inicial e redução de retrabalho por inconsistência de dados em ~20%.
  - **Dependências:** definição de estratégia de hydration global e alinhamento entre AppShell e páginas de domínio.
  - **Impacto x esforço:** alto impacto / baixo-médio esforço.
  - **Status com stakeholders:** pendente alinhamento para priorização de curto prazo.

- [ ] Refatoração do `events-store` para pipeline único de mutação + auditoria
  - **Descrição detalhada:** consolidar padrão repetido de mutate + `buildAuditLogPayload` + persistência em helper transacional, reduzindo duplicação e risco de divergência entre domínios.
  - **Critérios de aceitação mensuráveis:**
    - redução mínima de 25% no tamanho do módulo da store sem perda de funcionalidade;
    - todas as ações auditáveis passam por um pipeline comum com contratos tipados;
    - cobertura unitária/integrada da trilha de auditoria da store >= 85%;
    - nenhuma regressão funcional nas seções de evento/gastos/roteiro/checklist.
  - **Story points:** 8.
  - **Riscos técnicos:** alterações em ações críticas podem introduzir regressões de estado e ordem de logs.
  - **Valor de negócio quantificado:** redução estimada de 30% no custo de manutenção da store e queda de 20% em bugs regressivos ligados a auditoria.
  - **Dependências:** baseline de testes de store e validação com produto para granularidade de logs.
  - **Impacto x esforço:** alto impacto / médio esforço.
  - **Status com stakeholders:** pendente alinhamento técnico-produto.

- [ ] Hardening de segurança para backups locais (criptografia opcional por senha)
  - **Descrição detalhada:** dados de backup hoje ficam em JSON puro. Adicionar criptografia no export/import com senha opcional e validação de integridade para reduzir exposição em caso de compartilhamento indevido de arquivo.
  - **Critérios de aceitação mensuráveis:**
    - export suporta modo protegido por senha e modo compatível legada;
    - import falha com mensagem clara para senha inválida ou payload adulterado;
    - tempo de export/import protegido aumenta no máximo 15% para backups de referência;
    - cobertura automatizada de fluxos protegidos >= 85% no domínio de backup.
  - **Story points:** 8.
  - **Riscos técnicos:** gestão de chave no cliente; compatibilidade retroativa de backups antigos; UX para recuperação de senha.
  - **Valor de negócio quantificado:** redução estimada de 60% no risco de vazamento acidental de dados pessoais em compartilhamento de backup.
  - **Dependências:** validação de schema/versionamento de backup já existente; definição de UX com stakeholders.
  - **Impacto x esforço:** alto impacto / médio esforço.
  - **Status com stakeholders:** pendente alinhamento para entrar no backlog oficial.

- [ ] Refatoração de performance do store principal com fatias por domínio
  - **Descrição detalhada:** o store central concentra múltiplos domínios e tende a aumentar re-render e acoplamento. Separar em fatias (evento, custos, backup, auditoria) com seletores estáveis e boundaries de responsabilidade.
  - **Critérios de aceitação mensuráveis:**
    - redução mínima de 25% nos re-renders da tela de evento em fluxo de edição;
    - tempo médio de interação em ações de gastos reduzido em pelo menos 20%;
    - cobertura de store slices >= 80% com testes unitários e de integração;
    - nenhuma regressão funcional nos fluxos de backup/auditoria.
  - **Story points:** 13.
  - **Riscos técnicos:** migração gradual de seletores; risco de regressão em ações compostas; necessidade de padronização de contratos entre slices.
  - **Valor de negócio quantificado:** ganho estimado de 15% em fluidez percebida e redução de suporte por inconsistência de estado em cerca de 20%.
  - **Dependências:** baseline de métricas de render; estabilização do módulo de planejamento anual.
  - **Impacto x esforço:** alto impacto / alto esforço.
  - **Status com stakeholders:** pendente alinhamento para priorização trimestral.

- [ ] Governança de retenção para histórico operacional (TTL + compactação)
  - **Descrição detalhada:** com o crescimento da auditoria por evento, implementar política de retenção configurável e compactação de mudanças antigas para evitar degradação em dispositivos com armazenamento limitado.
  - **Critérios de aceitação mensuráveis:**
    - retenção configurável por janela (90, 180, 365 dias) sem perda de integridade do evento;
    - compactação reduz pelo menos 40% do volume de auditLogs em bases com >5 mil registros;
    - consulta de histórico mantém latência p95 abaixo de 120ms em dispositivos de referência;
    - testes automatizados cobrem retenção, compactação e export/import com compatibilidade retroativa.
  - **Story points:** 8.
  - **Riscos técnicos:** definição de estratégia de compactação sem perder contexto crítico; reconciliação de registros compactados em restore.
  - **Valor de negócio quantificado:** redução estimada de 30% no uso de armazenamento local e melhora de ~20% no tempo de abertura da tela de evento em bases grandes.
  - **Dependências:** alinhamento de regras de retenção com stakeholders e UX de configuração em ajustes avançados.
  - **Impacto x esforço:** alto impacto / médio esforço.
  - **Status com stakeholders:** pendente alinhamento para entrada no backlog oficial.

- [ ] Hardening de links externos + política de cache segura no Service Worker
  - **Descrição detalhada:** restringir URLs de ticket/viagem/hospedagem para `http/https` em schema e normalização de dados, além de aplicar política de cache seletivo no Service Worker (same-origin + tipos permitidos) para reduzir risco de cache indevido e superfícies de ataque.
  - **Critérios de aceitação mensuráveis:**
    - campos de URL rejeitam esquemas não permitidos com erro de validação claro;
    - links já salvos fora do padrão são normalizados ou bloqueados sem quebrar render da tela;
    - Service Worker deixa de cachear requests GET de origem externa não autorizada;
    - tamanho médio do cache offline reduz ao menos 25% em uso típico.
  - **Story points:** 5.
  - **Riscos técnicos:** compatibilidade com dados legados e possível impacto em experiência offline se a whitelist ficar excessivamente restritiva.
  - **Valor de negócio quantificado:** redução estimada de 50% no risco de exposição por links maliciosos e melhora de 20% na estabilidade do cache em dispositivos móveis.
  - **Dependências:** definição de lista de hosts confiáveis e revisão de UX para mensagens de validação.
  - **Impacto x esforço:** alto impacto / baixo-médio esforço.
  - **Status com stakeholders:** pendente alinhamento para priorização de segurança.

- [ ] Consolidação do simulador de compra antecipada em módulo único
  - **Descrição detalhada:** unificar motor de domínio e componentes de UI do simulador para eliminar lógica duplicada, padronizar recomendações e reduzir custo de manutenção de testes.
  - **Critérios de aceitação mensuráveis:**
    - apenas uma implementação de engine de simulação permanece ativa no domínio;
    - apenas um componente canônico de simulador é renderizado no detalhe do evento;
    - cobertura automatizada do módulo consolidado >= 80% (unit + integração);
    - diferença máxima de 2% entre valores projetados antes/depois da consolidação nos cenários de regressão.
  - **Story points:** 8.
  - **Riscos técnicos:** regressão de comportamento esperado em eventos já configurados e migração de contratos entre componentes.
  - **Valor de negócio quantificado:** redução estimada de 30% no esforço de manutenção do módulo e menor incidência de divergência funcional em releases.
  - **Dependências:** decisão arquitetural do módulo canônico e atualização do pacote de testes relacionado.
  - **Impacto x esforço:** alto impacto / médio esforço.
  - **Status com stakeholders:** pendente alinhamento técnico-produto.

## Priorização recomendada (impacto vs esforço)

- **P1:** Centralização de hidratação do store e remoção de `loadAll` redundante (alto impacto / baixo-médio esforço)
- **P2:** Hardening de links externos + política de cache segura no Service Worker (alto impacto / baixo-médio esforço)
- **P3:** Hardening de segurança para backups locais (alto impacto / médio esforço)
- **P4:** Refatoração do `events-store` para pipeline único de mutação + auditoria (alto impacto / médio esforço)
- **P5:** Governança de retenção para histórico operacional (alto impacto / médio esforço)
- **P6:** Consolidação do simulador de compra antecipada em módulo único (alto impacto / médio esforço)
- **P7:** Motor de planejamento anual com teto mensal e metas por cidade (alto impacto / médio-alto esforço)
- **P8:** Refatoração de performance do store principal com fatias por domínio (alto impacto / alto esforço)
