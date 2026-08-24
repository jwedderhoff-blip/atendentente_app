# Atendente App — CLAUDE.md

Sistema de agendamento online para profissionais liberais (salões, barbearias, estética, pilates).

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Estilo**: TailwindCSS 4 (via `@tailwindcss/vite`), cor primária `purple-600`
- **Roteamento**: react-router-dom 7
- **Formulários**: react-hook-form + zod
- **Ícones**: lucide-react
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deploy**: Vercel (`vercel.json` presente)

## Estrutura de pastas

```
src/
  assets/          Imagens estáticas
  components/
    layout/        AdminLayout (sidebar do painel admin)
    ui/            Componentes reutilizáveis (Button, Input, Modal, Calendar, Badge, TimeSlotGrid, DemoBanner)
  context/
    AuthContext    Sessão do Supabase Auth
  hooks/           Hooks de dados (ver seção abaixo)
  lib/
    supabase.ts    Cliente Supabase (graceful — não joga erro se variáveis ausentes)
    isDemo.ts      Flag booleana de modo demo
    mockData.ts    Dados simulados realistas para modo demo
    utils.ts       Utilitários genéricos (cn, formatação)
  pages/
    Home.tsx       Landing page pública
    Login.tsx      Autenticação
    Register.tsx   Cadastro
    Booking.tsx    Página de agendamento pública (/agendar/:slug)
    NotFound.tsx   Página 404
    admin/         Páginas do painel (Dashboard, Agenda, Clientes, Servicos, Profissionais, Configuracoes)
  types/
    index.ts       Interfaces TypeScript (Establishment, Service, Professional, Client, Appointment, WorkingHours, TimeSlot)
supabase/
  schema.sql       DDL completo do banco
  functions/       Edge Functions (send-reminder, create-payment)
```

## Como rodar

```bash
npm install
npm run dev        # Inicia em http://localhost:5173
npm run build      # Build de produção (tsc + vite build)
npm run lint       # oxlint
npm run preview    # Preview do build
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Sem essas variáveis, o app roda automaticamente em **modo demo**.

## Modo demo

Quando `VITE_SUPABASE_URL` não está definida ou contém o valor padrão `https://SEU_PROJETO.supabase.co`, o módulo `src/lib/isDemo.ts` exporta `isDemo = true`.

Nesse modo:
- Todos os hooks retornam dados de `src/lib/mockData.ts` imediatamente, sem fazer chamadas ao Supabase.
- Mutações (criar cliente, criar agendamento, etc.) operam apenas sobre o state local com `crypto.randomUUID()`.
- Um banner amarelo fixo no topo avisa o usuário que está em modo demonstração (`DemoBanner`).
- Os dados simulados incluem: 1 estabelecimento (Salão Bella Vita / slug `bella-vita`), 3 serviços, 2 profissionais, 3 clientes e 5 agendamentos distribuídos em hoje e os próximos 2 dias.

## Arquitetura dos hooks

Todos os hooks em `src/hooks/` seguem o padrão:

```ts
import { isDemo } from '../lib/isDemo'
import { mockXxx } from '../lib/mockData'

export function useXxx(param) {
  // ...
  const fetchData = useCallback(async () => {
    if (isDemo) {
      setData(mockXxx)
      setLoading(false)
      return
    }
    // chamada normal ao Supabase...
  }, [param])
}
```

Hooks disponíveis:
- `useEstablishment(userId)` — estabelecimento do usuário autenticado
- `useEstablishmentBySlug(slug)` — estabelecimento público pelo slug
- `useServices(establishmentId)` — + createService / updateService / deleteService
- `useProfessionals(establishmentId)` — + createProfessional / updateProfessional / deleteProfessional
- `useClients(establishmentId)` — + createClient / exportCsv
- `useAppointments(establishmentId, date?)` — + createAppointment / updateStatus
- `useAvailability({ establishmentId, professionalId, serviceId, date, durationMinutes })` — calcula slots disponíveis

## Schema do banco (resumo)

| Tabela | Campos principais |
|---|---|
| `establishments` | id, name, slug, category, phone, email, address, owner_id |
| `professionals` | id, establishment_id, name, avatar_url |
| `professional_services` | professional_id, service_id (relação N:N) |
| `services` | id, establishment_id, name, duration_minutes, price, active |
| `clients` | id, establishment_id, name, phone, email, notes |
| `appointments` | id, establishment_id, client_id, professional_id, service_id, starts_at, ends_at, status, payment_status |
| `working_hours` | id, establishment_id, day_of_week (0-6), open_time, close_time, is_open |
| `notifications` | id, appointment_id, channel, sent_at, status |

RLS ativado em todas as tabelas; dono do estabelecimento acessa tudo via `owner_id = auth.uid()`.

## Branch padrão de desenvolvimento

`main` — enviar PRs diretamente para `main` neste estágio inicial.
