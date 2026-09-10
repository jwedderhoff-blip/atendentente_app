import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!

/**
 * Webhook do MercadoPago (link de pagamento e Pix).
 * O MP notifica este endpoint quando o status de um pagamento muda.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks
 *
 * IMPORTANTE: o MP pode reenviar a mesma notificação mais de uma vez —
 * este handler precisa ser idempotente (seguro de rodar repetido para o mesmo pagamento).
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  // O MP manda o id do pagamento tanto via query string (?data.id=...&type=payment)
  // quanto no corpo da requisição, dependendo do tipo de integração. Cobrimos os dois.
  const url = new URL(req.url)
  let paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  const topic = url.searchParams.get('type') ?? url.searchParams.get('topic')

  if (req.method === 'POST') {
    try {
      const body = await req.json() as { data?: { id?: string }; type?: string }
      paymentId = paymentId ?? body?.data?.id ?? null
    } catch {
      // corpo vazio ou não-JSON — segue só com os dados da query string
    }
  }

  // Notificações que não são de pagamento (ex: merchant_order) são apenas confirmadas, sem ação.
  if (topic && topic !== 'payment') {
    return new Response('ok', { status: 200 })
  }

  if (!paymentId) {
    return new Response(JSON.stringify({ error: 'payment id ausente na notificação' }), {
      status: 400,
    })
  }

  // Busca os dados reais do pagamento na API do MP — nunca confiar apenas no que veio na notificação.
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })

  if (!mpRes.ok) {
    console.error('Erro ao buscar pagamento no MP:', mpRes.status, await mpRes.text())
    // Responde 200 mesmo assim para o MP não ficar reenviando indefinidamente por um id inválido.
    return new Response(JSON.stringify({ error: 'pagamento não encontrado no MP' }), {
      status: 200,
    })
  }

  const payment = await mpRes.json() as {
    id: number
    status: string // 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | ...
    external_reference?: string
  }

  // Link de pagamento (create-payment) grava o appointment_id em external_reference.
  // Pix (create-pix) não seta external_reference hoje — por isso também tentamos casar pelo payment_id salvo.
  const appointmentId = payment.external_reference

  const paymentStatusMap: Record<string, 'pendente' | 'pago' | 'reembolsado'> = {
    approved: 'pago',
    refunded: 'reembolsado',
    charged_back: 'reembolsado',
  }
  const newStatus = paymentStatusMap[payment.status]

  if (!newStatus) {
    // Status ainda pendente/rejeitado/cancelado — nada a atualizar, mas confirmamos recebimento.
    return new Response('ok', { status: 200 })
  }

  let query = supabase.from('appointments').update({
    payment_status: newStatus,
    payment_id: String(payment.id),
  })

  if (appointmentId) {
    query = query.eq('id', appointmentId)
  } else {
    // Fallback para pagamentos Pix, que hoje não enviam external_reference.
    query = query.eq('pix_payment_id', String(payment.id))
  }

  const { error, count } = await query.select('id', { count: 'exact' })

  if (error) {
    console.error('Erro ao atualizar appointment:', error)
    return new Response(JSON.stringify({ error: 'falha ao atualizar agendamento' }), {
      status: 500,
    })
  }

  if (!count) {
    console.warn('Nenhum agendamento correspondente ao pagamento', payment.id, appointmentId)
  }

  return new Response('ok', { status: 200 })
})
