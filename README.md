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
- [ ] Notificações push (D-7, D-1)
- [x] Upload de imagem de capa
- [x] Importação do Sympla/Eventim via URL
- [ ] Widget de countdown iOS
- [x] Compartilhar evento por link/QR code
- [x] Detectar evento duplicado ao importar por link compartilhado
- [x] Exportar evento para calendário (.ics)
- [x] Editar e remover item do roteiro com gesto de swipe

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
