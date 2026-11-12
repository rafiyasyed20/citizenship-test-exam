import { PASS_MARK } from '../data/index.js'

export default function Home({ sets, progress, onStart, onMock, onReset, sounds }) {
  const passed = sets.filter((s) => (progress[s.id]?.best || 0) >= PASS_MARK).length
  const attempted = sets.filter((s) => progress[s.id]).length
  const bestTotal = sets.reduce((n, s) => n + (progress[s.id]?.best || 0), 0)

  return (
    <main className="home">
      <header className="hero">
        <div className="hero-leaf">🍁</div>
        <h1>
          Who Wants to Be a<br />
          <span>Canadian?</span>
        </h1>
        <p className="tagline">
          400 exam-style questions built from <em>Discover Canada</em>, the official study guide.
          Real test rules: 20 questions, 45 minutes, you need {PASS_MARK} right to pass.
        </p>
        <div className="hero-actions">
          <button className="btn btn-gold btn-big" onClick={onMock}>
            🎲 Random Mock Exam
          </button>
          <a className="btn btn-ghost" href="/assets/book/discover-canada.pdf" target="_blank" rel="noreferrer">
            📖 Open the study guide
          </a>
        </div>
        <div className="stats">
          <Stat label="Sets passed" value={`${passed} / ${sets.length}`} />
          <Stat label="Sets attempted" value={attempted} />
          <Stat label="Best answers total" value={`${bestTotal} / ${sets.length * 20}`} />
        </div>
      </header>

      <section className="sets">
        <div className="sets-head">
          <h2>Choose a round</h2>
          <div className="tools">
            <button className="btn btn-ghost btn-sm" onClick={sounds.toggleMuted}>
              {sounds.muted ? '🔇 Sound off' : '🔊 Sound on'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (window.confirm('Clear all saved scores?')) onReset()
              }}
            >
              ♻️ Reset progress
            </button>
          </div>
        </div>
        <div className="set-grid">
          {sets.map((s, i) => {
            const p = progress[s.id]
            const best = p?.best || 0
            const isPass = best >= PASS_MARK
            return (
              <button
                key={s.id}
                className={`set-card ${isPass ? 'pass' : ''} ${p && !isPass ? 'tried' : ''}`}
                onClick={() => onStart(s)}
              >
                <div className="set-num">Round {String(i + 1).padStart(2, '0')}</div>
                <div className="set-title">{s.title}</div>
                <div className="set-sub">{s.subtitle}</div>
                <div className="set-topics">
                  {s.topics.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="set-foot">
                  {p ? (
                    <>
                      <span className={`pill ${isPass ? 'ok' : 'warn'}`}>
                        {isPass ? 'PASSED' : 'KEEP GOING'} · best {best}/20
                      </span>
                      <span className="muted">{p.attempts} attempt{p.attempts > 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <span className="pill">NEW</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <footer className="foot">
        Built from <em>Discover Canada: The Rights and Responsibilities of Citizenship</em>. Where the guide is
        out of date (for example, the Sovereign is now King Charles III), explanations say so. Always check{' '}
        <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/citizenship-test.html" target="_blank" rel="noreferrer">
          canada.ca
        </a>{' '}
        for current test rules.
      </footer>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
