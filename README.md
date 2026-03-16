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
```

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

- [ ] Centro de confiabilidade de dados (backup automático + restauração por evento)
  - **Descrição detalhada:** criar um fluxo de backup local versionado (JSON compactado), com restauração seletiva por evento e validação de integridade antes da importação.
  - **Critérios de aceitação:**
    - usuário consegue gerar backup manual e automático sem perder dados existentes;
    - usuário consegue restaurar apenas eventos selecionados sem sobrescrever o restante;
    - sistema detecta arquivo inválido e mostra feedback claro, sem corromper o banco local;
    - operação de backup/restauração mantém compatibilidade com estrutura de dados atual.
  - **Complexidade estimada:** média/alta.
  - **Valor de negócio:** reduz risco percebido de perda de dados, aumenta confiança no uso contínuo e melhora retenção de usuários que dependem do app como fonte principal de planejamento.
