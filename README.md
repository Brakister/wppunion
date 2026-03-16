# 💬 WA HelpDesk — Next.js

Sistema profissional de atendimento via WhatsApp. Stack moderna, sem bugs de banco, pronto para produção.

## Stack

| Camada   | Tecnologia |
|----------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + CSS Modules |
| Backend  | Next.js API Routes + custom server.js |
| Banco    | SQLite via **Prisma** (sem compilação nativa no Windows!) |
| WA       | Baileys (WhatsApp Web) |
| Realtime | Socket.io |
| Auth     | JWT (jsonwebtoken) |

## Instalação

### Pré-requisitos
- Node.js 18+
- npm 8+

### 1. Instalar dependências

```bash
cd wa-helpdesk
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
# Edite o .env e troque JWT_SECRET por uma chave segura
```

`.env`:
```
DATABASE_URL="file:./prisma/database.db"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3000
```

### 3. Criar banco de dados

```bash
npx prisma db push
```

### 4. Iniciar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

### 5. Acessar

```
http://localhost:3000
```

→ Clique em **"Criar Conta"** — o primeiro usuário vira admin automaticamente.

→ Clique em **"Desconectado"** para escanear o QR Code do WhatsApp.

---

## Scripts úteis

```bash
# Reset sessão WhatsApp (QR travado)
npm run reset

# Reset banco + sessão (apaga tudo)
npm run reset:full

# Reset só banco
npm run reset:db

# Abrir Prisma Studio (visualizar banco)
npm run db:studio
```

---

## Estrutura

```
wa-helpdesk/
├── server.js              # Entry point: Next.js + Socket.io + WhatsApp
├── prisma/
│   └── schema.prisma      # Schema do banco (Prisma ORM)
├── src/
│   ├── app/
│   │   ├── api/           # API Routes (Next.js)
│   │   ├── login/         # Página de login/cadastro
│   │   └── dashboard/     # Dashboard principal
│   ├── lib/
│   │   ├── prisma.ts      # Cliente Prisma singleton
│   │   ├── auth.ts        # JWT helpers
│   │   ├── socket.server.js   # Socket.io server
│   │   ├── whatsapp.server.js # Baileys service
│   │   └── seed.js        # Dados iniciais
│   └── types/index.ts     # TypeScript types
├── sessions/              # Sessão Baileys (auto-criado)
├── uploads/               # Arquivos enviados (auto-criado)
└── scripts/reset.js       # Script de emergência
```

---

## Funcionalidades

- ✅ Multi-atendente no mesmo número WA
- ✅ Mensagens em tempo real (Socket.io)
- ✅ Histórico dos últimos 2 dias
- ✅ Mídia real: imagem, áudio, vídeo, documento (baixa do WA)
- ✅ Notas internas (não enviadas ao cliente)
- ✅ Prefixo do atendente nas mensagens (`*Victor:*\nmensagem`)
- ✅ Capture de msgs enviadas do celular (fromMe)
- ✅ Sem duplicata de conversa (normalização de JID)
- ✅ Tags, departamentos, status
- ✅ Dashboard admin com estatísticas
- ✅ Indicador de digitando
- ✅ Notificações sonoras

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| QR não aparece | `npm run reset` |
| Banco corrompido | `npm run reset:db` |
| Sessão em loop | `npm run reset:full` |
| Porta em uso | Mude `PORT` no `.env` |
| `prisma: command not found` | `npx prisma db push` |
