import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { appointment_id, amount, description, payer_email, payer_name } =
    await req.json() as {
      appointment_id: string
      amount: number
      description: string
      payer_email: string
      payer_name: string
    }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  // Demo mode when no MP_ACCESS_TOKEN configured
  if (!MP_ACCESS_TOKEN) {
    const demoData = {
      qr_code:
        '00020126580014BR.GOV.BCB.PIX0136demo-pix-key-atendente-app52040000530398654071234.565802BR5925Atendente App Demo6009Sao Paulo62070503***63041D3D',
      qr_code_base64: '',
      ticket_url: '',
      payment_id: 'demo-' + crypto.randomUUID(),
      status: 'pending',
      demo: true,
    }
    return new Response(JSON.stringify(demoData), { headers: corsHeaders })
  }

  const pixPayload = {
    transaction_amount: amount,
    description,
    payment_method_id: 'pix',
    payer: {
      email: payer_email,
      first_name: payer_name,
    },
    external_reference: appointment_id,
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
  }

  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': appointment_id,
    },
    body: JSON.stringify(pixPayload),
  })

  const mpData = await mpRes.json() as {
    id?: number
    status?: string
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string
        qr_code_base64?: string
        ticket_url?: string
      }
    }
    error?: string
    message?: string
  }

  if (!mpRes.ok) {
    return new Response(
      JSON.stringify({ error: mpData.message ?? mpData.error ?? 'Erro ao criar pagamento PIX' }),
      { status: 500, headers: corsHeaders }
    )
  }

  const txData = mpData.point_of_interaction?.transaction_data ?? {}

  if (mpData.id) {
    // Pix do MP expira em 30 minutos por padrão — grava para exibir/validar no front se preciso.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ pix_payment_id: String(mpData.id), pix_expires_at: expiresAt })
      .eq('id', appointment_id)

    if (updateError) {
      console.error('Erro ao salvar pix_payment_id no agendamento:', updateError)
      // Não bloqueia a resposta ao cliente — o QR code já foi gerado no MP.
      // Mas sem isso salvo, o webhook não vai conseguir casar o pagamento com o agendamento.
    }
  }

  return new Response(
    JSON.stringify({
      qr_code: txData.qr_code ?? '',
      qr_code_base64: txData.qr_code_base64 ?? '',
      ticket_url: txData.ticket_url ?? '',
      payment_id: String(mpData.id ?? ''),
      status: mpData.status ?? 'pending',
      demo: false,
    }),
    { headers: corsHeaders }
  )
})
