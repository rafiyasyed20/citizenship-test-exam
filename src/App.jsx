import { useCallback, useMemo, useState } from 'react'
import Backdrop from './three/Backdrop.jsx'
import Home from './components/Home.jsx'
import Game from './components/Game.jsx'
import Result from './components/Result.jsx'
import { SETS, buildMockExam } from './data/index.js'
import { useProgress } from './hooks/useProgress.js'
import { useSounds } from './hooks/useSounds.js'

export default function App() {
  const [screen, setScreen] = useState('home') // home | game | result
  const [activeSet, setActiveSet] = useState(null)
  const [result, setResult] = useState(null)
  const [mood, setMood] = useState('idle')
  const [playId, setPlayId] = useState(0) // bumps on every new game so <Game> remounts fresh
  const { progress, record, reset } = useProgress()
  const sounds = useSounds()

  const startSet = useCallback((set) => {
    setActiveSet(set)
    setResult(null)
    setMood('idle')
    setPlayId((n) => n + 1)
    setScreen('game')
  }, [])

  const startMock = useCallback(() => startSet(buildMockExam()), [startSet])

  const finish = useCallback(
    (r) => {
      setResult(r)
      record(activeSet.id, r.score, r.total, r.missedIds)
      setMood(r.score >= 15 ? 'win' : 'idle')
      setScreen('result')
    },
    [activeSet, record],
  )

  const nextSet = useMemo(() => {
    if (!activeSet || activeSet.id === 'mock') return null
    const i = SETS.findIndex((s) => s.id === activeSet.id)
    return SETS[i + 1] || null
  }, [activeSet])

  return (
    <>
      <Backdrop mood={mood} />
      <div className="app">
        {screen === 'home' && (
          <Home
            sets={SETS}
            progress={progress}
            onStart={startSet}
            onMock={startMock}
            onReset={reset}
            sounds={sounds}
          />
        )}
        {screen === 'game' && (
          <Game
            key={`${activeSet.id}:${playId}`}
            set={activeSet}
            onFinish={finish}
            onQuit={() => {
              setMood('idle')
              setScreen('home')
            }}
            setMood={setMood}
            sounds={sounds}
          />
        )}
        {screen === 'result' && (
          <Result
            set={activeSet}
            result={result}
            nextSet={nextSet}
            onRetry={() => startSet(activeSet.id === 'mock' ? buildMockExam() : activeSet)}
            onNext={() => nextSet && startSet(nextSet)}
            onHome={() => {
              setMood('idle')
              setScreen('home')
            }}
          />
        )}
      </div>
    </>
  )
}
