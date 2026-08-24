import { useState } from 'react'
import { Copy, Check, Clock, QrCode } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import type { PixData } from '../../hooks/usePixPayment'

interface PixPaymentProps {
  pixData: PixData
  amount: number
  loading?: boolean
}

export function PixPayment({ pixData, amount, loading = false }: PixPaymentProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for browsers without clipboard API
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Gerando PIX...</p>
        </div>
      </div>
    )
  }

  const statusBadge =
    pixData.status === 'approved' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Pago
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        Aguardando pagamento
      </span>
    )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Valor</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(amount)}</p>
        </div>
        {statusBadge}
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        {pixData.qr_code_base64 ? (
          <img
            src={`data:image/png;base64,${pixData.qr_code_base64}`}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-xl border border-gray-200"
          />
        ) : (
          <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
            <QrCode size={40} />
            <p className="text-xs text-center">QR Code PIX</p>
          </div>
        )}
      </div>

      {/* Copy-paste code */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Código Pix Copia e Cola</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={pixData.qr_code}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 truncate focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 rounded-xl p-4">
        <p className="text-sm text-purple-800 font-medium mb-1">Como pagar</p>
        <p className="text-xs text-purple-600">
          Abra seu banco, escolha PIX → Pagar → Copia e Cola ou QR Code
        </p>
      </div>

      {/* Expiry warning */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock size={13} />
        <span>O código expira em 30 minutos</span>
      </div>

      {/* Demo badge */}
      {pixData.demo && (
        <p className="text-xs text-center text-gray-400">
          Modo demonstração — PIX simulado
        </p>
      )}
    </div>
  )
}
