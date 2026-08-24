# Atendente App

App de agendamento online para profissionais liberais — salão de beleza, barbearia, centro de estética e estúdio de pilates.

## Funcionalidades

- **Agendamento online** — cliente escolhe serviço, profissional e horário disponível
- **Cadastro de clientes** — captura nome, telefone, email e dados para marketing
- **Catálogo de serviços** — personalizável por estabelecimento (preço, duração)
- **Lembretes automáticos** — WhatsApp e email antes do agendamento
- **Pagamento integrado** — MercadoPago (link de pagamento ou Pix)
- **Painel administrativo** — agenda do dia, gestão de clientes e relatórios

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | TailwindCSS v4 |
| Banco + Auth | Supabase (PostgreSQL + RLS) |
| Pagamentos | MercadoPago |
| Email | Resend |
| WhatsApp | Z-API |
| Deploy | Vercel |

## Setup local

```bash
# 1. Clone e instale
git clone https://github.com/jwedderhoff-blip/atendentente_app
cd atendentente_app
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 3. Crie as tabelas no Supabase
# Cole o conteúdo de supabase/schema.sql no SQL Editor do Supabase

# 4. Rode o projeto
npm run dev
```

## Banco de dados (Supabase)

Schema completo em `supabase/schema.sql`. Tabelas principais:

- `establishments` — cadastro do estabelecimento
- `professionals` — profissionais de cada estabelecimento
- `services` — catálogo de serviços
- `clients` — cadastro de clientes (com opt-in para marketing)
- `appointments` — agendamentos com status e pagamento
- `notifications` — log de lembretes enviados

Row Level Security habilitado: cada estabelecimento acessa apenas seus próprios dados.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/agendar` | Fluxo de agendamento para o cliente |
| `/admin` | Painel do profissional |

## Próximos passos

- [ ] Integrar catálogo de serviços com Supabase
- [ ] Grade de horários livres/ocupados
- [ ] Formulário de cadastro do cliente com validação
- [ ] Edge Function para envio de lembretes (Resend + Z-API)
- [ ] Integração MercadoPago (link de pagamento)
- [ ] Deploy na Vercel com variáveis de ambiente
