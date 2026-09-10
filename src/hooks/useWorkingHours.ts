import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemo } from '../lib/isDemo'
import { mockWorkingHours } from '../lib/mockData'
import type { WorkingHours } from '../types'

export function useWorkingHours(establishmentId: string | undefined) {
  const [closedDays, setClosedDays] = useState<number[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!establishmentId) {
      setLoading(false)
      return
    }

    if (isDemo) {
      setWorkingHours(mockWorkingHours as WorkingHours[])
      setClosedDays(mockWorkingHours.filter((h) => !h.is_open).map((h) => h.day_of_week))
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('working_hours')
      .select('*')
      .eq('establishment_id', establishmentId)
      .then(({ data }) => {
        if (data) {
          setWorkingHours(data as WorkingHours[])
          setClosedDays(data.filter((h: WorkingHours) => !h.is_open).map((h: WorkingHours) => h.day_of_week))
        }
        setLoading(false)
      })
  }, [establishmentId])

  return { closedDays, workingHours, loadingWorkingHours: loading }
}
