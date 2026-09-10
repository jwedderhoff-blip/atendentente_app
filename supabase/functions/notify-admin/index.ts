import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM = Deno.env.get('NOTIFY_FROM') ?? 'Meridio <noreply@meridio.app>'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CATEGORY_LABELS: Record<string, string> = {
  salao: 'Salão de Beleza', barbearia: 'Barbearia', estetica: 'Estética',
  beleza: 'Serviços de Beleza', pilates: 'Pilates', aulas_coletivas: 'Aulas Coletivas',
  avaliacao_fisica: 'Avaliação Física', avaliacao_nutricional: 'Avaliação Nutricional',
  academia: 'Academia', outro: 'Outro',
}

interface Payload {
  name?: string
  email?: string
  phone?: string
  category?: string
  slug?: string
  status?: string
}

/** Escapa texto vindo do cadastro antes de interpolar no HTML do e-mail. */
function esc(s: unknown): string {
  return String(s ?? '—')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildEmail(p: Payload, createdAt: string) {
  const when = new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const categoria = CATEGORY_LABELS[p.category ?? ''] ?? p.category ?? '—'
  const isTrial = (p.status ?? '').toLowerCase() === 'trial'

  const rows: [string, string][] = [
    ['Estabelecimento', esc(p.name)],
    ['Categoria', esc(categoria)],
    ['E-mail', esc(p.email)],
    ['Telefone', esc(p.phone)],
    ['Modo', isTrial ? 'Experimental (trial)' : esc(p.status)],
    ['Cadastrado em', esc(when)],
  ]

  return {
    subject: `Novo cadastro: ${p.name ?? 'estabelecimento'}${isTrial ? ' (trial)' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="color:#4f46e5;margin-bottom:4px">Novo cadastro na plataforma</h2>
        <p style="color:#6b7280;margin-top:0;font-size:14px">
          Um estabelecimento acabou de criar conta.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:40%">${k}</td>
              <td style="padding:8px 0;color:#111827;font-weight:500">${v}</td>
            </tr>`).join('')}
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">
          Gerencie planos e licenças no painel da plataforma.
        </p>
      </div>
    `,
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) return 'RESEND_API_KEY não configurada'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (!res.ok) return `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`
    return null
  } catch (e) {
    return `Exceção no envio: ${e instanceof Error ? e.message : String(e)}`
  }
}

/**
 * Aceita dois chamadores: o cron (service_role) e o super admin logado no
 * painel, que dispara o envio manualmente.
 */
async function isAuthorized(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return false
  if (token === SERVICE_ROLE_KEY) return true

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return false

  const { data: row } = await admin
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
  return !!row
}

Deno.serve(async (req) => {
  if (!(await isAuthorized(req))) {
    return new Response(JSON.stringify({ error: 'não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: cfg } = await admin
    .from('admin_notification_settings')
    .select('*')
    .maybeSingle()

  if (!cfg?.enabled) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'notificações desativadas', sent: 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data: pending } = await admin
    .from('admin_notifications')
    .select('id, event_type, payload, created_at')
    .eq('status', 'pendente')
    .order('created_at')
    .limit(50)

  let sent = 0
  let failed = 0

  for (const n of pending ?? []) {
    const { subject, html } = buildEmail(n.payload as Payload, n.created_at)
    const err = await sendEmail(cfg.notify_email, subject, html)

    await admin
      .from('admin_notifications')
      .update({
        status: err ? 'falhou' : 'enviado',
        error: err,
        sent_at: err ? null : new Date().toISOString(),
      })
      .eq('id', n.id)

    if (err) failed++
    else sent++
  }

  return new Response(
    JSON.stringify({ ok: true, sent, failed, pending: pending?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
