import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'

export interface PixData {
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  payment_id: string
  status: 'pending' | 'approved' | 'rejected'
  demo?: boolean
}

export function usePixPayment() {
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePix = async (params: {
    appointment_id: string
    amount: number
    description: string
    payer_email: string
    payer_name: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      if (isDemo) {
        // Simulate delay in demo mode
        await new Promise((r) => setTimeout(r, 1500))
        const demoData: PixData = {
          qr_code:
            '00020126580014BR.GOV.BCB.PIX0136demo-pix-key-atendente-app52040000530398654071234.565802BR5925Atendente App Demo6009Sao Paulo62070503***63041D3D',
          qr_code_base64: '',
          ticket_url: '',
          payment_id: 'demo-' + crypto.randomUUID(),
          status: 'pending',
          demo: true,
        }
        setPixData(demoData)
        return
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-pix', {
        body: params,
      })

      if (fnError) {
        setError(fnError.message ?? 'Erro ao gerar PIX')
        return
      }

      setPixData(data as PixData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX')
    } finally {
      setLoading(false)
    }
  }

  return { pixData, loading, error, generatePix }
}
