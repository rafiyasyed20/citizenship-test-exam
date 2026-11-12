import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PASS_MARK, TIME_LIMIT_SECONDS, prepareQuestion } from '../data/index.js'

const LETTERS = ['A', 'B', 'C', 'D']

// 20 rungs. Rung 15 is the pass mark, which is also the million.
const LADDER = [
  '$100', '$200', '$300', '$500', '$1,000',
  '$2,000', '$4,000', '$8,000', '$16,000', '$32,000',
  '$64,000', '$125,000', '$250,000', '$500,000', '$1,000,000',
  '+ 1 🍁', '+ 2 🍁', '+ 3 🍁', '+ 4 🍁', 'Grand Slam 🍁',
]

export default function Game({ set, onFinish, onQuit, setMood, sounds }) {
  const questions = useMemo(() => set.questions.map(prepareQuestion), [set])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | locked | revealed
  const [answers, setAnswers] = useState([])
  const [hidden, setHidden] = useState([])
  const [audience, setAudience] = useState(null)
  const [friend, setFriend] = useState(null)
  const [lifelines, setLifelines] = useState({ fifty: true, audience: true, friend: true })
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS)
  const startRef = useRef(Date.now())
  const finishedRef = useRef(false)
  const phaseRef = useRef('idle')
  const setPhaseSafe = (p) => {
    phaseRef.current = p
    setPhase(p)
  }

  const q = questions[index]
  const total = questions.length
  const correctCount = answers.filter((a) => a.correct).length

  const finish = useCallback(
    (finalAnswers) => {
      if (finishedRef.current) return
      finishedRef.current = true
      const score = finalAnswers.filter((a) => a.correct).length
      if (score >= PASS_MARK) sounds.play('win')
      onFinish({
        score,
        total,
        answers: finalAnswers,
        missedIds: finalAnswers.filter((a) => !a.correct).map((a) => a.q.id),
        elapsed: Math.round((Date.now() - startRef.current) / 1000),
      })
    },
    [onFinish, sounds, total],
  )

  // Countdown. When it hits zero, unanswered questions count as wrong.
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (timeLeft === 0 && !finishedRef.current) {
      const rest = questions.slice(answers.length).map((qq) => ({ q: qq, chosen: null, correct: false }))
      finish([...answers, ...rest])
    }
  }, [timeLeft, answers, questions, finish])

  const choose = useCallback(
    (i) => {
      if (phaseRef.current !== 'idle' || hidden.includes(i)) return
      setSelected(i)
      setPhaseSafe('locked')
      sounds.play('lock')
      setTimeout(() => {
        const correct = i === q.answer
        setPhaseSafe('revealed')
        setMood(correct ? 'correct' : 'wrong')
        sounds.play(correct ? 'correct' : 'wrong')
        setAnswers((a) => [...a, { q, chosen: i, correct }])
      }, 1300)
    },
    [phase, hidden, q, setMood, sounds],
  )

  const next = useCallback(() => {
    if (phaseRef.current !== 'revealed') return
    if (index + 1 >= total) {
      finish(answers)
      return
    }
    setPhaseSafe('idle')
    setIndex((i) => i + 1)
    setSelected(null)
    setHidden([])
    setAudience(null)
    setFriend(null)
    setMood('idle')
  }, [phase, index, total, answers, finish, setMood])

  // Lifelines
  const useFifty = () => {
    if (!lifelines.fifty || phase !== 'idle') return
    sounds.play('lifeline')
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer)
    const toHide = q.type === 'tf' ? [] : shuffleArr(wrong).slice(0, 2)
    setHidden(toHide)
    setLifelines((l) => ({ ...l, fifty: false }))
  }

  const useAudience = () => {
    if (!lifelines.audience || phase !== 'idle') return
    sounds.play('lifeline')
    const n = q.options.length
    const visible = q.options.map((_, i) => i).filter((i) => !hidden.includes(i))
    const votes = Array(n).fill(0)
    let pool = 100
    const right = 45 + Math.round(Math.random() * 35)
    votes[q.answer] = right
    pool -= right
    const others = visible.filter((i) => i !== q.answer)
    others.forEach((i, k) => {
      const v = k === others.length - 1 ? pool : Math.round(Math.random() * pool)
      votes[i] = v
      pool -= v
    })
    setAudience(votes)
    setLifelines((l) => ({ ...l, audience: false }))
  }

  const useFriend = () => {
    if (!lifelines.friend || phase !== 'idle') return
    sounds.play('lifeline')
    const visible = q.options.map((_, i) => i).filter((i) => !hidden.includes(i))
    const sure = Math.random() < 0.8
    const pick = sure ? q.answer : visible.filter((i) => i !== q.answer)[0] ?? q.answer
    const lines = sure
      ? [`I'm pretty sure it's ${LETTERS[pick]}. I just re-read that chapter!`, `Oh, easy one. ${LETTERS[pick]}, definitely.`, `${LETTERS[pick]}. Trust me, I took the test last year.`]
      : [`Hmm... I think ${LETTERS[pick]}? Don't quote me on that.`, `Honestly not sure. Maybe ${LETTERS[pick]}?`]
    setFriend(lines[Math.floor(Math.random() * lines.length)])
    setLifelines((l) => ({ ...l, friend: false }))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target && e.target.tagName === 'BUTTON') return
        if (phaseRef.current === 'revealed') {
          e.preventDefault()
          next()
        }
        return
      }
      const k = e.key.toUpperCase()
      const li = LETTERS.indexOf(k)
      const ni = ['1', '2', '3', '4'].indexOf(e.key)
      const i = li >= 0 ? li : ni
      if (i >= 0 && i < q.options.length) choose(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, next, choose, q])

  const mm = Math.floor(timeLeft / 60)
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <main className="game">
      <aside className="ladder">
        <div className="ladder-head">
          <div className="ladder-title">{set.title}</div>
          <div className={`timer ${timeLeft < 300 ? 'low' : ''}`}>⏱ {mm}:{ss}</div>
        </div>
        <ol className="rungs">
          {LADDER.map((label, i) => {
            const rung = i + 1
            const reached = rung <= correctCount
            const current = rung === correctCount + 1 && index < total
            return (
              <li
                key={label}
                className={`rung ${reached ? 'reached' : ''} ${current ? 'current' : ''} ${rung === PASS_MARK ? 'pass' : ''}`}
              >
                <span className="rung-n">{rung}</span>
                <span className="rung-label">{label}</span>
                {rung === PASS_MARK && <span className="rung-tag">PASS</span>}
              </li>
            )
          })}
        </ol>
        <div className="ladder-foot">
          <div>
            <strong>{correctCount}</strong> correct · <strong>{answers.length - correctCount}</strong> wrong
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onQuit}>✕ Quit</button>
        </div>
      </aside>

      <section className="stage">
        <div className="stage-top">
          <div className="progress">
            Question <strong>{index + 1}</strong> of {total}
            <span className="cat"> · {q.category}</span>
            <span className={`qtype ${q.type}`}>{q.type === 'tf' ? 'True / False' : 'Multiple choice'}</span>
          </div>
          <div className="lifelines">
            <Lifeline on={lifelines.fifty && q.type !== 'tf'} label="50:50" onClick={useFifty} title="Remove two wrong answers" />
            <Lifeline on={lifelines.audience} label="👥" onClick={useAudience} title="Ask the audience" />
            <Lifeline on={lifelines.friend} label="📞" onClick={useFriend} title="Phone a friend" />
            <button className="ll mute" onClick={sounds.toggleMuted} title="Toggle sound">{sounds.muted ? '🔇' : '🔊'}</button>
          </div>
        </div>

        <div className="question-card" key={q.id}>
          <div className="question-text">{q.question}</div>
        </div>

        {audience && (
          <div className="audience">
            {q.options.map((_, i) =>
              hidden.includes(i) ? null : (
                <div className="bar" key={i}>
                  <div className="bar-fill" style={{ height: `${audience[i]}%` }} />
                  <div className="bar-label">{LETTERS[i]} {audience[i]}%</div>
                </div>
              ),
            )}
          </div>
        )}
        {friend && <div className="friend">📞 <em>Your friend says:</em> “{friend}”</div>}

        <div className={`options ${q.type === 'tf' ? 'two' : ''}`}>
          {q.options.map((opt, i) => {
            let cls = 'option'
            if (hidden.includes(i)) cls += ' hidden'
            if (phase === 'locked' && selected === i) cls += ' locked'
            if (phase === 'revealed') {
              if (i === q.answer) cls += ' right'
              else if (i === selected) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={phase !== 'idle' || hidden.includes(i)}>
                <span className="opt-letter">{LETTERS[i]}</span>
                <span className="opt-text">{opt}</span>
              </button>
            )
          })}
        </div>

        {phase === 'revealed' && (
          <div className={`explain ${selected === q.answer ? 'ok' : 'bad'}`}>
            <div className="explain-head">
              {selected === q.answer ? '✅ Correct!' : `❌ Not quite. The answer is ${LETTERS[q.answer]}: ${q.options[q.answer]}`}
            </div>
            <p>{q.explanation}</p>
            {q.ref && <div className="ref">{q.ref}</div>}
            <button className="btn btn-gold" onClick={next} autoFocus>
              {index + 1 >= total ? 'See results →' : 'Next question →'} <kbd>Enter</kbd>
            </button>
          </div>
        )}
        {phase === 'idle' && <div className="hint">Press A–D or 1–4 to answer. One attempt per question, no going back, just like the real test.</div>}
      </section>
    </main>
  )
}

function Lifeline({ on, label, onClick, title }) {
  return (
    <button className={`ll ${on ? '' : 'used'}`} onClick={onClick} disabled={!on} title={title}>
      {label}
    </button>
  )
}

function shuffleArr(a) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
