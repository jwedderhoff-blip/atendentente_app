import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CalendarProps {
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  disabledDays?: number[]
}

export function Calendar({ selected, onSelect, minDate, disabledDays = [] }: CalendarProps) {
  const [current, setCurrent] = useState(selected ?? new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const today = startOfDay(new Date())
  const min = minDate ? startOfDay(minDate) : today

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrent(subMonths(current, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">
          {format(current, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          type="button"
          onClick={() => setCurrent(addMonths(current, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, current)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isPast = isBefore(startOfDay(day), min)
          const dayOfWeek = day.getDay()
          const isDisabled = isPast || disabledDays.includes(dayOfWeek) || !isCurrentMonth

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(day)}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition',
                !isCurrentMonth && 'invisible',
                isDisabled && 'opacity-30 cursor-not-allowed',
                isSelected && 'bg-purple-600 text-white font-semibold',
                !isSelected && !isDisabled && isToday(day) && 'border border-purple-500 text-purple-700',
                !isSelected && !isDisabled && 'hover:bg-purple-50 text-gray-700',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
