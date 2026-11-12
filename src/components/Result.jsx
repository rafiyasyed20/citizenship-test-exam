import { useState } from 'react'
import { PASS_MARK } from '../data/index.js'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Result({ set, result, nextSet, onRetry, onNext, onHome }) {
  const [showAll, setShowAll] = useState(false)
  const { score, total, answers, elapsed } = result
  const pass = score >= PASS_MARK
  const pct = Math.round((score / total) * 100)
  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')
  const list = showAll ? answers : answers.filter((a) => !a.correct)

  return (
    <main className="result">
      <section className={`verdict ${pass ? 'pass' : 'fail'}`}>
        <div className="ring" style={{ '--pct': pct }}>
          <div className="ring-inner">
            <div className="ring-score">{score}</div>
            <div className="ring-total">/ {total}</div>
          </div>
        </div>
        <div className="verdict-text">
          <div className="verdict-kicker">{set.title}</div>
          <h1>{pass ? (score === total ? 'Perfect! True North strong and free 🍁' : 'You passed! 🎉') : 'Not yet, eh? Keep studying 📚'}</h1>
          <p>
            {pass
              ? `You scored ${pct}%. The real test needs ${PASS_MARK}/${total}, so you would have made it.`
              : `You scored ${pct}%. You need ${PASS_MARK}/${total} to pass. Review the misses below and try again.`}{' '}
            Time used: {mins}:{secs}.
          </p>
          <div className="verdict-actions">
            <button className="btn btn-gold" onClick={onRetry}>↻ Play again</button>
            {nextSet && <button className="btn btn-primary" onClick={onNext}>Next round →</button>}
            <button className="btn btn-ghost" onClick={onHome}>⌂ Lobby</button>
          </div>
        </div>
      </section>

      <section className="review">
        <div className="review-head">
          <h2>{showAll ? 'All questions' : `Questions you missed (${answers.filter((a) => !a.correct).length})`}</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show misses only' : 'Show all 20'}
          </button>
        </div>
        {list.length === 0 && <p className="muted">Nothing to review. Flawless!</p>}
        <ol className="review-list">
          {list.map((a) => (
            <li key={a.q.id} className={a.correct ? 'ok' : 'bad'}>
              <div className="rq">
                <span className="rq-cat">{a.q.category}</span>
                {a.q.question}
              </div>
              <div className="rq-answers">
                {!a.correct && (
                  <div className="rq-chosen">
                    ✗ You chose: <strong>{a.chosen == null ? 'no answer' : `${LETTERS[a.chosen]}. ${a.q.options[a.chosen]}`}</strong>
                  </div>
                )}
                <div className="rq-right">
                  ✓ Correct: <strong>{LETTERS[a.q.answer]}. {a.q.options[a.q.answer]}</strong>
                </div>
              </div>
              <div className="rq-expl">{a.q.explanation}</div>
              {a.q.ref && <div className="rq-ref">{a.q.ref}</div>}
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
