// Sanity-checks every question set: 20 sets x 20 questions, unique ids,
// 4 options for MC / 2 for TF, answer index in range, non-empty explanation.
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'sets')
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
const errors = []
const ids = new Set()
let total = 0
let mc = 0
let tf = 0

for (const f of files) {
  const set = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  if (!set.id || !set.title || !set.subtitle || !Array.isArray(set.topics)) errors.push(`${f}: missing set metadata`)
  if (set.questions.length !== 20) errors.push(`${f}: has ${set.questions.length} questions, expected 20`)
  for (const q of set.questions) {
    total++
    if (ids.has(q.id)) errors.push(`${f}: duplicate id ${q.id}`)
    ids.add(q.id)
    if (!['mc', 'tf'].includes(q.type)) errors.push(`${q.id}: bad type ${q.type}`)
    if (q.type === 'mc') {
      mc++
      if (q.options.length !== 4) errors.push(`${q.id}: expected 4 options, got ${q.options.length}`)
    } else {
      tf++
      if (q.options.length !== 2 || q.options[0] !== 'True' || q.options[1] !== 'False') errors.push(`${q.id}: TF options must be ["True","False"]`)
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errors.push(`${q.id}: answer index out of range`)
    if (new Set(q.options).size !== q.options.length) errors.push(`${q.id}: duplicate options`)
    if (!q.question?.trim()) errors.push(`${q.id}: empty question`)
    if (!q.explanation?.trim()) errors.push(`${q.id}: empty explanation`)
    if (!q.category?.trim()) errors.push(`${q.id}: empty category`)
  }
}

console.log(`${files.length} sets, ${total} questions (${mc} multiple choice, ${tf} true/false)`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('All question sets valid.')
