# 🎵 Setlist — Seus Shows do Ano

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-0ea5e9)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-5a0fc8)
![Vitest](https://img.shields.io/badge/testes-Vitest-6e9f18)

## Introdução

O **Setlist** é um aplicativo pessoal para planejamento de shows, festivais e viagens musicais, com foco em experiência **local-first**, funcionamento **offline** e instalação como **PWA**.

A aplicação foi desenhada para acompanhar o ciclo completo de cada evento:
- organização de informações do show (ingresso, viagem, hospedagem e checklist),
- gestão de gastos e risco financeiro,
- tomada de decisão de compra antecipada,
- rastreabilidade de alterações e proteção de dados locais com backup/restauração.

## Funcionalidades

### Funcionalidades principais da aplicação

- Cadastro e edição de eventos com formulário estruturado por seções.
- Dashboard com visão consolidada dos próximos compromissos.
- Lista de eventos com filtros e navegação por detalhe.
- Área de gastos e página de insights para acompanhamento financeiro.
- Planejamento de roteiro e checklist por evento.
- Compartilhamento e importação de evento via link e QR Code.
- Exportação de evento para calendário (`.ics`).
- Tema claro/escuro e interface otimizada para mobile.

### Recursos implementados (itens concluídos do roadmap)

- Notificações PWA de lembrete em janelas **D-7** e **D-1**.
- Upload de imagem de capa para evento.
- Importação de evento do Sympla/Eventim por URL.
- Compartilhamento de evento por link e QR Code.
- Detecção de evento duplicado ao importar via link compartilhado.
- Edição e remoção de item de roteiro com gesto de swipe.
- Restauração seletiva por evento com validação de integridade no import.
- Backup automático versionado com retenção local configurável.
- Guardrails de orçamento por evento com alertas preditivos.
- Linha do tempo operacional com histórico de alterações por evento.
- Simulador de compra antecipada com cenários conservador, provável e otimista.
- Hidratação centralizada de estado para reduzir leituras redundantes no IndexedDB.

## Pré-requisitos

### Requisitos do sistema

- **Node.js** instalado (recomendado usar versão LTS recente).
- **npm** disponível no ambiente.
- Navegador moderno com suporte a **IndexedDB** para persistência local.
- Para experiência completa de PWA/notificações: navegador com suporte a **Service Worker** e **Notifications API**.

## Instalação

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

3. Inicie em desenvolvimento:

```bash
npm run dev
```

4. Acesse em `http://localhost:3000`.

## Configuração

Este projeto **não exige variáveis de ambiente obrigatórias** para rodar localmente no fluxo principal.

Configurações úteis de qualidade e execução:
- `npm run prepare`: instala os hooks do Husky (pre-commit com lint-staged + testes relacionados).
- `npm run lint`: executa validação de lint.
- `npm run lint:fix`: corrige automaticamente problemas de lint aplicáveis.

## Uso

### Fluxo rápido da aplicação

1. Crie um evento e preencha dados de ingresso, viagem e hospedagem.
2. Abra a aba de gastos para registrar despesas e definir orçamento por categoria.
3. Use o simulador de compra antecipada para comparar cenários de preço.
4. Acompanhe o histórico operacional no detalhe do evento (filtros por ação, entidade e período).
5. Gere backups locais e faça restauração total ou seletiva quando necessário.

### Exemplos de comandos

Executar testes:

```bash
npm test
```

Executar suíte rápida crítica:

```bash
npm run test:quick
```

Gerar build de produção:

```bash
npm run build
npm run start
```

### Instalação no iPhone (PWA)

1. Abra o app no **Safari**.
2. Toque em **Compartilhar** (ícone □↑).
3. Selecione **Adicionar à Tela de Início**.
4. Confirme em **Adicionar**.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **Next.js 16 (App Router)** | Framework web |
| **React 19** | Interface e composição de componentes |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS v4** | Estilização |
| **Zustand** | Gerenciamento de estado |
| **Dexie + IndexedDB** | Persistência local-first |
| **React Hook Form + Zod** | Formulários e validação |
| **date-fns** | Manipulação de datas |
| **Recharts** | Visualização de dados |
| **Framer Motion** | Animações |
| **Vitest + Testing Library** | Testes unitários e de integração |

## Contribuição

Contribuições são bem-vindas. Fluxo recomendado:

1. Crie uma branch a partir de `main` no padrão:
   - `feature/ROAD-<id>-descricao-curta`
2. Implemente e valide com:
   - `npm run lint`
   - `npm run test`
3. Abra PR com base em `main`, usando o template de [PR_DRAFT.md](./PR_DRAFT.md).
4. Atualize documentação relevante (README e ROADMAP) junto com a entrega.

## Licença

Este projeto ainda **não possui licença definida** no repositório.
