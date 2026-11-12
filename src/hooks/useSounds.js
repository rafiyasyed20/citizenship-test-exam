import { useCallback, useRef, useState } from 'react'

// Tiny WebAudio synth so the game has show-style stings without audio files.
export function useSounds() {
  const ctxRef = useRef(null)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('wwtbac-muted') === '1'
    } catch {
      return false
    }
  })

  const ctx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctxRef.current = new AC()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const tone = useCallback(
    (freq, start, dur, type = 'sine', gain = 0.12) => {
      if (muted) return
      const c = ctx()
      if (!c) return
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, c.currentTime + start)
      g.gain.setValueAtTime(0, c.currentTime + start)
      g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
      o.connect(g).connect(c.destination)
      o.start(c.currentTime + start)
      o.stop(c.currentTime + start + dur + 0.05)
    },
    [muted],
  )

  const play = useCallback(
    (name) => {
      switch (name) {
        case 'select':
          tone(440, 0, 0.12, 'triangle', 0.08)
          break
        case 'lock':
          tone(220, 0, 0.5, 'sawtooth', 0.06)
          tone(330, 0.1, 0.5, 'sawtooth', 0.06)
          break
        case 'correct':
          tone(523, 0, 0.18, 'triangle')
          tone(659, 0.15, 0.18, 'triangle')
          tone(784, 0.3, 0.35, 'triangle')
          break
        case 'wrong':
          tone(196, 0, 0.5, 'sawtooth', 0.1)
          tone(146, 0.25, 0.7, 'sawtooth', 0.1)
          break
        case 'lifeline':
          tone(880, 0, 0.1, 'square', 0.05)
          tone(1174, 0.1, 0.2, 'square', 0.05)
          break
        case 'win':
          ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.4, 'triangle'))
          break
        default:
          break
      }
    },
    [tone],
  )

  const toggleMuted = () =>
    setMuted((m) => {
      try {
        localStorage.setItem('wwtbac-muted', m ? '0' : '1')
      } catch {
        /* ignore */
      }
      return !m
    })

  return { play, muted, toggleMuted }
}
