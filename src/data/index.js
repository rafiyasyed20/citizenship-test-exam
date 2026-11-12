// Loads every set JSON in ./sets and exposes helpers.
const modules = import.meta.glob('./sets/*.json', { eager: true })

export const SETS = Object.keys(modules)
  .sort()
  .map((k) => modules[k].default)

export const ALL_QUESTIONS = SETS.flatMap((s) =>
  s.questions.map((q) => ({ ...q, setId: s.id, setTitle: s.title })),
)

export const PASS_MARK = 15
export const QUESTIONS_PER_SET = 20
export const TIME_LIMIT_SECONDS = 45 * 60

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A mock exam: 20 random questions drawn across every set.
export function buildMockExam() {
  return {
    id: 'mock',
    title: 'Mock Exam',
    subtitle: '20 random questions from all 400',
    questions: shuffle(ALL_QUESTIONS).slice(0, QUESTIONS_PER_SET),
  }
}

// Shuffle multiple-choice options while keeping the right answer tracked.
// True/False questions keep their order.
export function prepareQuestion(q) {
  if (q.type === 'tf') return { ...q }
  const idx = q.options.map((_, i) => i)
  const order = shuffle(idx)
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
  }
}
