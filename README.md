# 🎵 Setlist — Seus Shows do Ano

Um PWA pessoal e premium para organizar seus shows, festivais e viagens musicais. Funciona 100% offline, local-first, instalável no iPhone como app nativo.

## Stack

| Tecnologia | Uso |
|---|---|
| **Next.js 16** (App Router) | Framework |
| **TypeScript** | Tipagem forte |
| **Tailwind CSS v4** | Estilização com CSS variables |
| **Zustand** | Estado global |
| **Dexie + IndexedDB** | Persistência local |
| **React Hook Form + Zod** | Formulários |
| **date-fns** | Datas em pt-BR |
| **Framer Motion** | Animações |
| **Recharts** | Gráficos |
| **next-themes** | Dark/light mode |

## Como rodar

```bash
npm install
npm run dev
# Acesse http://localhost:3000
```

## Build de produção

```bash
npm run build
npm start
```

## Testes

```bash
npm test
npm run test:coverage
npm run test:quick
```

## Qualidade de código (pre-commit)

```bash
npm run prepare
```

- O hook pre-commit executa lint com autofix via lint-staged
- Em seguida roda uma suíte rápida de testes críticos

## Simulador de compra antecipada

- Abra um evento e acesse a aba **Gastos**
- Configure **data alvo** e **limites por categoria** no simulador
- Salve o cenário para receber projeções **otimista**, **provável** e **conservadora**
- Use os alertas de risco financeiro/logístico e a recomendação por categoria para decidir compra

## Histórico operacional por evento

- Abra um evento e acesse a aba **Mais**
- Use o bloco **Histórico operacional** para rastrear alterações no planejamento
- Aplique filtros por **ação**, **entidade** e **período** (7, 30 ou 90 dias)
- O histórico acompanha os backups e restaurações do app

## Instalar no iPhone

1. Abra no **Safari** do iPhone
2. Toque em **Compartilhar** (ícone □↑)
3. Toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**

> O app funciona offline. Dados ficam no IndexedDB do dispositivo.

## Estrutura

```
src/
├── app/            # Rotas (/, /events, /expenses, /insights, /settings)
├── components/     # UI components (dashboard, events, shared, ui/)
├── stores/         # Zustand stores
├── lib/
│   ├── db/         # Dexie database + CRUD
│   ├── domain/     # Lógica de negócio pura
│   ├── demo/       # Dados de demonstração
│   └── formatters/ # Formatação pt-BR
├── schemas/        # Zod schemas
└── types/          # TypeScript types
```

## Roadmap

- [ ] Sync via iCloud/Google Drive
- [x] Notificações (D-7, D-1) via PWA
- [x] Upload de imagem de capa
- [x] Importação do Sympla/Eventim via URL
- [ ] Widget de countdown iOS
- [x] Compartilhar evento por link/QR code
- [x] Detectar evento duplicado ao importar por link compartilhado
- [x] Exportar evento para calendário (.ics)
- [x] Editar e remover item do roteiro com gesto de swipe

## Notificações (D-7, D-1)

- Ative em Configurações → Notificações → “Ativar lembretes”.
- O app dispara lembretes no dia D-7 e D-1 às 9h (horário local) quando você abrir o app; quando possível, usa o Service Worker para exibir a notificação.
- Ao tocar na notificação, o app abre diretamente a página do evento.
- Lembretes são deduplicados por evento e janela (D-7/D-1).
- Limitações: navegadores móveis e iOS têm restrições para agendamento em background. O app verifica as janelas ao abrir e em viradas de dia.

### Oportunidade de melhoria sugerida

- [x] Restauração seletiva por evento + validação de integridade no import
  - **Descrição detalhada:** o fluxo de importação agora valida schema/versionamento do backup antes de gravar no banco local e permite restaurar somente eventos selecionados sem apagar os demais.
  - **Critérios de aceitação:**
    - usuário consegue visualizar os eventos do backup antes de importar;
    - usuário pode restaurar todo o backup ou apenas eventos selecionados;
    - sistema rejeita arquivo inválido/incompatível sem corromper dados existentes;
    - referência inválida entre entidades do backup é bloqueada com erro claro.
  - **Complexidade estimada:** média.
  - **Valor de negócio:** aumenta confiança no recurso de backup, reduz risco de perda acidental e melhora retenção em uso contínuo local-first.

- [x] Backup automático versionado com retenção local
  - **Descrição detalhada:** snapshots locais automáticos (diário/semanal) com retenção configurável, listagem de pontos de restauração e restauração por ponto no tempo com confirmação.
  - **Critérios de aceitação:**
    - app cria snapshots automaticamente no uso normal sem bloquear a UI;
    - usuário pode ativar/desativar, escolher frequência e retenção;
    - usuário pode gerar snapshot manual e restaurar com confirmação;
    - retenção remove snapshots antigos conforme política configurada;
    - snapshots reutilizam o mesmo schema/versionamento do backup existente.
  - **Complexidade estimada:** média/alta.
  - **Valor de negócio:** eleva proteção contra perda de dados por erro humano e reforça confiabilidade local-first.

- [ ] Sincronização P2P local-first (WebRTC + CRDT)
  - **Descrição detalhada:** permitir sincronização opcional entre dois dispositivos do usuário usando pareamento por QR Code (WebRTC data channel) e resolução de conflitos via CRDT (ex.: Yjs). 100% E2E, sem servidor central, com troca apenas durante sessão ativa.
  - **Critérios de aceitação:**
    - pareamento simples: usuário abre “Sincronizar” em ambos os dispositivos e escaneia o QR;
    - alterações em eventos/itens aplicam-se no outro dispositivo em até 2s;
    - conflitos são resolvidos automaticamente e determinísticos (sem perda de dados);
    - nenhuma credencial é exposta; conexão fecha ao encerrar sessão; opção de “somente receber”;
    - funciona offline local (mesma rede) e via NAT traversal (STUN público).
  - **Complexidade estimada:** alta.
  - **Valor de negócio:** entrega sincronização multi-dispositivo preservando o posicionamento “local-first/privacidade”, reduz dependência de provedores (iCloud/Drive) e abre caminho para colaboração limitada no futuro.

- [x] Guardrails de orçamento por evento com alertas preditivos
  - **Descrição detalhada:** cada evento agora aceita orçamento total e orçamento por categoria no formulário. A aba de gastos mostra guardrail com análise de risco, projeção de gasto até a data do evento e categorias de maior pressão para apoiar ajuste do planejamento.
  - **Critérios de aceitação:**
    - usuário define orçamento total e por categoria no evento;
    - sistema calcula projeção de gasto final conforme ritmo de despesas já lançadas;
    - app exibe alertas visuais com níveis de risco (sob controle, atenção, risco alto, estouro);
    - seção de gastos destaca causas principais por categoria para orientar ajustes.
  - **Complexidade estimada:** média.
  - **Valor de negócio:** aumenta previsibilidade financeira, incentiva uso recorrente da área de gastos e reforça o valor prático do app no planejamento completo do show/viagem.

- [x] Linha do tempo operacional com histórico de alterações por evento
  - **Descrição detalhada:** adicionar uma timeline de mudanças (criação, edição, conclusão e restauração) para cada evento, com diff resumido por campo, permitindo rastrear decisões e recuperar contexto rapidamente.
  - **Critérios de aceitação:**
    - cada alteração relevante em evento, ticket, viagem, hospedagem, checklist, roteiro e gastos gera um registro temporal;
    - usuário consegue filtrar histórico por tipo de alteração e período;
    - cada item exibe antes/depois resumido e origem da ação (manual, importação, restauração);
    - histórico pode ser exportado junto ao backup sem quebrar compatibilidade com versões anteriores.
  - **Complexidade estimada:** alta.
  - **Valor de negócio:** melhora governança pessoal do planejamento, reduz retrabalho após mudanças frequentes e aumenta confiança em fluxos de restauração e sincronização futura.

- [x] Simulador de compra antecipada com cenários de preço
  - **Descrição detalhada:** incluir um simulador que compara comprar agora vs. esperar por promoções em ingresso, viagem e hospedagem, usando histórico de variação de preço por fornecedor para estimar risco de alta e economia potencial.
  - **Critérios de aceitação:**
    - usuário cria cenários de compra por evento com data alvo, fornecedor e limite por categoria;
    - sistema apresenta três cenários (conservador, provável e otimista) com recomendação;
    - app sinaliza quando esperar compromete meta financeira ou disponibilidade logística;
    - cenários são persistidos localmente e exportados/importados com o backup.
  - **Complexidade estimada:** alta (entregue).
  - **Valor de negócio:** melhora decisões de compra, reduz custo total e aumenta retenção no fluxo de gastos.

- [ ] Motor de planejamento anual com teto mensal e metas por cidade
  - **Descrição detalhada:** criar um módulo de planejamento financeiro anual que distribui orçamento global por mês/cidade, compara previsão versus realizado por eventos futuros e sugere realocação entre meses quando houver risco de extrapolação.
  - **Critérios de aceitação:**
    - usuário define orçamento anual e teto mensal por cidade ou global;
    - sistema projeta gasto futuro combinando eventos agendados, custos fixos e média histórica;
    - app alerta conflitos entre metas mensais e eventos planejados antes da compra;
    - usuário recebe sugestões acionáveis de realocação (adiar compra, reduzir categoria crítica ou mover meta entre meses).
  - **Complexidade estimada:** média/alta.
  - **Valor de negócio:** amplia o app de controle pontual para planejamento estratégico do ano, elevando retenção, previsibilidade e confiança em decisões de compra de ingressos/viagens.
