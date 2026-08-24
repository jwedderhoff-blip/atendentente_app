import { useEffect, useState } from 'react'
import { format, addMinutes, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockWorkingHours, mockAppointments } from '../lib/mockData'
import type { TimeSlot, WorkingHours } from '../types'

interface UseAvailabilityParams {
  establishmentId: string | undefined
  professionalId: string | undefined
  serviceId: string | undefined
  date: Date | null
  durationMinutes: number
}

export function useAvailability({
  establishmentId,
  professionalId,
  serviceId,
  date,
  durationMinutes,
}: UseAvailabilityParams) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!establishmentId || !professionalId || !serviceId || !date || durationMinutes <= 0) {
      setSlots([])
      return
    }

    if (isDemo) {
      const dayOfWeek = date.getDay() as WorkingHours['day_of_week']
      const wh = mockWorkingHours.find((h) => h.day_of_week === dayOfWeek)
      if (!wh || !wh.is_open) {
        setSlots([])
        return
      }

      const dateStr = format(date, 'yyyy-MM-dd')
      const bookedRanges = mockAppointments
        .filter(
          (a) =>
            a.professional_id === professionalId &&
            a.status !== 'cancelado' &&
            a.starts_at.startsWith(dateStr)
        )
        .map((a) => ({
          start: parseISO(a.starts_at).getHours() * 60 + parseISO(a.starts_at).getMinutes(),
          end: parseISO(a.ends_at).getHours() * 60 + parseISO(a.ends_at).getMinutes(),
        }))

      const [openH, openM] = wh.open_time.split(':').map(Number)
      const [closeH, closeM] = wh.close_time.split(':').map(Number)
      const openMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM

      const generatedSlots: TimeSlot[] = []
      let cursor = openMinutes
      const baseDate = new Date(date)
      baseDate.setHours(0, 0, 0, 0)

      while (cursor + durationMinutes <= closeMinutes) {
        const slotEnd = cursor + durationMinutes
        const isBooked = bookedRanges.some((r) => cursor < r.end && slotEnd > r.start)
        const slotDate = addMinutes(baseDate, cursor)
        generatedSlots.push({
          time: format(slotDate, 'HH:mm'),
          available: !isBooked,
        })
        cursor += 30
      }

      setSlots(generatedSlots)
      return
    }

    const fetchSlots = async () => {
      setLoading(true)

      const dayOfWeek = date.getDay()
      const dateStr = format(date, 'yyyy-MM-dd')

      const [hoursRes, apptRes] = await Promise.all([
        supabase
          .from('working_hours')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('day_of_week', dayOfWeek)
          .single(),
        supabase
          .from('appointments')
          .select('starts_at, ends_at')
          .eq('establishment_id', establishmentId)
          .eq('professional_id', professionalId)
          .neq('status', 'cancelado')
          .gte('starts_at', `${dateStr}T00:00:00`)
          .lte('starts_at', `${dateStr}T23:59:59`),
      ])

      const wh = hoursRes.data as WorkingHours | null
      if (!wh || !wh.is_open) {
        setSlots([])
        setLoading(false)
        return
      }

      const [openH, openM] = wh.open_time.split(':').map(Number)
      const [closeH, closeM] = wh.close_time.split(':').map(Number)

      const openMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM

      const bookedRanges = ((apptRes.data ?? []) as { starts_at: string; ends_at: string }[]).map(
        (a) => ({
          start: parseISO(a.starts_at).getHours() * 60 + parseISO(a.starts_at).getMinutes(),
          end: parseISO(a.ends_at).getHours() * 60 + parseISO(a.ends_at).getMinutes(),
        })
      )

      const generatedSlots: TimeSlot[] = []
      let cursor = openMinutes

      while (cursor + durationMinutes <= closeMinutes) {
        const slotEnd = cursor + durationMinutes
        const isBooked = bookedRanges.some((r) => cursor < r.end && slotEnd > r.start)
        const slotDate = addMinutes(new Date(date.setHours(0, 0, 0, 0)), cursor)

        generatedSlots.push({
          time: format(slotDate, 'HH:mm'),
          available: !isBooked,
        })
        cursor += 30
      }

      setSlots(generatedSlots)
      setLoading(false)
    }

    void fetchSlots()
  }, [establishmentId, professionalId, serviceId, date, durationMinutes])

  return { slots, loading }
}
