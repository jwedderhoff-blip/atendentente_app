import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Check, ExternalLink, QrCode, X, Share2 } from 'lucide-react'

interface Props {
  /** URL pública de agendamento do estabelecimento. */
  url: string
  /** Nome do estabelecimento, usado na mensagem de compartilhamento. */
  name: string
  className?: string
}

/**
 * Cartão para compartilhar o link público de agendamento: copiar, abrir,
 * enviar por WhatsApp e um QR estático (sempre o mesmo link) para o cliente
 * ler direto da tela — mais rápido do que mandar o link manualmente.
 */
export default function ShareCard({ url, name, className }: Props) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (!url) return
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: '#14131c', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard bloqueado — usuário pode copiar manualmente */ }
  }

  const waText = encodeURIComponent(`Agende seu horário na ${name}: ${url}`)
  const waHref = `https://wa.me/?text=${waText}`

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center">
          <Share2 size={15} className="text-brand" />
        </span>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Compartilhar agendamento</h3>
          <p className="text-xs text-gray-400">O mesmo link da sua página pública</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* QR */}
        <button
          onClick={() => setZoom(true)}
          title="Ampliar QR"
          className="shrink-0 self-center rounded-xl border border-gray-100 p-2 hover:border-brand/40 transition"
        >
          {qr
            ? <img src={qr} alt="QR code do agendamento" className="w-28 h-28" />
            : <div className="w-28 h-28 flex items-center justify-center text-gray-300"><QrCode size={28} /></div>}
        </button>

        {/* Ações */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
            <span className="text-xs text-gray-500 truncate flex-1">{url}</span>
            <button onClick={copy} className="shrink-0 text-brand hover:text-brand-dark transition" title="Copiar link">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition"
            >
              WhatsApp
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <ExternalLink size={14} /> Abrir
            </a>
          </div>
          <button
            onClick={() => setZoom(true)}
            className="flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <QrCode size={14} /> Mostrar QR em tela cheia
          </button>
        </div>
      </div>

      {/* QR ampliado para leitura na hora */}
      {zoom && qr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setZoom(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-6 text-center max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoom(false)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-400"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <p className="font-semibold text-gray-900 mb-1">{name}</p>
            <p className="text-xs text-gray-400 mb-4">Aponte a câmera para agendar</p>
            <img src={qr} alt="QR code do agendamento" className="w-full max-w-[260px] mx-auto" />
          </div>
        </div>
      )}
    </div>
  )
}
