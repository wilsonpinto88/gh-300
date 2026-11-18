# GH-300 Practice

Mobile-first web app for studying the GitHub Copilot (GH-300) exam: 14 infographics and 315 practice questions with explanations. Progress is stored locally in the browser; works offline after first load.

Study material originates from [ElmentorProgram/gh300](https://github.com/ElmentorProgram/gh300). Infographics 13–14 and practice tests 11–12 were added to cover skills from the Microsoft study guide (skills measured as of August 7, 2026) that the original material lacked: custom instructions, prompt files, sub-agents and agent sessions, Spark, Copilot CLI, org policies, audit log events, and seat management via the REST API.

## Run locally

```sh
python -m http.server 8000   # then open http://localhost:8000
```

## Regenerate questions

```sh
node scripts/build-questions.mjs <path-to>/source/docs/practice
```

## Layout

- `index.html`, `app.js`, `style.css` — app
- `questions.js` — generated question data (tests 1–10)
- `questions-extra.js` — hand-written questions (tests 11–12); not touched by the build script
- `infographics/` — the 14 infographics
- `sw.js`, `manifest.webmanifest` — offline + installable (Add to Home Screen)
