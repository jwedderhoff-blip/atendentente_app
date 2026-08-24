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

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={!slot.available}
          onClick={() => slot.available && onSelect(slot.time)}
          className={cn(
            'py-2.5 rounded-xl text-sm font-medium transition border',
            slot.available
              ? selected === slot.time
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:text-purple-700'
              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  )
}
