import type { TimeSlot } from '../../types'
import { cn } from '../../lib/utils'

interface TimeSlotGridProps {
  slots: TimeSlot[]
  selected: string | null
  onSelect: (time: string) => void
}

export function TimeSlotGrid({ slots, selected, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Nenhum horário disponível para esta data.
      </div>
    )
  }

  const hasSpots = slots.some((s) => s.remaining_spots !== undefined)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selected === slot.time
        const spotsLabel =
          slot.remaining_spots !== undefined
            ? slot.remaining_spots === 0
              ? 'Esgotado'
              : slot.remaining_spots === 1
              ? '1 vaga'
              : `${slot.remaining_spots} vagas`
            : null

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => slot.available && onSelect(slot.time)}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl text-sm font-medium transition border',
              hasSpots ? 'py-2 px-1 gap-0.5' : 'py-2.5',
              slot.available
                ? isSelected
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand hover:text-brand-dark'
                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
            )}
          >
            <span>{slot.time}</span>
            {spotsLabel && (
              <span
                className={cn(
                  'text-[10px] font-normal leading-tight',
                  slot.available
                    ? isSelected
                      ? 'text-brand/20'
                      : slot.remaining_spots === 1
                      ? 'text-amber-500'
                      : 'text-gray-400'
                    : 'text-gray-300'
                )}
              >
                {spotsLabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
