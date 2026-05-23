import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export const useRealtimeFeed = (circleId: string | null) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!supabase || !circleId) {
      return
    }

    const client = supabase
    const channel = client
      .channel(`circle-feed-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `circle_id=eq.${circleId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `circle_id=eq.${circleId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `circle_id=eq.${circleId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [circleId, queryClient])
}
