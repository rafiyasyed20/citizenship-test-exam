import { useCallback, useEffect, useState } from 'react'

const KEY = 'wwtbac-progress-v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      /* storage unavailable, ignore */
    }
  }, [progress])

  const record = useCallback((setId, score, total, missedIds) => {
    setProgress((p) => {
      const prev = p[setId] || { attempts: 0, best: 0, missed: [] }
      return {
        ...p,
        [setId]: {
          attempts: prev.attempts + 1,
          best: Math.max(prev.best, score),
          last: score,
          total,
          missed: missedIds,
          lastAt: Date.now(),
        },
      }
    })
  }, [])

  const reset = useCallback(() => setProgress({}), [])

  return { progress, record, reset }
}
