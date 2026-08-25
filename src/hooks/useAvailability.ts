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
  maxSpots?: number
}

export function useAvailability({
  establishmentId,
  professionalId,
  serviceId,
  date,
  durationMinutes,
  maxSpots = 1,
}: UseAvailabilityParams) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // professionalId is optional when service has fixed schedules
    if (!establishmentId || !serviceId || !date || durationMinutes <= 0) {
      setSlots([])
      return
    }

    if (isDemo) {
      if (!professionalId) {
        setSlots([])
        return
      }
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

      // Always fetch fixed schedules for the service
      const schedulesRes = await supabase
        .from('service_schedules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('day_of_week', dayOfWeek)
        .order('time')

      const fixedSchedules = schedulesRes.data ?? []

      // Se há horários fixos, usa eles (independente de profissional)
      if (fixedSchedules.length > 0) {
        // Conta agendamentos já feitos para cada horário neste dia (por estabelecimento)
        const apptRes = await supabase
          .from('appointments')
          .select('starts_at, service_id')
          .eq('establishment_id', establishmentId)
          .eq('service_id', serviceId)
          .neq('status', 'cancelado')
          .gte('starts_at', `${dateStr}T00:00:00`)
          .lte('starts_at', `${dateStr}T23:59:59`)

        // Conta quantos agendamentos por horário
        const bookedCounts = new Map<string, number>()
        for (const a of (apptRes.data ?? []) as { starts_at: string }[]) {
          const t = format(parseISO(a.starts_at), 'HH:mm')
          bookedCounts.set(t, (bookedCounts.get(t) ?? 0) + 1)
        }

        const generatedSlots: TimeSlot[] = fixedSchedules.map(
          (sch: { time: string; max_spots: number }) => {
            const t = sch.time.slice(0, 5)
            const booked = bookedCounts.get(t) ?? 0
            return { time: t, available: booked < sch.max_spots }
          }
        )
        setSlots(generatedSlots)
        setLoading(false)
        return
      }

      // Fallback: horários dinâmicos
      // Se max_spots > 1 (turma), não precisa de profissional
      // Se max_spots = 1 (exclusivo), requer profissional
      if (maxSpots === 1 && !professionalId) {
        setSlots([])
        setLoading(false)
        return
      }

      // Monta query de agendamentos: por profissional (exclusivo) ou por serviço (turma)
      let apptQuery = supabase
        .from('appointments')
        .select('starts_at, ends_at')
        .eq('establishment_id', establishmentId)
        .neq('status', 'cancelado')
        .gte('starts_at', `${dateStr}T00:00:00`)
        .lte('starts_at', `${dateStr}T23:59:59`)

      if (maxSpots === 1 && professionalId) {
        apptQuery = apptQuery.eq('professional_id', professionalId)
      } else {
        apptQuery = apptQuery.eq('service_id', serviceId)
      }

      const [hoursRes, apptRes] = await Promise.all([
        supabase
          .from('working_hours')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('day_of_week', dayOfWeek)
          .single(),
        apptQuery,
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

      let breakStart: number | null = null
      let breakEnd: number | null = null
      if (wh.break_start && wh.break_end) {
        const [bsH, bsM] = wh.break_start.split(':').map(Number)
        const [beH, beM] = wh.break_end.split(':').map(Number)
        breakStart = bsH * 60 + bsM
        breakEnd = beH * 60 + beM
      }

      const apptData = (apptRes.data ?? []) as { starts_at: string; ends_at: string }[]

      // Para turma (maxSpots > 1): conta agendamentos por horário de início
      // Para exclusivo (maxSpots = 1): verifica sobreposição de intervalos
      const bookedCounts = new Map<number, number>()
      const bookedRanges: { start: number; end: number }[] = []

      for (const a of apptData) {
        const startMin = parseISO(a.starts_at).getHours() * 60 + parseISO(a.starts_at).getMinutes()
        const endMin = parseISO(a.ends_at).getHours() * 60 + parseISO(a.ends_at).getMinutes()
        if (maxSpots > 1) {
          bookedCounts.set(startMin, (bookedCounts.get(startMin) ?? 0) + 1)
        } else {
          bookedRanges.push({ start: startMin, end: endMin })
        }
      }

      const generatedSlots: TimeSlot[] = []
      let cursor = openMinutes

      while (cursor + durationMinutes <= closeMinutes) {
        const slotEnd = cursor + durationMinutes
        const inBreak = breakStart !== null && breakEnd !== null && cursor < breakEnd && slotEnd > breakStart
        const isUnavailable =
          maxSpots > 1
            ? (bookedCounts.get(cursor) ?? 0) >= maxSpots
            : bookedRanges.some((r) => cursor < r.end && slotEnd > r.start)
        if (!inBreak) {
          const slotDate = addMinutes(new Date(date.setHours(0, 0, 0, 0)), cursor)
          generatedSlots.push({
            time: format(slotDate, 'HH:mm'),
            available: !isUnavailable,
          })
        }
        cursor += 30
      }

      setSlots(generatedSlots)
      setLoading(false)
    }

    void fetchSlots()
  }, [establishmentId, professionalId, serviceId, date, durationMinutes])

  return { slots, loading }
}
