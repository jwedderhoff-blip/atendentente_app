import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockWorkingHours } from '../lib/mockData'

export function useWorkingHours(establishmentId: string | undefined) {
  const [closedDays, setClosedDays] = useState<number[]>([])

  useEffect(() => {
    if (!establishmentId) return

    if (isDemo) {
      setClosedDays(mockWorkingHours.filter((h) => !h.is_open).map((h) => h.day_of_week))
      return
    }

    supabase
      .from('working_hours')
      .select('day_of_week, is_open')
      .eq('establishment_id', establishmentId)
      .then(({ data }) => {
        if (data) {
          setClosedDays(data.filter((h) => !h.is_open).map((h) => h.day_of_week))
        }
      })
  }, [establishmentId])

  return { closedDays }
}
