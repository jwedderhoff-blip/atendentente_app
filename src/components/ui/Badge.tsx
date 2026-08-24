import { cn } from '../../lib/utils'

type StatusVariant = 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'pago' | 'reembolsado'

interface BadgeProps {
  status: StatusVariant
  className?: string
}

const variantClasses: Record<StatusVariant, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  concluido: 'bg-blue-100 text-blue-800',
  pago: 'bg-emerald-100 text-emerald-800',
  reembolsado: 'bg-orange-100 text-orange-800',
}

const labels: Record<StatusVariant, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  pago: 'Pago',
  reembolsado: 'Reembolsado',
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[status],
        className
      )}
    >
      {labels[status]}
    </span>
  )
}
