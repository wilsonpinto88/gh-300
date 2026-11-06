# GH-300 Practice

Mobile-first web app for studying the GitHub Copilot (GH-300) exam: 12 infographics and 255 practice questions with explanations. Progress is stored locally in the browser; works offline after first load.

Study material originates from [ElmentorProgram/gh300](https://github.com/ElmentorProgram/gh300).

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
- `questions.js` — generated question data
- `infographics/` — the 12 infographics
- `sw.js`, `manifest.webmanifest` — offline + installable (Add to Home Screen)
