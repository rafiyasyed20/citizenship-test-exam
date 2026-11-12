# Who Wants to Be a Canadian? 🍁

A "Who Wants to Be a Millionaire"-style practice game for the Canadian citizenship test,
built with React, Vite and Three.js. All 400 questions are written from
*Discover Canada: The Rights and Responsibilities of Citizenship*, the official study guide
(included at `public/assets/book/discover-canada.pdf`).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run validate   # sanity-check every question set (counts, ids, answer indexes)
```

## How it plays

- 20 rounds of 20 questions, plus a **Random Mock Exam** that samples 20 from all 400.
- Real test rules: 20 questions, 45-minute countdown, 15 correct to pass.
- Mix of multiple choice (4 options) and true/false, matching the real exam.
- Options are shuffled every game. One attempt per question, no going back.
- After each answer you see whether you were right, the correct answer, an explanation,
  and the page of the guide it comes from.
- Lifelines for fun: 50:50, Ask the Audience, Phone a Friend.
- Keyboard: `A`–`D` or `1`–`4` to answer, `Enter` for next question.
- Progress (best score, attempts, missed questions) is saved in `localStorage`.
- Three.js backdrop (falling maple leaves, studio rings, stars) that changes mood on
  right/wrong answers. If WebGL is unavailable it falls back to a CSS gradient.

## Editing questions

Questions live in `src/data/sets/set01.json` … `set20.json`. Each file is:

```json
{
  "id": "set01",
  "title": "The Oath & Your Rights",
  "subtitle": "…",
  "topics": ["Oath", "Charter"],
  "questions": [
    {
      "id": "s01q01",
      "type": "mc",                 // "mc" (4 options) or "tf" (["True","False"])
      "category": "Rights & Responsibilities",
      "question": "…",
      "options": ["…", "…", "…", "…"],
      "answer": 1,                  // 0-based index of the correct option
      "explanation": "…",
      "ref": "Discover Canada, p. 8"
    }
  ]
}
```

Add or edit questions, then run `npm run validate`. New `setNN.json` files are picked up
automatically.

## A note on dates

The guide was last revised when Queen Elizabeth II was Sovereign and Canada had 308 ridings.
Where facts have changed (King Charles III since September 2022, 343 ridings from 2025,
the G8 is now the G7), the explanations say so. Always check
[canada.ca](https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/citizenship-test.html)
for the current test rules.
