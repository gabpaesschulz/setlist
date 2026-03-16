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
